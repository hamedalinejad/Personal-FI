/**
 * Backup/restore with machine metadata package (R-M23).
 * v1 Node: SQLite file + sidecar JSON metadata.
 */
import { copyFile, mkdir, access, writeFile, readFile, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { closeAllDbs } from "../persistence/worker.js";
import { validateOpenDatabase } from "../persistence/integrity.js";

export const BACKUP_FORMAT_VERSION = "1.0.0";

async function sha256File(path) {
  const buf = await readFile(path);
  return createHash("sha256").update(buf).digest("hex");
}

/**
 * Create backup. destPath = path to .sqlite file; metadata written as destPath + ".meta.json"
 */
export async function backupDatabase(dataDir, destPath, extraMeta = {}) {
  closeAllDbs();
  const src = join(dataDir, "personal-fi.sqlite");
  await access(src);
  const sourceDb = new DatabaseSync(src);
  let integrity;
  try {
    integrity = validateOpenDatabase(sourceDb);
  } finally {
    sourceDb.close();
  }
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
    restoreValidation: "SQLite header + checksum + relational accounting integrity",
    integrity,
    atomicReplace: true,
  };
  await writeFile(destPath + ".meta.json", JSON.stringify(meta, null, 2));
  return { ok: true, path: destPath, meta };
}

/**
 * Restore: validate header + optional checksum, then atomic copy into dataDir.
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
      if (meta.formatVersion && meta.formatVersion !== BACKUP_FORMAT_VERSION) {
        throw new Error("BACKUP_FORMAT_UNSUPPORTED:" + meta.formatVersion);
      }
      const sum = createHash("sha256").update(buf).digest("hex");
      if (meta.checksumSha256 && meta.checksumSha256 !== sum) {
        throw new Error("BACKUP_CORRUPT: checksum mismatch");
      }
    } catch (e) {
      const msg = String(e?.message || e);
      if (msg.startsWith("BACKUP_")) throw e;
      if (e instanceof SyntaxError) throw new Error("BACKUP_CORRUPT: invalid metadata");
      // meta optional for legacy bare sqlite backups
    }
  }

  const backupDb = new DatabaseSync(backupPath, { readOnly: true });
  try {
    validateOpenDatabase(backupDb);
  } catch (e) {
    backupDb.close();
    throw new Error("BACKUP_CORRUPT: " + String(e?.message || e));
  }
  backupDb.close();

  await mkdir(dataDir, { recursive: true });
  const dest = join(dataDir, "personal-fi.sqlite");
  const stage = dest + ".restoring";
  await copyFile(backupPath, stage);

  const stagedDb = new DatabaseSync(stage);
  try {
    validateOpenDatabase(stagedDb);
  } catch (e) {
    stagedDb.close();
    try { await readFile(stage); } catch { /* ignore */ }
    throw new Error("BACKUP_CORRUPT: staged validation failed: " + String(e?.message || e));
  } finally {
    try { stagedDb.close(); } catch { /* ignore */ }
  }

  // Replace only after every validation has passed. A failed/corrupt backup never touches dest.
  await rename(stage, dest);
  return { ok: true, path: dest, atomicReplace: true, validated: true };
}
