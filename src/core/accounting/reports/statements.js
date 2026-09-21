/**
 * Basic financial statements from journal (PHASE 8).
 * TWR/MWR/IRR not included.
 */

import { toDecimal, canonicalDecimalString } from "../../money/canonicalDecimal.js";
import { queryAll } from "../../persistence/browser/browserSqlAdapter.js";
import { presentationBalance, normalSide } from "./presentationBalance.js";

/**
 * Trial balance: all accounts with debit/credit totals from posted journal.
 * @param {any} db
 * @param {{ asOf?: string }} [opts]
 */
export function trialBalance(db, opts = {}) {
  const accounts = queryAll(
    db,
    `SELECT id, code, name, account_kind, currency FROM fin_accounts WHERE is_archived = 0`
  );
  const rows = [];
  let totalDebit = toDecimal("0");
  let totalCredit = toDecimal("0");

  for (const acct of accounts) {
    const lines = queryAll(
      db,
      `SELECT jl.side, jl.amount_in_base, jl.amount
       FROM fin_journal_lines jl
       JOIN fin_journal_entries je ON je.id = jl.entry_id
       JOIN fin_operations op ON op.id = je.operation_id
       WHERE jl.account_id = ? AND op.status = 'posted'
       ${opts.asOf ? "AND je.business_date <= ?" : ""}`,
      opts.asOf ? [acct.id, opts.asOf] : [acct.id]
    );
    let debit = toDecimal("0");
    let credit = toDecimal("0");
    for (const line of lines) {
      const amt = toDecimal(line.amount_in_base || line.amount || "0");
      if (line.side === "debit") debit = debit.plus(amt);
      else credit = credit.plus(amt);
    }
    if (debit.eq(0) && credit.eq(0)) continue;
    totalDebit = totalDebit.plus(debit);
    totalCredit = totalCredit.plus(credit);
    rows.push({
      accountId: acct.id,
      code: acct.code,
      name: acct.name,
      accountKind: acct.account_kind,
      currency: acct.currency,
      debit: canonicalDecimalString(debit.toFixed()),
      credit: canonicalDecimalString(credit.toFixed()),
      presentationBalance: presentationBalance(lines, acct.account_kind),
      normalSide: normalSide(acct.account_kind),
    });
  }

  const balanced = totalDebit.eq(totalCredit);
  return {
    asOf: opts.asOf || null,
    rows,
    totals: {
      debit: canonicalDecimalString(totalDebit.toFixed()),
      credit: canonicalDecimalString(totalCredit.toFixed()),
    },
    balanced: balanced === true, // exact — never accept either
  };
}

/**
 * Net worth approximation: assets presentation − liabilities presentation.
 */
export function netWorth(db, opts = {}) {
  const tb = trialBalance(db, opts);
  let assets = toDecimal("0");
  let liabilities = toDecimal("0");
  let equity = toDecimal("0");
  for (const r of tb.rows) {
    const bal = toDecimal(r.presentationBalance || "0");
    if (String(r.accountKind).startsWith("asset")) assets = assets.plus(bal);
    else if (String(r.accountKind).startsWith("liability")) liabilities = liabilities.plus(bal);
    else if (String(r.accountKind).startsWith("equity")) equity = equity.plus(bal);
  }
  return {
    asOf: opts.asOf || null,
    assets: canonicalDecimalString(assets.toFixed()),
    liabilities: canonicalDecimalString(liabilities.toFixed()),
    equity: canonicalDecimalString(equity.toFixed()),
    netWorth: canonicalDecimalString(assets.minus(liabilities).toFixed()),
  };
}
