import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { runInvariantGate } from "../invariants/index.js";
import { persistOperation, loadOperation } from "../../persistence/worker.js";

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

  return withOpLock(command.operationId, async () => {
    const dataDir = command.dataDir || join(process.cwd(), ".pf-data");
    const mode = command.persistMode || "sqlite";
    const payloadForHash = {
      type: command.type,
      payload: command.payload ?? null,
      journalLines: command.journalLines || [],
      businessDate: command.businessDate,
      baseCurrency: command.baseCurrency,
    };
    const commandHash = command.commandHash || stableHash(payloadForHash);

    try {
      const existing = await loadOperation(command.operationId, { dataDir, mode });
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
      // missing → continue
    }

    // SQLite path: identity is fin_operations PK — no parallel idempotency.json required
    if (mode === "json") {
      const idMap = await loadIdempotency(dataDir);
      const prev = idMap[command.operationId];
      if (prev) {
        if (prev.commandHash !== commandHash) throw new Error("OP_IDEMPOTENCY_CONFLICT");
        return { ...prev.result, idempotentReplay: true };
      }
    }

    const journalLines = command.journalLines || [];
    // ensure each line has currency
    for (const line of journalLines) {
      if (!line.currency) line.currency = command.baseCurrency;
    }
    runInvariantGate({ journalLines, rates: command.rates || [] });

    const prepare =
      typeof command.prepareDomain === "function"
        ? command.prepareDomain
        : typeof command.applyDomain === "function"
          ? command.applyDomain
          : null;

    const domainResult = prepare
      ? await prepare({
          operationId: command.operationId,
          payload: command.payload,
          mode: "prepare",
        })
      : command.domainResult || null;

    const record = {
      operationId: command.operationId,
      commandHash,
      type: command.type || "unknown",
      status: command.status || "posted",
      businessDate: command.businessDate,
      baseCurrency: command.baseCurrency,
      journalLines,
      domainResult,
      engineVersions: command.engineVersions || null,
      source: command.source || "api",
      withinTransaction: command.withinTransaction,
    };

    const persisted = await persistOperation(record, { dataDir, mode });
    const result = {
      operationId: persisted.operationId,
      commandHash,
      status: persisted.status || record.status,
      durability_state: persisted.durability_state,
      businessDate: record.businessDate,
      baseCurrency: record.baseCurrency,
      journalLines,
      domainResult,
      engineVersions: command.engineVersions || null,
      idempotentReplay: !!persisted.idempotentReplay,
    };

    if (mode === "json") {
      const idMap = await loadIdempotency(dataDir);
      idMap[command.operationId] = { commandHash, result };
      await saveIdempotency(dataDir, idMap);
    }
    return result;
  });
}

export function _resetIdempotencyForTests() {
  locks.clear();
}
