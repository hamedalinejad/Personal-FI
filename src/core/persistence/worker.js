import { mkdir, writeFile, rename, readFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const DEFAULT_DIR = join(process.cwd(), ".pf-data");

/**
 * Write-to-temp-then-swap durable path (filesystem stand-in for SQLite+IDB).
 * States: pending → temp_written → committed → swapped
 */
export async function persistOperation(record, options = {}) {
  const dir = options.dataDir || DEFAULT_DIR;
  await mkdir(dir, { recursive: true });
  const id = record.operationId || randomUUID();
  const tempPath = join(dir, `${id}.tmp.json`);
  const finalPath = join(dir, `${id}.json`);

  let state = "pending";
  const body = { ...record, operationId: id, durability_state: state };
  await writeFile(tempPath, JSON.stringify(body), "utf8");
  state = "temp_written";

  const committed = { ...body, durability_state: "committed" };
  await writeFile(tempPath, JSON.stringify(committed), "utf8");
  state = "committed";

  await rename(tempPath, finalPath);
  state = "swapped";

  const finalBody = { ...committed, durability_state: state };
  await writeFile(finalPath, JSON.stringify(finalBody), "utf8");
  return finalBody;
}

export async function loadOperation(operationId, options = {}) {
  const dir = options.dataDir || DEFAULT_DIR;
  const finalPath = join(dir, `${operationId}.json`);
  const raw = await readFile(finalPath, "utf8");
  return JSON.parse(raw);
}
