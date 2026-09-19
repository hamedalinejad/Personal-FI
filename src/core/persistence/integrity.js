/**
 * Phase 3 — Database Integrity Validator (consistency firewall).
 * Relational journal + operations must pass before reconcile/backup/restore promote.
 */
import { assertJournalBalanced } from "../domain/invariants/index.js";
import { toDecimal } from "../money/canonicalDecimal.js";

const VALID_DURABILITY = new Set(["pending", "sql_committed", "persisted", "persist_failed"]);

/**
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {{ allowPending?: boolean }} [opts]
 * @returns {{ ok: true, checks: string[] } | never}
 */
export function validateOpenDatabase(db, opts = {}) {
  const allowPending = opts.allowPending === true;
  const checks = [];

  // 1. PRAGMA integrity_check
  const integrity = db.prepare("PRAGMA integrity_check").get();
  const integrityVal = integrity?.integrity_check ?? Object.values(integrity || {})[0];
  if (String(integrityVal).toLowerCase() !== "ok") {
    throw new Error(`DB_INTEGRITY_CHECK_FAILED:${integrityVal}`);
  }
  checks.push("pragma_integrity_check");

  // 2. PRAGMA foreign_key_check
  const fkRows = db.prepare("PRAGMA foreign_key_check").all();
  if (fkRows.length > 0) {
    throw new Error(`DB_FOREIGN_KEY_VIOLATION:${fkRows.length}`);
  }
  checks.push("pragma_foreign_key_check");

  // 3. surviving pending durability (unless allowed during open write)
  if (!allowPending) {
    const pending = db
      .prepare(
        `SELECT id FROM fin_operations WHERE durability_state = 'pending' LIMIT 5`,
      )
      .all();
    if (pending.length) {
      throw new Error(`DB_PENDING_DURABILITY_SURVIVED:${pending.map((r) => r.id).join(",")}`);
    }
  }
  checks.push("no_orphaned_pending");

  // 4–6 posted operations shape
  const posted = db
    .prepare(
      `SELECT id, command_hash, status, durability_state FROM fin_operations WHERE status = 'posted'`,
    )
    .all();
  for (const op of posted) {
    if (!op.command_hash) throw new Error(`DB_POSTED_MISSING_COMMAND_HASH:${op.id}`);
    const entry = db
      .prepare(`SELECT id, post_state FROM fin_journal_entries WHERE operation_id = ?`)
      .get(op.id);
    if (!entry) throw new Error(`DB_POSTED_MISSING_JOURNAL:${op.id}`);
    if (entry.post_state && entry.post_state !== "posted") {
      throw new Error(`DB_POSTED_JOURNAL_POST_STATE:${op.id}:${entry.post_state}`);
    }
    const lines = db
      .prepare(
        `SELECT account_id, side, amount, currency, amount_in_base, exchange_rate_to_base, line_number
         FROM fin_journal_lines WHERE entry_id = ? ORDER BY line_number`,
      )
      .all(entry.id);
    if (lines.length < 2) throw new Error(`DB_POSTED_JOURNAL_MIN_LINES:${op.id}`);

    // 7. duplicate line numbers
    const seen = new Set();
    for (const ln of lines) {
      if (ln.line_number != null) {
        if (seen.has(ln.line_number)) {
          throw new Error(`DB_JOURNAL_LINE_NUMBER_DUPLICATE:${op.id}:${ln.line_number}`);
        }
        seen.add(ln.line_number);
      }
    }

    // 8. journal balance via kernel
    const journalLines = lines.map((l) => ({
      accountId: l.account_id,
      side: l.side,
      amount: l.amount,
      currency: l.currency,
      amountInBase: l.amount_in_base,
      exchangeRateToBase: l.exchange_rate_to_base,
      line_number: l.line_number,
    }));
    const opRow = db.prepare(`SELECT base_currency FROM fin_operations WHERE id = ?`).get(op.id);
    try {
      assertJournalBalanced(journalLines, {
        baseCurrency: opRow?.base_currency || null,
        posted: true,
      });
    } catch (e) {
      throw new Error(`DB_JOURNAL_UNBALANCED:${op.id}:${e.message}`);
    }

    // 9–10 accounts + currency match
    for (const l of lines) {
      const acc = db.prepare(`SELECT id, currency FROM fin_accounts WHERE id = ?`).get(l.account_id);
      if (!acc) throw new Error(`DB_JOURNAL_ACCOUNT_MISSING:${op.id}:${l.account_id}`);
      if (acc.currency && l.currency && acc.currency !== l.currency) {
        throw new Error(`DB_JOURNAL_ACCOUNT_CURRENCY_MISMATCH:${op.id}:${l.account_id}`);
      }
    }
  }
  checks.push("posted_operations");

  // 11. invalid durability state
  const badDur = db
    .prepare(
      `SELECT id, durability_state FROM fin_operations
       WHERE durability_state IS NOT NULL
         AND durability_state NOT IN ('pending','sql_committed','persisted','persist_failed')`,
    )
    .all();
  if (badDur.length) {
    throw new Error(`DB_INVALID_DURABILITY_STATE:${badDur[0].id}:${badDur[0].durability_state}`);
  }
  checks.push("durability_vocabulary");

  return { ok: true, checks };
}

export { VALID_DURABILITY };
