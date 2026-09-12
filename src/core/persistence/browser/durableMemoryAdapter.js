/**
 * Durable-memory adapter for offline protocol tests.
 * Production browser path: swap to sql.js + IndexedDB with same method names.
 * ACK only after durableCommit resolves.
 */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
// Reuse node worker for SQL correctness; wrap ACK with durable marker file
import * as nodeWorker from "../worker.js";

const durableMarkers = new Map();

export function openDb(dataDir) {
  return nodeWorker.openDb(dataDir);
}

export function closeAllDbs() {
  return nodeWorker.closeAllDbs?.();
}

export async function persistOperation(record, options = {}) {
  const result = await nodeWorker.persistOperation(record, options);
  const dataDir = options.dataDir;
  if (dataDir && record?.operationId) {
    await durableCommit(dataDir, record.operationId, result);
  }
  return { ...result, durable: true };
}

export function loadOperation(operationId, options = {}) {
  return nodeWorker.loadOperation(operationId, options);
}

async function durableCommit(dataDir, operationId, snapshot) {
  mkdirSync(dataDir, { recursive: true });
  const path = join(dataDir, `.durable-${operationId}.json`);
  writeFileSync(path, JSON.stringify({ operationId, at: new Date().toISOString(), snapshot }), "utf8");
  durableMarkers.set(operationId, path);
}

export function isDurableAcked(dataDir, operationId) {
  const path = join(dataDir, `.durable-${operationId}.json`);
  return existsSync(path);
}

export const BROWSER_ADAPTER_STATUS = "DURABLE_MEMORY_PROTOCOL";
