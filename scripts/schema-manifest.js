#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { DatabaseSync } from "node:sqlite";
import { createHash } from "crypto";

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

const tables = db
  .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
  .all();

const manifest = { tables: {} };
for (const { name } of tables) {
  const cols = db.prepare(`PRAGMA table_info(${name})`).all();
  const fks = db.prepare(`PRAGMA foreign_key_list(${name})`).all();
  const idxs = db.prepare(`PRAGMA index_list(${name})`).all();
  const indexDetails = [];
  for (const ix of idxs) {
    const info = db.prepare(`PRAGMA index_info(${ix.name})`).all();
    indexDetails.push({
      name: ix.name,
      unique: !!ix.unique,
      origin: ix.origin,
      columns: info.map((c) => c.name),
    });
  }
  manifest.tables[name] = {
    columns: cols.map((c) => ({
      name: c.name,
      type: c.type,
      notnull: !!c.notnull,
      dflt: c.dflt_value,
      pk: c.pk,
    })),
    foreignKeys: fks.map((f) => ({
      table: f.table,
      from: f.from,
      to: f.to,
      on_update: f.on_update,
      on_delete: f.on_delete,
    })),
    indexes: indexDetails,
  };
}
db.close();

const canonical = JSON.stringify(manifest);
const hash = createHash("sha256").update(canonical).digest("hex");
const out = { schemaHash: hash, ...manifest };
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log("Wrote", outPath, "tables", Object.keys(manifest.tables).length, "hash", hash.slice(0, 12));
