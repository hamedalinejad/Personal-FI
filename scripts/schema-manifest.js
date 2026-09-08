#!/usr/bin/env node
/**
 * Build machine-readable schema manifest from SQLite after applying schema.sql
 * Compare two runs / export for Gate B semantic freeze.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { DatabaseSync } from "node:sqlite";
import { tmpdir } from "os";
import { mkdtempSync } from "fs";

const schemaPath = join(process.cwd(), "docs/core/db/schema.sql");
const outPath = join(process.cwd(), "docs/core/db/schema.manifest.json");

const sql = readFileSync(schemaPath, "utf8");
const prepared = sql
  .split("\n")
  .map((l) => (l.includes("--") ? l.slice(0, l.indexOf("--")) : l))
  .join("\n");

const dir = mkdtempSync(join(tmpdir(), "pf-manifest-"));
const db = new DatabaseSync(join(dir, "m.sqlite"));
db.exec(prepared);

const tables = db.prepare(
  `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
).all();

const manifest = { generatedAt: new Date().toISOString(), tables: {} };
for (const { name } of tables) {
  const cols = db.prepare(`PRAGMA table_info(${name})`).all();
  const fks = db.prepare(`PRAGMA foreign_key_list(${name})`).all();
  const idxs = db.prepare(`PRAGMA index_list(${name})`).all();
  manifest.tables[name] = {
    columns: cols.map((c) => ({
      name: c.name,
      type: c.type,
      notnull: !!c.notnull,
      dflt: c.dflt_value,
      pk: c.pk,
    })),
    foreignKeys: fks,
    indexes: idxs,
  };
}
db.close();
writeFileSync(outPath, JSON.stringify(manifest, null, 2));
console.log("Wrote", outPath, "tables", Object.keys(manifest.tables).length);
