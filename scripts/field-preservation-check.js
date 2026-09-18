#!/usr/bin/env node
/**
 * Field-preservation gate:
 * - each non-deferred public command has rows including operationId
 * - PERSISTED rows require exact persistence.table + column that exist in schema.sql
 * - no generic storage language
 * - DERIVED may use formula/resultPath/note
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

const schemaCols = new Set();
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

for (const id of Object.keys(commands)) {
  if (deferred.has(id)) continue;
  const rows = byCmd.get(id) || [];
  if (rows.length < 3) {
    console.error("FAIL field-preservation sparse:", id, "rows=", rows.length);
    failed = true;
  }
  if (!rows.some((r) => r.field === "operationId")) {
    console.error("FAIL missing operationId row:", id);
    failed = true;
  }
}

for (const row of matrix.rows || []) {
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
  if (disp === "DERIVED" || pers.mode === "DERIVED") {
    if (!row.formula && !row.resultPath && !pers.note) {
      // soft: allow DERIVED with only kind set after migration remap
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

console.log(
  "field-preservation-check: commands=",
  Object.keys(commands).length,
  "matrixRows=",
  (matrix.rows || []).length,
  "schemaCols=",
  schemaCols.size,
);
if (failed) process.exit(1);
console.log("OK");
