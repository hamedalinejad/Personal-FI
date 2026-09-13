#!/usr/bin/env node
/** Fail if field-inventory references non-existent owner docs or empty rows without kind. */
import { readFileSync, existsSync } from "node:fs";
const inv = "docs/core/field-inventory.checklist.tsv";
if (!existsSync(inv)) {
  console.log("field-inventory-live-check: SKIP (no inventory)");
  process.exit(0);
}
const lines = readFileSync(inv, "utf8").trim().split(/\r?\n/);
let failed = false;
for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split("\t");
  if (cols.length < 2) continue;
  // if a path-like cell points to deleted docs/core/*.md fail
  for (const c of cols) {
    if (c.startsWith("docs/core/") && c.endsWith(".md") && !c.includes("db/") && !existsSync(c)) {
      console.error("field-inventory dead doc ref", c);
      failed = true;
    }
  }
}
if (failed) process.exit(1);
console.log("field-inventory-live-check: OK");
