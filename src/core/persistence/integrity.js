import { assertJournalBalanced } from "../domain/invariants/index.js";

const DURABILITY_STATES = new Set(["pending", "sql_committed", "persisted", "persist_failed"]);

export function validateOpenDatabase(db, { allowPending = false } = {}) {
  const integrity = db.prepare("PRAGMA integrity_check").all();
  const integrityErrors = integrity.filter((r) => String(Object.values(r)[0]).toLowerCase() !== "ok");
  if (integrityErrors.length) {
    throw new Error("DB_INTEGRITY_CHECK_FAILED:" + integrityErrors.map((r) => Object.values(r)[0]).join("|"));
  }

  const foreignKeys = db.prepare("PRAGMA foreign_key_check").all();
  if (foreignKeys.length) {
    throw new Error("DB_FOREIGN_KEY_CHECK_FAILED:" + foreignKeys.length);
  }

  const pending = db
    .prepare("SELECT id FROM fin_operations WHERE durability_state = 'pending' LIMIT 1")
    .all();
  if (pending.length && !allowPending) {
    throw new Error("DB_PENDING_DURABILITY_SURVIVED:" + pending.map((r) => r.id).join(","));
  }

  const badHash = db
    .prepare("SELECT id FROM fin_operations WHERE status = 'posted' AND (command_hash IS NULL OR command_hash = '')")
    .all();
  if (badHash.length) {
    throw new Error("DB_POSTED_COMMAND_HASH_MISSING:" + badHash.map((r) => r.id).join(","));
  }

  const posted = db
    .prepare(
      `SELECT id, base_currency, durability_state, status
       FROM fin_operations
       WHERE status = 'posted'
       ORDER BY business_date, created_at, id`,
    )
    .all();

  for (const op of posted) {
    if (!DURABILITY_STATES.has(op.durability_state)) {
      throw new Error("DB_DURABILITY_STATE_INVALID:" + op.id);
    }
    const entry = db
      .prepare(
        "SELECT id, post_state FROM fin_journal_entries WHERE operation_id = ? ORDER BY created_at, id LIMIT 1",
      )
      .get(op.id);
    if (!entry) {
      throw new Error("DB_POSTED_OPERATION_MISSING_JOURNAL:" + op.id);
    }
    if (entry.post_state !== "posted") {
      throw new Error("DB_POST_STATE_DRIFT:" + op.id);
    }

    const lines = db
      .prepare(
        `SELECT account_id as accountId, side, amount, currency,
                line_number, amount_in_base as amountInBase,
                exchange_rate_to_base as exchangeRateToBase
         FROM fin_journal_lines
         WHERE entry_id = ?
         ORDER BY line_number`,
      )
      .all(entry.id);

    assertJournalBalanced(lines, { baseCurrency: op.base_currency });

    const seen = new Set();
    for (const line of lines) {
      if (seen.has(line.line_number)) {
        throw new Error("DB_DUPLICATE_JOURNAL_LINE_NUMBER:" + op.id);
      }
      seen.add(line.line_number);
      const account = db
        .prepare("SELECT currency, is_archived, status FROM fin_accounts WHERE id = ?")
        .get(line.accountId);
      if (!account) {
        throw new Error("DB_JOURNAL_ACCOUNT_MISSING:" + op.id + ":" + line.accountId);
      }
      if (account.currency !== line.currency) {
        throw new Error("DB_JOURNAL_ACCOUNT_CURRENCY_MISMATCH:" + op.id + ":" + line.accountId);
      }
    }
  }

  return {
    ok: true,
    postedOperations: posted.length,
    pendingOperations: pending.length,
  };
}
