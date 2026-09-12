/** P0-CASH-005 */
export function scanAccTransactionCurrencyMismatch(db) {
  return db
    .prepare(
      `SELECT t.id, t.currency as txCurrency, a.currency as accountCurrency
       FROM acc_transactions t
       JOIN acc_accounts a ON a.id = t.account_id
       WHERE t.currency != a.currency`,
    )
    .all();
}

export function assertAccTransactionCurrencyMatch(db) {
  const bad = scanAccTransactionCurrencyMismatch(db);
  if (bad.length) throw new Error(`INTEGRITY_ACC_TX_CURRENCY:${bad.length}`);
  return true;
}
