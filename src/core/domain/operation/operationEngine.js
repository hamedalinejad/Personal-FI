import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { runInvariantGate } from "../invariants/index.js";
import { persistOperation, loadOperation } from "../../persistence/worker.js";

/** P0-CODE-005 — canonical JSON for hashing (sorted object keys, array order preserved). */
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

/** In-process mutex per operationId (P0-CODE-004). Production: DB unique + txn. */
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

/**
 * Atomic financial operation (P0-CODE-002/003/004/005).
 *
 * Model A: domain **prepare** is pure calculation only; durable mutation is
 * the single persistOperation write (operation + journal + domainResult).
 * applyDomain, if provided, runs only as pure prepare alias — must not
 * independently mutate durable stores outside this path.
 *
 * Idempotency: recover from durable operation file first, then map;
 * map updated after persist (crash recovery uses operation file).
 */
export async function runAtomicFinancialOperation(command) {
  if (!command || typeof command !== "object") throw new Error("OP_INVALID_COMMAND");
  if (!command.operationId || typeof command.operationId !== "string") {
    throw new Error("OP_OPERATION_ID_REQUIRED");
  }

  return withOpLock(command.operationId, async () => {
    const dataDir = command.dataDir || join(process.cwd(), ".pf-data");
    const payloadForHash = {
      type: command.type,
      payload: command.payload ?? null,
      journalLines: command.journalLines || [],
    };
    const commandHash = command.commandHash || stableHash(payloadForHash);

    // P0-CODE-003: recover from durable operation record before any domain work
    try {
      const existing = await loadOperation(command.operationId, { dataDir, mode: command.persistMode || 'sqlite' });
      if (existing && ["sql_committed", "swapped", "persisted"].includes(existing.durability_state)) {
        if (existing.commandHash && existing.commandHash !== commandHash) {
          throw new Error("OP_IDEMPOTENCY_CONFLICT");
        }
        return {
          operationId: existing.operationId,
          commandHash: existing.commandHash || commandHash,
          durability_state: existing.durability_state,
          journalLines: existing.journalLines || [],
          domainResult: existing.domainResult ?? null,
          idempotentReplay: true,
        };
      }
    } catch (e) {
      if (e && e.message === "OP_IDEMPOTENCY_CONFLICT") throw e;
      // missing file → continue
    }

    const idMap = await loadIdempotency(dataDir);
    const prev = idMap[command.operationId];
    if (prev) {
      if (prev.commandHash !== commandHash) throw new Error("OP_IDEMPOTENCY_CONFLICT");
      return { ...prev.result, idempotentReplay: true };
    }

    const journalLines = command.journalLines || [];
    runInvariantGate({ journalLines, rates: command.rates || [] });

    // P0-CODE-002: pure prepare only (no durable side effects before persist)
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
      journalLines,
      domainResult,
      durability_state: "pending",
      createdAt: new Date().toISOString(),
    };

    // Single durable boundary — commandHash stored in operation file (P0-CODE-003)
    const persisted = await persistOperation(record, { dataDir, mode: command.persistMode || 'sqlite' });
    const result = {
      operationId: persisted.operationId,
      commandHash,
      durability_state: persisted.durability_state,
      journalLines,
      domainResult,
      idempotentReplay: false,
    };

    idMap[command.operationId] = { commandHash, result };
    await saveIdempotency(dataDir, idMap);
    return result;
  });
}

export function _resetIdempotencyForTests() {
  locks.clear();
}
