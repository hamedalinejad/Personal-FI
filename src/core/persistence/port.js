/**
 * Persistence Port — business code talks only to this surface.
 * Node adapter: worker.js (node:sqlite)
 * Future PWA: sql.js + IndexedDB adapter with same method names.
 */
import * as nodeWorker from "./worker.js";

let adapter = nodeWorker;

export function usePersistenceAdapter(next) {
  adapter = next;
}

export function getPersistenceAdapter() {
  return adapter;
}

export function openDb(dataDir) {
  return adapter.openDb(dataDir);
}

export function closeAllDbs() {
  return adapter.closeAllDbs?.();
}

export async function persistOperation(record, options = {}) {
  return adapter.persistOperation(record, options);
}

/** loadOperation(operationId, { dataDir, mode }) */
export function loadOperation(operationId, options = {}) {
  return adapter.loadOperation(operationId, options);
}

export function markOperationPersisted(dataDir, operationId) {
  if (!adapter.markOperationPersisted) throw new Error("PERSISTENCE_ACK_UNSUPPORTED");
  return adapter.markOperationPersisted(dataDir, operationId);
}

export function reconcileDurabilityState(dataDir) {
  if (!adapter.reconcileDurabilityState) throw new Error("PERSISTENCE_RECOVERY_UNSUPPORTED");
  return adapter.reconcileDurabilityState(dataDir);
}
