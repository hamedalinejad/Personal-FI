#!/usr/bin/env node
/**
 * Schema drift: schema.sql ↔ schema.manifest.json ↔ field-inventory
 * Exit 0 = pass, 1 = fail
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const schemaPath = path.join(root, "docs/core/db/schema.sql");
const manifestPath = path.join(root, "docs/core/db/schema.manifest.json");
const invPath = path.join(root, "docs/core/field-inventory.checklist.tsv");

const schema = fs.readFileSync(schemaPath, "utf8");
const sqlTables = new Set(
  [...schema.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map((m) => m[1]),
);

let failed = false;

if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const mTables = new Set(
    (manifest.tables || manifest.tableNames || Object.keys(manifest.tables || {})).map
      ? (Array.isArray(manifest.tables)
          ? manifest.tables.map((t) => (typeof t === "string" ? t : t.name))
          : Object.keys(manifest.tables || {}))
      : [],
  );
  // If manifest has table list, compare
  if (mTables.size > 0) {
    const onlySql = [...sqlTables].filter((t) => !mTables.has(t)).sort();
    const onlyMan = [...mTables].filter((t) => !sqlTables.has(t)).sort();
    if (onlySql.length) {
      console.warn("WARN tables in schema.sql not in manifest:", onlySql.join(", "));
    }
    if (onlyMan.length) {
      failed = true;
      console.error("FAIL tables only in manifest:", onlyMan.join(", "));
    }
  }
  console.log(`schema.sql tables: ${sqlTables.size}; manifest present`);
} else {
  failed = true;
  console.error("FAIL schema.manifest.json missing");
}

const creates = [...schema.matchAll(/CREATE TABLE IF NOT EXISTS (\w+) \((.*?)\);/gs)];
const inv = fs.existsSync(invPath) ? fs.readFileSync(invPath, "utf8") : "";
const invKeys = new Set();
for (const line of inv.split("\n").slice(1)) {
  const [table, col] = line.split("\t");
  if (table && col) invKeys.add(`${table}.${col}`);
}

let missingInv = 0;
for (const [, table, body] of creates) {
  for (const line of body.split("\n")) {
    const s = line.trim().replace(/,$/, "");
    if (!s || s.startsWith("--") || /^(PRIMARY|UNIQUE|CHECK|FOREIGN|CONSTRAINT)/i.test(s))
      continue;
    const m = s.match(/^(\w+)\s+/);
    if (!m) continue;
    const col = m[1];
    if (col.toUpperCase() === col && col.length < 3) continue;
    const key = `${table}.${col}`;
    if (invKeys.size && !invKeys.has(key)) {
      missingInv++;
      if (missingInv <= 10) console.error("FAIL inventory missing:", key);
    }
  }
}
if (invKeys.size && missingInv > 0) {
  failed = true;
  console.error(`FAIL inventory gaps: ${missingInv} columns`);
} else if (invKeys.size) {
  console.log("PASS inventory covers CREATE columns");
} else {
  console.warn("WARN field-inventory empty — skip column coverage");
}

const opMatch = schema.match(/CREATE TABLE IF NOT EXISTS fin_operations \((.*?)\);/s);
if (opMatch) {
  const body = opMatch[1];
  if (!body.includes("'voided'") || body.includes("'reversed'")) {
    if (body.includes("'reversed'")) {
      failed = true;
      console.error("FAIL fin_operations.status must not use reversed");
    }
  }
  if (body.includes("'temp_written'") || body.includes("'swapped'")) {
    failed = true;
    console.error("FAIL durability transport states forbidden");
  }
  if (!body.includes("'sql_committed'")) {
    failed = true;
    console.error("FAIL durability_state must include sql_committed");
  }
} else {
  failed = true;
  console.error("FAIL fin_operations missing");
}

if (failed) {
  console.error("\nSchema drift FAILED");
  process.exit(1);
}
console.log("\nPASS: schema drift checks");
process.exit(0);
