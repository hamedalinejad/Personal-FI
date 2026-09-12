import { toDecimal } from "../money/canonicalDecimal.js";

/**
 * P0-CASH-006 — archived accounts must have zero journal balance (domain path).
 */
export function journalBalanceForFinAccount(db, finAccountId) {
  const rows = db
    .prepare(
      `SELECT jl.side, jl.amount_in_base, jl.amount
       FROM fin_journal_lines jl
       JOIN fin_journal_entries je ON je.id = jl.entry_id
       JOIN fin_operations fo ON fo.id = je.operation_id
       WHERE jl.account_id = ? AND fo.status = 'posted'`,
    )
    .all(finAccountId);
  let bal = toDecimal("0");
  for (const r of rows) {
    const a = toDecimal(r.amount_in_base ?? r.amount);
    bal = r.side === "debit" ? bal.plus(a) : bal.minus(a);
  }
  return bal;
}

export function assertCanArchiveFinAccount(db, finAccountId) {
  const bal = journalBalanceForFinAccount(db, finAccountId);
  if (!bal.eq(0)) throw new Error("ARCHIVE_NONZERO_BALANCE");
  return true;
}

export function scanArchivedWithBalance(db) {
  const archived = db
    .prepare(
      `SELECT a.id as accId, a.fin_account_id as finId
       FROM acc_accounts a WHERE a.is_archived = 1 AND a.fin_account_id IS NOT NULL`,
    )
    .all();
  const bad = [];
  for (const row of archived) {
    const bal = journalBalanceForFinAccount(db, row.finId);
    if (!bal.eq(0)) bad.push({ ...row, balance: bal.toFixed() });
  }
  return bad;
}
