import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

/**
 * Ordered migration runner (file-backed meta)
 */
export async function runMigrations({ dataDir, migrations }) {
  await mkdir(dataDir, { recursive: true });
  const metaPath = join(dataDir, "schemaVersion.json");
  let version = 0;
  try {
    version = JSON.parse(await readFile(metaPath, "utf8")).version;
  } catch {
    version = 0;
  }
  const applied = [];
  for (const m of migrations) {
    if (m.from !== version) continue;
    if (typeof m.up === "function") await m.up();
    version = m.to;
    applied.push({ id: m.id, from: m.from, to: m.to, success: true });
    await writeFile(metaPath, JSON.stringify({ version }, null, 2));
  }
  return { version, applied };
}
