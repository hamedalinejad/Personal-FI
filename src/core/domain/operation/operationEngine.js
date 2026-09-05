import { randomUUID } from "node:crypto";
import { runInvariantGate } from "../invariants/index.js";
import { persistOperation } from "../../persistence/worker.js";

/**
 * In-memory idempotency store (process-local). Production → durable table.
 */
const idempotency = new Map();

/**
 * runAtomicFinancialOperation
 * validate → domain apply (caller plan) → journal balance → persist
 */
export async function runAtomicFinancialOperation(command) {
  if (!command || typeof command !== "object") {
    throw new Error("OP_INVALID_COMMAND");
  }
  const commandHash =
    command.commandHash ||
    command.operationId ||
    JSON.stringify({
      type: command.type,
      payload: command.payload,
    });

  if (idempotency.has(commandHash)) {
    return { ...idempotency.get(commandHash), idempotentReplay: true };
  }

  const operationId = command.operationId || randomUUID();
  const journalLines = command.journalLines || [];
  runInvariantGate({
    journalLines,
    rates: command.rates || [],
  });

  const domainResult =
    typeof command.applyDomain === "function"
      ? await command.applyDomain({ operationId, payload: command.payload })
      : command.domainResult || null;

  const record = {
    operationId,
    commandHash,
    type: command.type || "unknown",
    journalLines,
    domainResult,
    durability_state: "pending",
    createdAt: new Date().toISOString(),
  };

  const persisted = await persistOperation(record, { dataDir: command.dataDir });
  const result = {
    operationId: persisted.operationId,
    commandHash,
    durability_state: persisted.durability_state,
    journalLines,
    domainResult,
    idempotentReplay: false,
  };
  idempotency.set(commandHash, result);
  return result;
}

export function _resetIdempotencyForTests() {
  idempotency.clear();
}
