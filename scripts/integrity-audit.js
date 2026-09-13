#!/usr/bin/env node
/**
 * GAP-034 partial — SQL consistency checks on a given dataDir SQLite.
 * Usage: node scripts/integrity-audit.js [dataDir]
 * Exit 0 if clean or no DB; 1 on findings.
 */
import { existsSync } from "fs";
import { join } from "path";
import { DatabaseSync } from "node:sqlite";

const dir = process.argv[2];
if (!dir) {
  console.log("integrity-audit: no dataDir — skip (OK for CI without DB)");
  process.exit(0);
}
const dbPath = join(dir, "personal-fi.sqlite");
if (!existsSync(dbPath)) {
  console.log("integrity-audit: no sqlite at", dbPath);
  process.exit(0);
}
const db = new DatabaseSync(dbPath);
const findings = [];

// Orphan journal lines without entry
try {
  const n = db.prepare(`
    SELECT COUNT(*) as c FROM fin_journal_lines jl
    LEFT JOIN fin_journal_entries je ON je.id = jl.entry_id
    WHERE je.id IS NULL`).get().c;
  if (n > 0) findings.push(`orphan_journal_lines:${n}`);
} catch (e) {
  findings.push(`skip_orphan:${e.message}`);
}

// Posted ops missing amount_in_base on lines
try {
  const n = db.prepare(`
    SELECT COUNT(*) as c FROM fin_journal_lines jl
    JOIN fin_journal_entries je ON je.id = jl.entry_id
    JOIN fin_operations o ON o.id = je.operation_id
    WHERE o.status = 'posted' AND (jl.amount_in_base IS NULL OR jl.amount_in_base = '')
  `).get().c;
  if (n > 0) findings.push(`posted_missing_amount_in_base:${n}`);
} catch (e) {
  findings.push(`skip_base:${e.message}`);
}

// post_state drift
try {
  const n = db.prepare(`
    SELECT COUNT(*) as c FROM fin_journal_entries je
    JOIN fin_operations o ON o.id = je.operation_id
    WHERE je.post_state IS NOT NULL AND je.post_state != o.status
      AND NOT (je.post_state = 'posted' AND o.status = 'posted')
  `).get().c;
  if (n > 0) findings.push(`post_state_drift:${n}`);
} catch (e) {
  findings.push(`skip_drift:${e.message}`);
}

if (findings.length) {
  console.error("integrity-audit FAIL:", findings.join(", "));
  process.exit(1);
}
console.log("integrity-audit: OK");
