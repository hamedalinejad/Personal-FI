import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { runInvariantGate } from "../invariants/index.js";
import { persistOperation } from "../../persistence/worker.js";

function stableHash(obj) {
  return createHash("sha256").update(JSON.stringify(obj)).digest("hex");
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

/**
 * P0-006/007 — durable idempotency + required operationId
 */
export async function runAtomicFinancialOperation(command) {
  if (!command || typeof command !== "object") throw new Error("OP_INVALID_COMMAND");
  if (!command.operationId || typeof command.operationId !== "string") {
    throw new Error("OP_OPERATION_ID_REQUIRED");
  }

  const dataDir = command.dataDir || join(process.cwd(), ".pf-data");
  const payloadForHash = {
    type: command.type,
    payload: command.payload ?? null,
    journalLines: command.journalLines || [],
  };
  const commandHash = command.commandHash || stableHash(payloadForHash);

  const idMap = await loadIdempotency(dataDir);
  const prev = idMap[command.operationId];
  if (prev) {
    if (prev.commandHash !== commandHash) throw new Error("OP_IDEMPOTENCY_CONFLICT");
    return { ...prev.result, idempotentReplay: true };
  }

  const journalLines = command.journalLines || [];
  runInvariantGate({ journalLines, rates: command.rates || [] });

  // Domain apply only after validation; persistence is single boundary
  const domainResult =
    typeof command.applyDomain === "function"
      ? await command.applyDomain({
          operationId: command.operationId,
          payload: command.payload,
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

  const persisted = await persistOperation(record, { dataDir });
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
}

export function _resetIdempotencyForTests() {
  /* tests use isolated dataDir */
}
