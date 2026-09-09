#!/usr/bin/env node
/**
 * Generates schema.manifest.json from schema.sql via SQLite introspection + SQL CHECK harvest.
 * D-010 residual: SQLite PRAGMA does not expose all CHECKs; we also parse CHECK (...) from DDL text.
 */
import { readFileSync, writeFileSync, mkdtempSync } from "fs";
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

/** Harvest CHECK clauses per table from DDL (best-effort, order-stable). */
function harvestChecks(ddl) {
  const map = {};
  const re = /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+)\s*\(([\s\S]*?)\)\s*;/gi;
  let m;
  while ((m = re.exec(ddl))) {
    const table = m[1];
    const body = m[2];
    const checks = [];
    const cre = /\bCHECK\s*\(([^)]*(?:\([^)]*\)[^)]*)*)\)/gi;
    let c;
    while ((c = cre.exec(body))) {
      checks.push(c[0].replace(/\s+/g, " ").trim());
    }
    map[table] = checks.sort();
  }
  return map;
}

const checksByTable = harvestChecks(prepared);

const dir = mkdtempSync(join(tmpdir(), "pf-man-"));
const db = new DatabaseSync(join(dir, "m.sqlite"));
db.exec(prepared);

const tables = db
  .prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
  )
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
    checks: checksByTable[name] || [],
  };
}
db.close();

const hash = createHash("sha256").update(JSON.stringify(manifest)).digest("hex");
const out = { schemaHash: hash, tables: manifest.tables };
writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
console.log("Wrote", outPath, "tables", tables.length, "hash", hash.slice(0, 12));
