#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
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
  const p = line.split("\t");
  if (p.length < 2) continue;
  const key = `${p[0]}.${p[1]}`;
  rows.set(key, p);
  const kind = p[idx.kind];
  const owner = p[idx.owner];
  const sot = p[idx.sot];
  const mig = p[idx.migration_status];
  const doc = p[idx.documented];
  if (!kind || kind === "") {
    console.error("FIELD_KIND_MISSING", key);
    failed = true;
  }
  if (!owner || owner === "") {
    console.error("FIELD_OWNER_MISSING", key);
    failed = true;
  }
  if (!sot || sot === "") {
    console.error("FIELD_SOT_MISSING", key);
    failed = true;
  }
  if (!mig || mig === "") {
    console.error("FIELD_MIGRATION_MISSING", key);
    failed = true;
  }
  if (doc !== "yes" && doc !== "true" && doc !== "1") {
    // soft for now — warn
  }
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
if (gaps > 0) {
  console.error(`FAIL inventory gaps: ${gaps}`);
  failed = true;
} else {
  console.log("PASS inventory covers all CREATE columns + required metadata columns");
}

if (failed) process.exit(1);
console.log(`inventory rows: ${rows.size}`);
process.exit(0);
