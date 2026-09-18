#!/usr/bin/env node
/**
 * Field-preservation gate:
 * - each non-deferred public command has rows including operationId
 * - PERSISTED rows require exact persistence.table + persistence.column
 * - no generic storage language
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
  const disp = row.disposition || "PERSISTED";
  const stored = String(row.stored || "");
  if (GENERIC_RE.test(stored) || GENERIC_RE.test(JSON.stringify(row.persistence || {}))) {
    console.error("FAIL generic storage:", row.commandId, row.field, stored);
    failed = true;
  }
  if (disp === "PERSISTED") {
    if (!row.persistence?.table || !row.persistence?.column) {
      console.error(
        "FAIL PERSISTED without table.column:",
        row.commandId,
        row.field,
      );
      failed = true;
    }
  }
  if (disp === "DERIVED" && !row.formula && !row.resultPath) {
    console.error("FAIL DERIVED without formula/resultPath:", row.commandId, row.field);
    failed = true;
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
);
if (failed) process.exit(1);
console.log("OK");
