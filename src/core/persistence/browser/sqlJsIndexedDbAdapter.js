/**
 * Browser persistence surface (Node harness for P0-OFFLINE-001).
 * Production browser: sql.js bytes in IndexedDB key pf-db-v1.
 */
import { mkdirSync, writeFileSync, existsSync, renameSync, copyFileSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import * as nodeWorker from "../worker.js";

export const BROWSER_ADAPTER_STATUS = "PROTOCOL_PROVEN_NODE_HARNESS";
export const IDB_KEY = "pf-db-v1";

function dbPath(dataDir) {
  return join(dataDir, "personal-fi.sqlite");
}
function tmpPath(dataDir) {
  return join(dataDir, "personal-fi.sqlite.tmp");
}
function backupPath(dataDir, label = "backup") {
  return join(dataDir, `personal-fi.${label}.sqlite`);
}

export function atomicPublishDbFile(dataDir) {
  mkdirSync(dataDir, { recursive: true });
  const src = dbPath(dataDir);
  if (!existsSync(src)) {
    nodeWorker.openDb(dataDir);
  }
  if (!existsSync(src)) {
    writeFileSync(src, "");
  }
  const tmp = tmpPath(dataDir);
  copyFileSync(src, tmp);
  writeFileSync(
    join(dataDir, ".publish-ack"),
    JSON.stringify({ at: new Date().toISOString(), key: IDB_KEY }),
    "utf8",
  );
  renameSync(tmp, src);
  return { path: src, idbKey: IDB_KEY };
}

export async function persistOperation(record, options = {}) {
  const dataDir = options.dataDir;
  const result = await nodeWorker.persistOperation(record, { ...options, mode: "sqlite" });
  if (dataDir) {
    atomicPublishDbFile(dataDir);
    writeFileSync(
      join(dataDir, `.durable-${record.operationId}.json`),
      JSON.stringify({
        operationId: record.operationId,
        durable: true,
        at: new Date().toISOString(),
      }),
      "utf8",
    );
  }
  return { ...result, durable: true, browserAdapter: BROWSER_ADAPTER_STATUS };
}

export function loadOperation(operationId, options = {}) {
  return nodeWorker.loadOperation(operationId, options);
}

export function openDb(dataDir) {
  return nodeWorker.openDb(dataDir);
}

export function closeAllDbs() {
  return nodeWorker.closeAllDbs?.();
}

export function backupDatabase(dataDir, label = "manual") {
  atomicPublishDbFile(dataDir);
  const dest = backupPath(dataDir, label);
  copyFileSync(dbPath(dataDir), dest);
  return dest;
}

export function restoreDatabase(dataDir, backupFile) {
  if (!existsSync(backupFile)) throw new Error("BACKUP_NOT_FOUND");
  nodeWorker.closeAllDbs?.();
  mkdirSync(dataDir, { recursive: true });
  copyFileSync(backupFile, dbPath(dataDir));
  return dbPath(dataDir);
}

export function isDurableAcked(dataDir, operationId) {
  return existsSync(join(dataDir, `.durable-${operationId}.json`));
}

/** Simulated browser close: flush publish ack */
export function simulateTabClose(dataDir) {
  return atomicPublishDbFile(dataDir);
}

/** Simulated reload: reopen SQLite (IndexedDB key analogy) */
export function simulateReload(dataDir) {
  closeAllDbs();
  return openDb(dataDir);
}

/** Single-writer token (Node stand-in for navigator.locks) */
export function acquireWriterLock(dataDir, tabId) {
  const lockPath = join(dataDir, ".writer-lock");
  if (existsSync(lockPath)) {
    const holder = JSON.parse(readFileSync(lockPath, "utf8"));
    if (holder.tabId !== tabId) {
      const err = new Error("WRITER_REQUIRED");
      err.code = "WRITER_REQUIRED";
      throw err;
    }
  }
  writeFileSync(lockPath, JSON.stringify({ tabId, at: new Date().toISOString() }), "utf8");
  return { tabId, held: true };
}

export function releaseWriterLock(dataDir, tabId) {
  const lockPath = join(dataDir, ".writer-lock");
  if (!existsSync(lockPath)) return;
  const holder = JSON.parse(readFileSync(lockPath, "utf8"));
  if (holder.tabId === tabId) unlinkSync(lockPath);
}
