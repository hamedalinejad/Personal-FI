/**
 * Minimal Core accounting statements from journal SoT (R-007 partial).
 * Aggregation uses decimal.js — never SQL SUM on TEXT money columns.
 */
import { openDb } from "../../persistence/port.js";
import { toDecimal } from "../../money/canonicalDecimal.js";

export function generalLedger(dataDir, { accountId = null, fromDate = null, toDate = null } = {}) {
  const db = openDb(dataDir);
  let sql = `
    SELECT je.operation_id as operationId, je.business_date as businessDate, je.created_at as createdAt,
           jl.account_id as accountId, jl.side, jl.amount, jl.currency, jl.amount_in_base as amountInBase,
           jl.line_kind as lineKind, fo.operation_type as operationType
    FROM fin_journal_lines jl
    JOIN fin_journal_entries je ON je.id = jl.entry_id
    JOIN fin_operations fo ON fo.id = je.operation_id
    WHERE 1=1`;
  const params = [];
  if (accountId) {
    sql += ` AND jl.account_id = ?`;
    params.push(accountId);
  }
  if (fromDate) {
    sql += ` AND je.business_date >= ?`;
    params.push(fromDate);
  }
  if (toDate) {
    sql += ` AND je.business_date <= ?`;
    params.push(toDate);
  }
  sql += ` ORDER BY je.business_date, je.created_at, jl.line_number`;
  return db.prepare(sql).all(...params);
}

export function trialBalance(dataDir, { asOf = null, baseCurrency = null } = {}) {
  const lines = generalLedger(dataDir, { toDate: asOf || undefined });
  const byAccount = new Map();
  for (const row of lines) {
    const key = row.accountId;
    if (!byAccount.has(key)) {
      byAccount.set(key, { accountId: key, debit: toDecimal("0"), credit: toDecimal("0"), currency: row.currency });
    }
    const acc = byAccount.get(key);
    const amt = toDecimal(row.amountInBase || row.amount);
    if (row.side === "debit") acc.debit = acc.debit.plus(amt);
    else acc.credit = acc.credit.plus(amt);
  }
  const rows = [...byAccount.values()].map((a) => ({
    accountId: a.accountId,
    debit: a.debit.toFixed(),
    credit: a.credit.toFixed(),
    balance: a.debit.minus(a.credit).toFixed(),
  }));
  let totalDebit = toDecimal("0");
  let totalCredit = toDecimal("0");
  for (const r of rows) {
    totalDebit = totalDebit.plus(toDecimal(r.debit));
    totalCredit = totalCredit.plus(toDecimal(r.credit));
  }
  return {
    asOf: asOf || null,
    rows,
    totalDebit: totalDebit.toFixed(),
    totalCredit: totalCredit.toFixed(),
    balanced: totalDebit.eq(totalCredit),
  };
}

export function accountActivity(dataDir, accountId, opts = {}) {
  if (!accountId) throw new Error("ACCOUNT_ID_REQUIRED");
  return generalLedger(dataDir, { ...opts, accountId });
}
