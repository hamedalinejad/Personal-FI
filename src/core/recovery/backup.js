/**
 * Backup/restore with machine metadata package (R-M23 / Phase 3).
 * Corrupt backup must never replace a healthy live DB.
 */
import { copyFile, mkdir, access, writeFile, readFile, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { closeAllDbs, openDb } from "../persistence/worker.js";
import { validateOpenDatabase } from "../persistence/integrity.js";
import { DatabaseSync } from "node:sqlite";

export const BACKUP_FORMAT_VERSION = "1.0.0";

async function sha256File(path) {
  const buf = await readFile(path);
  return createHash("sha256").update(buf).digest("hex");
}

/**
 * Create backup after integrity firewall on source DB.
 */
export async function backupDatabase(dataDir, destPath, extraMeta = {}) {
  closeAllDbs();
  const src = join(dataDir, "personal-fi.sqlite");
  await access(src);

  // Validate source before copy
  const db = openDb(dataDir);
  const integrity = validateOpenDatabase(db, { allowPending: false });
  closeAllDbs();

  await copyFile(src, destPath);
  const checksum = await sha256File(destPath);
  const meta = {
    formatVersion: BACKUP_FORMAT_VERSION,
    schemaVersion: extraMeta.schemaVersion || "locked",
    createdAt: new Date().toISOString(),
    engineVersions: extraMeta.engineVersions || {},
    applicationVersion: extraMeta.applicationVersion || null,
    checksumAlgorithm: "sha256",
    checksumSha256: checksum,
    databasePayload: destPath,
    restoreValidation: "SQLite header + checksum + relational integrity + staged integrity",
    integrityResult: integrity,
    atomicReplace: true,
  };
  await writeFile(destPath + ".meta.json", JSON.stringify(meta, null, 2));
  return { ok: true, path: destPath, meta };
}

function openReadonlyPath(dbPath) {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  return db;
}

/**
 * Restore only if header + checksum + backup integrity + staged integrity pass.
 */
export async function restoreDatabase(backupPath, dataDir, opts = {}) {
  closeAllDbs();
  const buf = await readFile(backupPath);
  const header = buf.subarray(0, 16).toString("utf8");
  if (!header.startsWith("SQLite format 3")) {
    throw new Error("BACKUP_CORRUPT: not a SQLite database");
  }

  if (opts.verifyChecksum !== false) {
    try {
      const metaRaw = await readFile(backupPath + ".meta.json", "utf8");
      const meta = JSON.parse(metaRaw);
      const sum = createHash("sha256").update(buf).digest("hex");
      if (meta.checksumSha256 && meta.checksumSha256 !== sum) {
        throw new Error("BACKUP_CORRUPT: checksum mismatch");
      }
    } catch (e) {
      if (String(e.message).startsWith("BACKUP_CORRUPT")) throw e;
      // meta optional for legacy bare sqlite unless required
      if (opts.requireMeta) throw new Error("BACKUP_CORRUPT: missing meta");
    }
  }

  // Validate backup relational integrity before touching live
  if (opts.skipBackupIntegrity !== true) {
    const bakDb = new DatabaseSync(backupPath);
    try {
      validateOpenDatabase(bakDb, { allowPending: false });
    } finally {
      bakDb.close();
    }
  }

  await mkdir(dataDir, { recursive: true });
  const dest = join(dataDir, "personal-fi.sqlite");
  const stage = dest + ".restoring";
  await copyFile(backupPath, stage);

  // Validate staged copy
  if (opts.skipStagedIntegrity !== true) {
    const staged = new DatabaseSync(stage);
    try {
      validateOpenDatabase(staged, { allowPending: false });
    } finally {
      staged.close();
    }
  }

  await rename(stage, dest);
  return { ok: true, path: dest, atomicReplace: true };
}
