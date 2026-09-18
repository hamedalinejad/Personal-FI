#!/usr/bin/env node
/**
 * SQL consistency checks on a given dataDir SQLite.
 * Usage: node scripts/integrity-audit.js [dataDir]
 *
 * Outcomes:
 *   SKIPPED — no dataDir / no sqlite (not a release proof)
 *   GREEN   — fixture DB checked, no findings
 *   FAIL    — findings present (exit 1)
 *
 * Release proof must invoke with a real fixture dataDir and require GREEN.
 */
import { existsSync } from "fs";
import { join } from "path";
import { DatabaseSync } from "node:sqlite";

const dir = process.argv[2];
if (!dir) {
  console.log("integrity-audit: SKIPPED (no dataDir — not release proof)");
  process.exit(0);
}
const dbPath = join(dir, "personal-fi.sqlite");
if (!existsSync(dbPath)) {
  console.log("integrity-audit: SKIPPED (no sqlite at", dbPath, "— not release proof)");
  process.exit(0);
}
const db = new DatabaseSync(dbPath);
const findings = [];

try {
  const n = db.prepare(`
    SELECT COUNT(*) as c FROM fin_journal_lines jl
    LEFT JOIN fin_journal_entries je ON je.id = jl.entry_id
    WHERE je.id IS NULL`).get().c;
  if (n > 0) findings.push(`orphan_journal_lines:${n}`);
} catch (e) {
  findings.push(`skip_orphan:${e.message}`);
}

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

try {
  const n = db.prepare(`
    SELECT COUNT(*) as c FROM fin_journal_entries je
    JOIN fin_operations o ON o.id = je.operation_id
    WHERE je.post_state IS NOT NULL
      AND NOT (
        (je.post_state = 'posted' AND o.status = 'posted')
        OR (je.post_state = 'draft' AND o.status IN ('draft', 'failed', 'pending'))
        OR (je.post_state = 'void' AND o.status IN ('voided', 'void'))
      )
  `).get().c;
  if (n > 0) findings.push(`post_state_drift:${n}`);
} catch (e) {
  findings.push(`skip_drift:${e.message}`);
}

try {
  const n = db.prepare(`
    SELECT COUNT(*) as c FROM (
      SELECT je.id FROM fin_journal_entries je
      JOIN fin_operations o ON o.id = je.operation_id
      LEFT JOIN fin_journal_lines jl ON jl.entry_id = je.id
      WHERE o.status = 'posted'
      GROUP BY je.id
      HAVING COUNT(jl.id) < 2
    )
  `).get().c;
  if (n > 0) findings.push(`posted_entry_lt_2_lines:${n}`);
} catch (e) {
  findings.push(`skip_entry_lines:${e.message}`);
}

if (findings.length) {
  console.error("integrity-audit FAIL:", findings.join(", "));
  process.exit(1);
}
console.log("integrity-audit: GREEN (fixture DB checked)");
