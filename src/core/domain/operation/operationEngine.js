import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { runInvariantGate } from "../invariants/index.js";
import { canonicalDecimalString } from "../../money/canonicalDecimal.js";
import { persistOperation, loadOperation } from "../../persistence/port.js";

/**
 * B-038: optional undefined fields are OMITTED (never serialized as null unless caller set null).
 * Arrays preserve index order; object keys sorted.
 */
export function stableStringify(value) {
  if (value === undefined) {
    return undefined; // signal omit to parent
  }
  if (value === null || typeof value !== "object") {
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new Error("HASH_NON_FINITE_NUMBER");
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    // P0-OP-004: undefined in arrays is forbidden (not coerced to null)
    for (const v of value) {
      if (v === undefined) throw new Error("HASH_ARRAY_UNDEFINED_FORBIDDEN");
    }
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  const parts = [];
  for (const k of keys) {
    if (value[k] === undefined) continue; // omit optional undefined
    parts.push(`${JSON.stringify(k)}:${stableStringify(value[k])}`);
  }
  return `{${parts.join(",")}}`;
}

function stableHash(obj) {
  return createHash("sha256").update(stableStringify(obj)).digest("hex");
}

/** P0-OP-003 — fields that participate in economic identity / commandHash */
export function buildEconomicIdentity(norm) {
  return {
    operationType: norm.type,
    payload: norm.payload,
    journalLines: norm.journalLines,
    businessDate: norm.businessDate,
    baseCurrency: norm.baseCurrency,
    settlementDate: norm.settlementDate ?? null,
    eventAt: norm.eventAt ?? null,
    provenance: norm.provenance ?? null,
    rates: norm.rates ?? null,
    engineSemanticVersion: norm.engineVersions?.semantic || norm.engineVersions || null,
  };
}

export function computeCommandHash(norm) {
  return stableHash(buildEconomicIdentity(norm));
}

/**
 * Normalize BEFORE hash — never mutate after hashing.
 */
export function normalizeCommand(command) {
  if (!command || typeof command !== "object") throw new Error("OP_INVALID_COMMAND");
  if (!command.operationId || typeof command.operationId !== "string") {
    throw new Error("OP_OPERATION_ID_REQUIRED");
  }
  if (!command.businessDate || typeof command.businessDate !== "string") {
    throw new Error("OP_BUSINESS_DATE_REQUIRED");
  }
  if (!command.baseCurrency || typeof command.baseCurrency !== "string") {
    throw new Error("OP_BASE_CURRENCY_REQUIRED");
  }

  const baseCurrency = command.baseCurrency;
  const journalLines = (command.journalLines || []).map((line, i) => {
    if (!line.currency) throw new Error("JOURNAL_LINE_CURRENCY_REQUIRED");
    if (!line.accountId && !line.account_id) throw new Error("JOURNAL_LINE_ACCOUNT_REQUIRED");
    if (!line.side || !line.amount) throw new Error("JOURNAL_LINE_INVALID");
    return {
      accountId: line.accountId || line.account_id,
      side: line.side,
      amount: canonicalDecimalString(line.amount),
      amountInBase: line.amountInBase != null ? canonicalDecimalString(line.amountInBase) : line.amount_in_base != null ? canonicalDecimalString(line.amount_in_base) : undefined,
      exchangeRateToBase: line.exchangeRateToBase ?? line.exchange_rate_to_base,
      conversionPath: line.conversionPath ?? line.conversion_path,
      lineKind: line.lineKind ?? line.line_kind,
      reference: line.reference,
      currency: line.currency,
      line_number: line.line_number ?? i + 1,
      memo: line.memo,
    };
  });

  // Business status only: draft|posted|voided|failed (schema). Never "pending" here —
  // durability_state owns pending/sql_committed/persisted (OFFLINE-002).
  const allowedStatus = new Set(["draft", "posted", "voided", "failed"]);
  // P0-OP-005: financial writes with journal lines must declare status explicitly
  let status = command.status;
  if (status == null || status === "") {
    if ((command.journalLines || []).length > 0) {
      throw new Error("OP_STATUS_REQUIRED");
    }
    status = "draft"; // non-financial / empty journal preview default only
  }
  if (!allowedStatus.has(status)) {
    throw new Error(`OP_STATUS_INVALID:${status}`);
  }

  return {
    operationId: command.operationId,
    type: command.type || "unknown",
    status,
    businessDate: command.businessDate,
    baseCurrency,
    settlementDate: command.settlementDate ?? command.settlement_date ?? null,
    eventAt: command.eventAt ?? command.event_at ?? null,
    provenance: command.provenance ?? null,
    sourceChannel: command.sourceChannel ?? command.source_channel ?? command.source ?? null,
    sourceType: command.sourceType ?? command.source_type ?? null,
    sourceReference: command.sourceReference ?? command.source_reference ?? null,
    payload: command.payload ?? null,
    journalLines,
    rates: command.rates || [],
    domainResult: command.domainResult ?? null,
    engineVersions: command.engineVersions || null,
    source: command.sourceChannel ?? command.source_channel ?? command.source ?? "api",
    dataDir: command.dataDir,
    persistMode: command.persistMode || "sqlite",
    withinTransaction: command.withinTransaction,
    prepareDomain: command.prepareDomain || command.applyDomain,
    clientCommandHash: command.commandHash ?? null,
  };
}

async function loadIdempotency(dir) {
  try {
    return JSON.parse(await readFile(join(dir, "idempotency.json"), "utf8"));
  } catch {
    return {};
  }
}

async function saveIdempotency(dir, map) {
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "idempotency.json"), JSON.stringify(map, null, 0));
}

const locks = new Map();

