#!/usr/bin/env node
/**
 * Fail if a public command has zero field-preservation rows (non-deferred).
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
let failed = false;
const commands = catalog.commands || {};
for (const id of Object.keys(commands)) {
  if (deferred.has(id)) continue;
  const rows = byCmd.get(id) || [];
  if (rows.length < 3) {
    console.error("FAIL field-preservation sparse:", id, "rows=", rows.length);
    failed = true;
  }
  // require operationId mapping present
  if (!rows.some((r) => r.field === "operationId")) {
    console.error("FAIL missing operationId row:", id);
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
