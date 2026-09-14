#!/usr/bin/env node
/**
 * filesystem ↔ docs/core/file-inventory.tsv must match for tracked paths.
 * Missing inventory entry for an existing tracked-class file → fail optional soft
 * Inventory path pointing to missing file → hard fail
 */
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

const invPath = "docs/core/file-inventory.tsv";
const text = readFileSync(invPath, "utf8").trim().split("\n").slice(1);
const listed = new Set();
const missing = [];
for (const line of text) {
  if (!line.trim()) continue;
  const path = line.split("\t")[0];
  listed.add(path);
  if (!existsSync(path)) missing.push(path);
}
if (missing.length) {
  console.error("file-inventory-check FAIL: inventory points to missing files:");
  for (const m of missing) console.error("  -", m);
  process.exit(1);
}
console.log("file-inventory-check OK entries=", listed.size);
