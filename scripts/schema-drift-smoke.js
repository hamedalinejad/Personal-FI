import { readFileSync } from "node:fs";

const schema = readFileSync("docs/core/db/schema.sql", "utf8");
const tablesDoc = readFileSync("docs/core/db/01-schema-tables.md", "utf8");

const created = new Set(
  [...schema.matchAll(/CREATE TABLE IF NOT EXISTS\s+(\w+)/gi)].map((m) => m[1]),
);

// Fail on duplicate CREATE TABLE names
const allCreates = [...schema.matchAll(/CREATE TABLE IF NOT EXISTS\s+(\w+)/gi)].map(
  (m) => m[1],
);
const counts = {};
for (const t of allCreates) counts[t] = (counts[t] || 0) + 1;
const dups = Object.entries(counts).filter(([, c]) => c > 1);
if (dups.length) {
  console.error("Duplicate CREATE TABLE:", dups);
  process.exit(1);
}

const required = [
  "fin_operations",
  "fin_journal_entries",
  "fin_journal_lines",
  "fin_accounts",
  "ref_instruments",
];
for (const t of required) {
  if (!created.has(t)) {
    console.error("Missing required table", t);
    process.exit(1);
  }
}

console.log("schema-drift-smoke OK tables=", created.size);
