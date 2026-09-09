import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { runInvariantGate } from "../invariants/index.js";
import { canonicalDecimalString } from "../../money/canonicalDecimal.js";
import { persistOperation, loadOperation } from "../../persistence/port.js";

export function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

function stableHash(obj) {
  return createHash("sha256").update(stableStringify(obj)).digest("hex");
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

  return {
    operationId: command.operationId,
    type: command.type || "unknown",
    status: command.status || "posted",
    businessDate: command.businessDate,
    baseCurrency,
    payload: command.payload ?? null,
    journalLines,
    rates: command.rates || [],
    domainResult: command.domainResult ?? null,
    engineVersions: command.engineVersions || null,
    source: command.source || "api",
    dataDir: command.dataDir,
    persistMode: command.persistMode || "sqlite",
    withinTransaction: command.withinTransaction,
    prepareDomain: command.prepareDomain || command.applyDomain,
    commandHash: command.commandHash,
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

    const payloadForHash = {
      type: norm.type,
      payload: norm.payload,
      journalLines: norm.journalLines,
      businessDate: norm.businessDate,
      baseCurrency: norm.baseCurrency,
    };
    const commandHash = norm.commandHash || stableHash(payloadForHash);

    // Durable identity first — only OP_NOT_FOUND continues
    try {
      const existing = await loadOperation(norm.operationId, { dataDir, mode });
      if (
        existing &&
        ["sql_committed", "swapped", "persisted"].includes(existing.durability_state)
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
      if (e && e.message === "OP_IDEMPOTENCY_CONFLICT") throw e;
      if (e && e.message === "OP_NOT_FOUND") {
        /* continue */
      } else if (e && e.code === "ENOENT") {
        /* json missing */
      } else if (e && /no such file|ENOENT|OP_NOT_FOUND/i.test(String(e.message))) {
        /* continue */
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

    const domainResult = norm.prepareDomain
      ? await norm.prepareDomain({
          operationId: norm.operationId,
          payload: norm.payload,
          mode: "prepare",
        })
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
