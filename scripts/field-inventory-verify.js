#!/usr/bin/env node
/**
 * PRES-001 — schema.sql vs field inventory.
 * STRICT_INVENTORY=1 → fail on any schema column missing from inventory (FREEZE_PROVEN gate).
 * Default: fail only on inventory rows missing kind/owner/sot/migration; warn on gaps.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.env.STRICT_INVENTORY === "1";
const schema = fs.readFileSync(path.join(root, "docs/core/db/schema.sql"), "utf8");
const invPath = path.join(root, "docs/core/field-inventory.checklist.tsv");
const inv = fs.readFileSync(invPath, "utf8").trim().split("\n");
const header = inv[0].split("\t");
const requiredHeaders = [
  "table",
  "column",
  "kind",
  "owner",
  "editable_after_post",
  "sot",
  "migration_status",
  "documented",
];
let failed = false;
for (const h of requiredHeaders) {
  if (!header.includes(h)) {
    console.error("MISSING_HEADER", h);
    failed = true;
  }
}

const idx = Object.fromEntries(header.map((h, i) => [h, i]));
const rows = new Map();
for (const line of inv.slice(1)) {
  if (!line.trim() || line.startsWith("#")) continue;
  const p = line.split("\t");
  if (p.length < 2) continue;
  const key = `${p[0]}.${p[1]}`;
  rows.set(key, p);
  if (!p[idx.kind]) {
    console.error("FIELD_KIND_MISSING", key);
    failed = true;
  }
  if (!p[idx.owner]) {
    console.error("FIELD_OWNER_MISSING", key);
    failed = true;
  }
  if (!p[idx.sot]) {
    console.error("FIELD_SOT_MISSING", key);
    failed = true;
  }
  if (!p[idx.migration_status]) {
    console.error("FIELD_MIGRATION_MISSING", key);
    failed = true;
  }
}

const creates = [...schema.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)\s*\(([\s\S]*?)\);/g)];
let gaps = 0;
const gapList = [];
for (const [, table, body] of creates) {
  for (const line of body.split("\n")) {
    const s = line.trim().replace(/,$/, "");
    if (!s || s.startsWith("--") || /^(PRIMARY|UNIQUE|CHECK|FOREIGN|CONSTRAINT)/i.test(s)) continue;
    const m = s.match(/^["`]?(\w+)["`]?\s+/);
    if (!m) continue;
    const col = m[1];
    if (["PRIMARY", "UNIQUE", "CHECK", "FOREIGN", "CONSTRAINT", "OR"].includes(col.toUpperCase())) continue;
    const key = `${table}.${col}`;
    if (!rows.has(key)) {
      gaps++;
      if (gapList.length < 30) gapList.push(key);
    }
  }
}

if (gaps > 0) {
  console.warn(`WARN inventory gaps: ${gaps} (set STRICT_INVENTORY=1 for FREEZE_PROVEN fail)`);
  for (const g of gapList) console.warn("  missing", g);
  if (strict) failed = true;
} else {
  console.log("OK inventory covers all parsed schema columns");
}

console.log(`inventory rows=${rows.size} strict=${strict}`);
process.exit(failed ? 1 : 0);
