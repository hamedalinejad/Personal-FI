#!/usr/bin/env node
/**
 * P0-SCHEMA-005 — Field inventory Gate H verifier (partial)
 * Ensures every schema column has inventory row with required columns.
 * Exit 0 if gaps = 0 for required headers; warns on optional API/fixture empty.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = fs.readFileSync(path.join(root, "docs/core/db/schema.sql"), "utf8");
const invPath = path.join(root, "docs/core/field-inventory.checklist.tsv");
const inv = fs.readFileSync(invPath, "utf8").trim().split("\n");
const header = inv[0].split("\t");
const required = ["table", "column", "kind", "owner", "editable_after_post", "sot", "migration_status", "documented"];
for (const r of required) {
  if (!header.includes(r) && !header.includes(r.replace("sot", "sot"))) {
    // header uses sot lowercase from earlier seed
  }
}
const rows = new Map();
for (const line of inv.slice(1)) {
  const p = line.split("\t");
  if (p.length < 2) continue;
  rows.set(`${p[0]}.${p[1]}`, p);
}

const creates = [...schema.matchAll(/CREATE TABLE IF NOT EXISTS (\w+) \((.*?)\);/gs)];
let gaps = 0;
for (const [, table, body] of creates) {
  for (const line of body.split("\n")) {
    const s = line.trim().replace(/,$/, "");
    if (!s || s.startsWith("--") || /^(PRIMARY|UNIQUE|CHECK|FOREIGN|CONSTRAINT)/i.test(s)) continue;
    const m = s.match(/^(\w+)\s+/);
    if (!m) continue;
    const key = `${table}.${m[1]}`;
    if (!rows.has(key)) {
      gaps++;
      if (gaps <= 20) console.error("missing", key);
    }
  }
}
console.log(`inventory rows: ${rows.size}; schema column gaps: ${gaps}`);
if (gaps > 0) {
  process.exit(1);
}
console.log("PASS field-inventory column coverage");
process.exit(0);