async function withOpLock(operationId, fn) {
  const prev = locks.get(operationId) || Promise.resolve();
  let release;
  const gate = new Promise((r) => {
    release = r;
  });
  const chain = prev.then(() => gate);
  locks.set(
    operationId,
    chain.catch(() => {}).then(() => {
      if (locks.get(operationId) === chain) locks.delete(operationId);
    }),
  );
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}

export async function runAtomicFinancialOperation(command) {
  const norm = normalizeCommand(command);
  return withOpLock(norm.operationId, async () => {
    const dataDir = norm.dataDir || join(process.cwd(), ".pf-data");
    const mode = norm.persistMode;

    // B-037: economic idempotency hash — exclude machine paths / non-economic metadata
    // P0-OP-003 EconomicIdentity — temporal fields that affect accounting enter the hash
    const payloadForHash = {
      operationType: norm.type,
      payload: norm.payload,
      journalLines: norm.journalLines,
      businessDate: norm.businessDate,
      baseCurrency: norm.baseCurrency,
      settlementDate: norm.settlementDate ?? null,
      eventAt: norm.eventAt ?? null,
      provenance: norm.provenance ?? null,
      rates: norm.rates ?? null,
      engineSemanticVersion: norm.engineVersions?.semantic || norm.engineVersions || null,
    };
    const commandHash = stableHash(payloadForHash);
    if (norm.clientCommandHash && norm.clientCommandHash !== commandHash) {
      throw new Error("OP_COMMAND_HASH_MISMATCH");
    }

    // Durable identity first — only OP_NOT_FOUND continues
    try {
      const existing = await loadOperation(norm.operationId, { dataDir, mode });
      if (
        existing &&
        ["sql_committed", "swapped", "persisted", "durable"].includes(existing.durability_state)
      ) {
        if (existing.commandHash && existing.commandHash !== commandHash) {
          throw new Error("OP_IDEMPOTENCY_CONFLICT");
        }
        return {
          operationId: existing.operationId,
          commandHash: existing.commandHash || commandHash,
          status: existing.status,
          durability_state: existing.durability_state,
          businessDate: existing.businessDate,
          baseCurrency: existing.baseCurrency,
          journalLines: existing.journalLines || [],
          domainResult: existing.domainResult ?? null,
          engineVersions: existing.engineVersions ?? null,
          idempotentReplay: true,
        };
      }
    } catch (e) {
      // B-023: only OP_NOT_FOUND means "new operation". All other errors surface.
      if (e && e.message === "OP_IDEMPOTENCY_CONFLICT") throw e;
      if (e && e.message === "OP_NOT_FOUND") {
        /* continue as new operation */
      } else {
        throw e;
      }
    }

    if (mode === "json") {
      const idMap = await loadIdempotency(dataDir);
      const prev = idMap[norm.operationId];
      if (prev) {
        if (prev.commandHash !== commandHash) throw new Error("OP_IDEMPOTENCY_CONFLICT");
        return { ...prev.result, idempotentReplay: true };
      }
    }

    runInvariantGate({ journalLines: norm.journalLines, rates: norm.rates });

    const operationContext = Object.freeze({
      operationId: norm.operationId,
      status: norm.status,
      businessDate: norm.businessDate,
      baseCurrency: norm.baseCurrency,
      settlementDate: norm.settlementDate ?? null,
      eventAt: norm.eventAt ?? null,
      sourceChannel: norm.sourceChannel ?? null,
      sourceType: norm.sourceType ?? null,
      sourceReference: norm.sourceReference ?? null,
      source: norm.source,
      provenance: norm.provenance ?? null,
      commandHash,
      engineVersions: norm.engineVersions ?? null,
      payload: norm.payload ?? null,
      mode: "prepare",
    });

    const domainResult = norm.prepareDomain
      ? await norm.prepareDomain(operationContext)
      : norm.domainResult;

    const record = {
      operationId: norm.operationId,
      commandHash,
      type: norm.type,
      status: norm.status,
      businessDate: norm.businessDate,
      baseCurrency: norm.baseCurrency,
      journalLines: norm.journalLines,
      domainResult,
      engineVersions: norm.engineVersions,
      source: norm.source,
      sourceChannel: norm.sourceChannel ?? null,
      sourceType: norm.sourceType ?? null,
      sourceReference: norm.sourceReference ?? null,
      payload: norm.payload ?? null,
      normalizedRequest: {
        type: norm.type,
        businessDate: norm.businessDate,
        baseCurrency: norm.baseCurrency,
        payload: norm.payload ?? null,
        journalLines: norm.journalLines,
        settlementDate: norm.settlementDate ?? null,
        eventAt: norm.eventAt ?? null,
        provenance: norm.provenance ?? null,
        sourceChannel: norm.sourceChannel ?? null,
        sourceType: norm.sourceType ?? null,
        sourceReference: norm.sourceReference ?? null,
      },
      rates: norm.rates ?? null,
      settlementDate: norm.settlementDate ?? null,
      eventAt: norm.eventAt ?? null,
      provenance: norm.provenance ?? null,
      withinTransaction: norm.withinTransaction,
    };

    const persisted = await persistOperation(record, { dataDir, mode });
    const result = {
      operationId: persisted.operationId,
      commandHash,
      status: persisted.status || record.status,
      durability_state: persisted.durability_state,
      businessDate: record.businessDate,
      baseCurrency: record.baseCurrency,
      journalLines: norm.journalLines,
      domainResult,
      engineVersions: norm.engineVersions,
      idempotentReplay: !!persisted.idempotentReplay,
    };

    if (mode === "json") {
      const idMap = await loadIdempotency(dataDir);
      idMap[norm.operationId] = { commandHash, result };
      await saveIdempotency(dataDir, idMap);
    }
    return result;
  });
}

export function _resetIdempotencyForTests() {
  locks.clear();
}
