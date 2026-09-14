import { copyFile, mkdir, access } from "node:fs/promises";
import { join } from "node:path";
import { closeAllDbs } from "../persistence/worker.js";

/**
 * v1: file copy of SQLite after closing connections.
 * Production PWA will use IDB durable swap; same API shape.
 */
export async function backupDatabase(dataDir, destPath) {
  closeAllDbs();
  const src = join(dataDir, "personal-fi.sqlite");
  await access(src);
  await copyFile(src, destPath);
  return { ok: true, path: destPath };
}

export async function restoreDatabase(backupPath, dataDir) {
  closeAllDbs();
  const { readFile } = await import("node:fs/promises");
  const buf = await readFile(backupPath);
  // SQLite header: "SQLite format 3\0"
  const header = buf.subarray(0, 16).toString("utf8");
  if (!header.startsWith("SQLite format 3")) {
    throw new Error("BACKUP_CORRUPT: not a SQLite database");
  }
  await mkdir(dataDir, { recursive: true });
  const dest = join(dataDir, "personal-fi.sqlite");
  await copyFile(backupPath, dest);
  return { ok: true, path: dest };
}
