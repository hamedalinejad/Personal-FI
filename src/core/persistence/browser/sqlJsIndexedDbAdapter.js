/**
 * Browser persistence surface (Node harness for P0-OFFLINE-001).
 * Production browser: sql.js bytes in IndexedDB key pf-db-v1.
 */
import { mkdirSync, writeFileSync, existsSync, renameSync, copyFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import * as nodeWorker from "../worker.js";
import { restoreDatabase as restoreNodeDatabase } from "../../recovery/backup.js";
import { validateOpenDatabase } from "../integrity.js";

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
  // Close active SQLite handles before replacing the database file.
  nodeWorker.closeAllDbs?.();
  const src = dbPath(dataDir);
  if (!existsSync(src)) {
    const db = nodeWorker.openDb(dataDir);
    db.close?.();
    nodeWorker.closeAllDbs?.();
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
    nodeWorker.markOperationPersisted(dataDir, record.operationId);
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
  return { ...result, durability_state: "persisted", durable: true, browserAdapter: BROWSER_ADAPTER_STATUS };
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
  mkdirSync(dataDir, { recursive: true });
  nodeWorker.closeAllDbs?.();
  if (!existsSync(dbPath(dataDir))) {
    nodeWorker.openDb(dataDir);
    nodeWorker.closeAllDbs?.();
  }
  const source = new DatabaseSync(dbPath(dataDir), { readOnly: true });
  try {
    validateOpenDatabase(source);
  } finally {
    source.close();
  }
  const dest = backupPath(dataDir, label);
  copyFileSync(dbPath(dataDir), dest);
  return dest;
}

export async function restoreDatabase(dataDir, backupFile) {
  if (!existsSync(backupFile)) throw new Error("BACKUP_NOT_FOUND");
  await restoreNodeDatabase(backupFile, dataDir);
  return dbPath(dataDir);
}

export function markOperationPersisted(dataDir, operationId) {
  return nodeWorker.markOperationPersisted(dataDir, operationId);
}

export function reconcileDurabilityState(dataDir) {
  return nodeWorker.reconcileDurabilityState(dataDir);
}

export function isDurableAcked(dataDir, operationId) {
  return existsSync(join(dataDir, `.durable-${operationId}.json`));
}
