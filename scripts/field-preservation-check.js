#!/usr/bin/env node
/**
 * Field-preservation gate:
 * - each non-deferred public command has rows including operationId
 * - PERSISTED rows require exact persistence.table + column that exist in schema
 * - catalog request fields must appear in matrix (parity)
 * - requiredness parity
 * - no duplicate commandId+canonicalField (except ALIAS)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, "docs/core/registry/command-catalog.json"), "utf8"),
);
const matrix = JSON.parse(
  fs.readFileSync(path.join(root, "docs/core/registry/field-preservation-matrix.json"), "utf8"),
);
const schema = fs.readFileSync(path.join(root, "docs/core/db/schema.sql"), "utf8");

let schemaCols = new Set();
for (const m of schema.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)\s*\(([\s\S]*?)\);/g)) {
  const table = m[1];
  for (const line of m[2].split("\n")) {
    const s = line.trim().replace(/,$/, "");
    if (!s || s.startsWith("--") || /^(PRIMARY|UNIQUE|CHECK|FOREIGN|CONSTRAINT)/i.test(s)) continue;
    const cm = s.match(/^["`]?(\w+)["`]?\s+/);
    if (!cm) continue;
    const col = cm[1];
    if (["PRIMARY", "UNIQUE", "CHECK", "FOREIGN", "CONSTRAINT", "OR"].includes(col.toUpperCase())) continue;
    schemaCols.add(`${table}.${col}`);
  }
}

// Prefer authoritative manifest column set (P0-02)
try {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "docs/core/db/schema.manifest.json"), "utf8"),
  );
  const mcols = new Set();
  for (const t of manifest.tables || []) {
    const tname = t.name || t.table;
    for (const col of t.columns || []) {
      const cname = typeof col === "string" ? col : col.name;
      if (tname && cname) mcols.add(`${tname}.${cname}`);
    }
  }
  if (mcols.size >= schemaCols.size) schemaCols = mcols;
} catch {
  /* keep regex parse */
}

const byCmd = new Map();
for (const row of matrix.rows || []) {
  if (!byCmd.has(row.commandId)) byCmd.set(row.commandId, []);
  byCmd.get(row.commandId).push(row);
}

const deferred = new Set(
  Object.values(catalog.deferred || {})
    .flat()
    .map(String),
);

const GENERIC_RE = /module_or_core|feature ledger via|fin_\*|inv_\*_|\betc\b/i;
let failed = false;
const commands = catalog.commands || {};
const allRows = matrix.rows || [];

for (const id of Object.keys(commands)) {
  if (deferred.has(id) || commands[id].status === "DEFERRED") continue;
  const rows = byCmd.get(id) || [];
  if (rows.length < 3) {
    console.error("FAIL field-preservation sparse:", id, "rows=", rows.length);
    failed = true;
  }
  if (!rows.some((r) => r.field === "operationId" || r.canonicalField === "operationId")) {
    console.error("FAIL missing operationId row:", id);
    failed = true;
  }
}

for (const row of allRows) {
  const disp = String(row.disposition || "PERSISTED").toUpperCase();
  const stored = String(row.stored || "");
  const pers = row.persistence || {};
  if (GENERIC_RE.test(stored) || GENERIC_RE.test(JSON.stringify(pers))) {
    console.error("FAIL generic storage:", row.commandId, row.field, stored);
    failed = true;
  }
  if (disp === "PERSISTED" || pers.mode === "COLUMN" || pers.mode === "PROJECTION") {
    if (disp === "DERIVED" || disp === "DEFERRED" || disp === "REJECTED") {
      // disposition wins
    } else if (pers.mode === "DERIVED" || pers.mode === "DEFERRED") {
      // ok
    } else {
      if (!pers.table || !pers.column) {
        console.error("FAIL PERSISTED without table.column:", row.commandId, row.field);
        failed = true;
      } else {
        const key = `${pers.table}.${pers.column}`;
        if (!schemaCols.has(key)) {
          console.error("FAIL PERSISTED column missing in schema:", row.commandId, row.field, key);
          failed = true;
        }
      }
    }
  }
  if (!row.kind) {
    console.error("FAIL missing kind:", row.commandId, row.field);
    failed = true;
  }
  if (!row.canonicalField) {
    console.error("FAIL missing canonicalField:", row.commandId, row.field);
    failed = true;
  }
}

// catalog request-field parity (P0-01)
const matrixByCmd = new Map();
const seenCanon = new Map();
for (const r of allRows) {
  if (!matrixByCmd.has(r.commandId)) matrixByCmd.set(r.commandId, new Set());
  const key = r.canonicalField || r.field;
  matrixByCmd.get(r.commandId).add(key);
  const k = `${r.commandId}::${key}`;
  if (seenCanon.has(k) && r.disposition !== "ALIAS") {
    console.error("FAIL duplicate canonical row:", k);
    failed = true;
  }
  seenCanon.set(k, true);
}
for (const [cmdId, meta] of Object.entries(commands)) {
  if (meta.status === "DEFERRED" || deferred.has(cmdId)) continue;
  const fields = meta.card?.requestFields || [];
  const mset = matrixByCmd.get(cmdId) || new Set();
  for (const f of fields) {
    if (f.aliasOf) continue;
    if (!mset.has(f.name)) {
      console.error(`FAIL matrix missing catalog field: ${cmdId}.${f.name}`);
      failed = true;
    } else {
      const row = allRows.find(
        (r) => r.commandId === cmdId && (r.canonicalField === f.name || r.field === f.name),
      );
      if (
        row &&
        typeof f.required === "boolean" &&
        typeof row.required === "boolean" &&
        f.required !== row.required
      ) {
        console.error(
          `FAIL requiredness mismatch: ${cmdId}.${f.name} catalog=${f.required} matrix=${row.required}`,
        );
        failed = true;
      }
    }
  }
}

console.log(
  "field-preservation-check: commands=",
  Object.keys(commands).length,
  "matrixRows=",
  allRows.length,
  "schemaCols=",
  schemaCols.size,
);
if (failed) process.exit(1);
console.log("OK");
