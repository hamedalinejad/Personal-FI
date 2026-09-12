/**
 * P0-OP-011 — integrity scan: posted journal lines currency must match fin_accounts.currency
 * Single-writer path enforces at write; this detects direct-SQL corruption.
 */
export function scanPostedJournalCurrencyMismatch(db) {
  const rows = db
    .prepare(
      `SELECT jl.id as lineId, jl.currency as lineCurrency, fa.currency as accountCurrency, fo.id as operationId
       FROM fin_journal_lines jl
       JOIN fin_journal_entries je ON je.id = jl.entry_id
       JOIN fin_operations fo ON fo.id = je.operation_id
       JOIN fin_accounts fa ON fa.id = jl.account_id
       WHERE fo.status = 'posted' AND jl.currency != fa.currency`,
    )
    .all();
  return rows;
}

export function assertNoPostedJournalCurrencyMismatch(db) {
  const bad = scanPostedJournalCurrencyMismatch(db);
  if (bad.length) {
    throw new Error(`INTEGRITY_JOURNAL_CURRENCY_MISMATCH:${bad.length}`);
  }
  return true;
}
