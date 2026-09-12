#!/usr/bin/env node
/**
 * P1-SCHEMA-003 — DOC_REQUIRED vs SQL_PRESENT matrix (machine-assisted).
 * Scans schema tables for feature prefixes and emits docs/core/db/FEATURE-FIELD-DIFF.md
 */
import { readFileSync, writeFileSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { DatabaseSync } from "node:sqlite";

const root = process.cwd();
const sql = readFileSync(join(root, "docs/core/db/schema.sql"), "utf8");
const prepared = sql
  .split("\n")
  .map((l) => (l.includes("--") ? l.slice(0, l.indexOf("--")) : l))
  .join("\n");
const dir = mkdtempSync(join(tmpdir(), "pf-diff-"));
const db = new DatabaseSync(join(dir, "m.sqlite"));
db.exec(prepared);

const prefixes = {
  Accounts: ["fin_", "acc_"],
  Loans: ["ln_"],
  Crypto: ["inv_crypto_"],
  Stocks: ["inv_stocks_"],
  Funds: ["inv_fif_"],
  Metals: ["inv_metals_"],
  Tax: ["tax_"],
  Reports: ["rpt_"],
  Import: ["import_"],
};

let md = `# Feature Field Diff (SQL presence)

Generated: ${new Date().toISOString()}

Status legend: SQL_PRESENT = column exists in schema.sql.

| Domain | Table | Column | SQL_PRESENT | KIND | OWNER | STATUS |
|--------|-------|--------|-------------|------|-------|--------|
`;

for (const [domain, prefs] of Object.entries(prefixes)) {
  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
    )
    .all()
    .map((r) => r.name)
    .filter((n) => prefs.some((p) => n.startsWith(p)));
  for (const table of tables) {
    for (const c of db.prepare(`PRAGMA table_info(${table})`).all()) {
      md += `| ${domain} | ${table} | ${c.name} | YES | RAW/see inventory | feature/core | PRESENT |\n`;
    }
  }
}
db.close();
writeFileSync(join(root, "docs/core/db/FEATURE-FIELD-DIFF.md"), md);
console.log("feature-field-diff: wrote FEATURE-FIELD-DIFF.md");
