#!/usr/bin/env node
/**
 * OPEN-001 / BUG-001 — Schema drift test
 * Compares CREATE TABLE names in docs/core/db/schema.sql
 * vs documented tables in docs/core/db/01-schema-tables.md
 *
 * Exit 0 = pass, 1 = fail
 * Usage: node scripts/schema-drift-test.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const schemaPath = path.join(root, "docs/core/db/schema.sql");
const docPath = path.join(root, "docs/core/db/01-schema-tables.md");

const schema = fs.readFileSync(schemaPath, "utf8");
const doc = fs.readFileSync(docPath, "utf8");

const sqlTables = new Set(
  [...schema.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map((m) => m[1])
);

const PREFIXES =
  /^(fin_|acc_|ref_|inv_|ln_|chk_|inc_|exp_|bg_|fg_|br_|pa_|tax_|cur_|cat_|price_|import_|docs_|not_|rpt_|port_|dash_|stg_|sec_|usr_|db_)/;
const docTables = new Set(
  [...doc.matchAll(/`([a-z][a-z0-9_]+)`/g)]
    .map((m) => m[1])
    .filter((t) => (PREFIXES.test(t) && t.includes("_") && t.split("_").pop().length > 0 && !t.endsWith("_")) || sqlTables.has(t))
);

// Ghost cash ledgers intentionally omitted from schema
const ALLOW_DOC_ONLY = new Set([
  "inv_crypto_exchange_transactions",
  "inv_stocks_iran_brokerage_transactions",
  "inv_metals_platform_transactions",
  "bg_transfers",
]);
const ALLOW_SQL_ONLY = new Set([]);

const onlySql = [...sqlTables]
  .filter((t) => !docTables.has(t) && !ALLOW_SQL_ONLY.has(t))
  .sort();
const onlyDoc = [...docTables]
  .filter((t) => !sqlTables.has(t) && !ALLOW_DOC_ONLY.has(t))
  .sort();

let failed = false;
console.log(`schema.sql tables: ${sqlTables.size}`);
console.log(`01-schema-tables.md tables: ${docTables.size}`);

if (onlySql.length) {
  failed = true;
  console.error("\nFAIL: tables in schema.sql but missing from 01-schema-tables.md:");
  onlySql.forEach((t) => console.error("  +", t));
}
if (onlyDoc.length) {
  failed = true;
  console.error("\nFAIL: tables in 01-schema-tables.md but missing CREATE in schema.sql:");
  onlyDoc.forEach((t) => console.error("  -", t));
}

if (!failed) {
  console.log("\nPASS: no table-name drift between schema.sql and 01-schema-tables.md");
  process.exit(0);
}
console.error("\nSchema drift detected. Update schema.sql or 01-schema-tables.md.");
process.exit(1);
