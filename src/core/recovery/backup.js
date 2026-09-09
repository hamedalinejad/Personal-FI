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
  await mkdir(dataDir, { recursive: true });
  const dest = join(dataDir, "personal-fi.sqlite");
  await copyFile(backupPath, dest);
  return { ok: true, path: dest };
}
