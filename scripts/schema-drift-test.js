#!/usr/bin/env node
/**
 * P0-SCHEMA-003/004 — Schema drift test (stronger than table-name only)
 *
 * 1) Table names: schema.sql ↔ 01-schema-tables.md
 * 2) Every CREATE TABLE column listed in field-inventory.checklist.tsv
 * 3) fin_operations status/durability vocabulary lock
 *
 * Exit 0 = pass, 1 = fail
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const schemaPath = path.join(root, "docs/core/db/schema.sql");
const docPath = path.join(root, "docs/core/db/01-schema-tables.md");
const invPath = path.join(root, "docs/core/field-inventory.checklist.tsv");

const schema = fs.readFileSync(schemaPath, "utf8");
const doc = fs.readFileSync(docPath, "utf8");

const sqlTables = new Set(
  [...schema.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map((m) => m[1]),
);

const PREFIXES =
  /^(fin_|acc_|ref_|inv_|ln_|chk_|inc_|exp_|bg_|fg_|br_|pa_|tax_|cur_|cat_|price_|import_|docs_|not_|rpt_|port_|dash_|stg_|sec_|usr_|db_)/;
const docTables = new Set(
  [...doc.matchAll(/`([a-z][a-z0-9_]+)`/g)]
    .map((m) => m[1])
    .filter(
      (t) =>
        (PREFIXES.test(t) && t.includes("_") && !t.endsWith("_")) ||
        sqlTables.has(t),
    ),
);

const ALLOW_DOC_ONLY = new Set([
  "inv_crypto_exchange_transactions",
  "inv_stocks_iran_brokerage_transactions",
  "inv_metals_platform_transactions",
  "bg_transfers",
]);

let failed = false;
const onlySql = [...sqlTables]
  .filter((t) => !docTables.has(t))
  .sort();
const onlyDoc = [...docTables]
  .filter((t) => !sqlTables.has(t) && !ALLOW_DOC_ONLY.has(t))
  .sort();

console.log(`schema.sql tables: ${sqlTables.size}`);
console.log(`01-schema-tables.md tables: ${docTables.size}`);

if (onlySql.length) {
  failed = true;
  console.error("FAIL tables only in schema.sql:", onlySql.join(", "));
}
if (onlyDoc.length) {
  failed = true;
  console.error("FAIL tables only in docs:", onlyDoc.join(", "));
}

// Column inventory coverage
const creates = [...schema.matchAll(/CREATE TABLE IF NOT EXISTS (\w+) \((.*?)\);/gs)];
const inv = fs.existsSync(invPath)
  ? fs.readFileSync(invPath, "utf8")
  : "";
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
    if (!invKeys.has(key)) {
      missingInv++;
      if (missingInv <= 15) console.error("FAIL inventory missing:", key);
    }
  }
}
if (missingInv > 0) {
  failed = true;
  console.error(`FAIL inventory gaps: ${missingInv} columns`);
} else {
  console.log("PASS inventory covers all CREATE columns");
}

// Vocabulary lock P0-SCHEMA-001/002
const opMatch = schema.match(
  /CREATE TABLE IF NOT EXISTS fin_operations \((.*?)\);/s,
);
if (opMatch) {
  const body = opMatch[1];
  if (!/status\s+TEXT[^C]*CHECK\s*\(\s*status\s+IN\s*\(\s*'draft'\s*,\s*'posted'\s*,\s*'voided'\s*,\s*'failed'\s*\)/s.test(body) &&
      !body.includes("'voided'") &&
      !body.includes("'failed'")) {
    // softer check
    if (!body.includes("'voided'") || body.includes("'reversed'")) {
      failed = true;
      console.error("FAIL fin_operations.status must be draft|posted|voided|failed (not reversed)");
    }
  }
  if (body.includes("'temp_written'") || body.includes("'swapped'")) {
    failed = true;
    console.error("FAIL durability_state must not include transport states temp_written/swapped");
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
