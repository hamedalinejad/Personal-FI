/**
 * presentationBalance — balance by normal side of account_kind.
 * P1-24: Asset/Expense normal debit; Liability/Equity/Income normal credit.
 * Journal is SoT; this is a derived read-model helper only.
 */

import { toDecimal, canonicalDecimalString } from "../../money/canonicalDecimal.js";

const DEBIT_NORMAL = new Set([
  "asset.cash",
  "asset.bank",
  "asset.receivable",
  "asset",
  "expense",
]);

/**
 * @param {string} accountKind
 * @returns {"debit"|"credit"}
 */
export function normalSide(accountKind) {
  if (!accountKind) return "debit";
  if (DEBIT_NORMAL.has(accountKind)) return "debit";
  if (accountKind.startsWith("asset") || accountKind.startsWith("expense")) return "debit";
  return "credit";
}

/**
 * Compute presentation balance from journal lines for one account.
 * @param {{ side: string, amount_in_base?: string, amount?: string }[]} lines
 * @param {string} accountKind
 * @returns {string} canonical decimal string (may be negative if overdrawn relative to normal)
 */
export function presentationBalance(lines, accountKind) {
  const normal = normalSide(accountKind);
  let debit = toDecimal("0");
  let credit = toDecimal("0");
  for (const line of lines || []) {
    const amt = toDecimal(line.amount_in_base || line.amount || "0");
    if (line.side === "debit") debit = debit.plus(amt);
    else if (line.side === "credit") credit = credit.plus(amt);
  }
  if (normal === "debit") {
    return canonicalDecimalString(debit.minus(credit).toFixed());
  }
  return canonicalDecimalString(credit.minus(debit).toFixed());
}

/**
 * Query presentation balance for an account from db.
 * @param {any} db
 * @param {string} accountId
 * @param {string} accountKind
 */
export function queryPresentationBalance(db, accountId, accountKind) {
  const stmt = db.prepare(
    `SELECT jl.side, jl.amount_in_base, jl.amount
     FROM fin_journal_lines jl
     JOIN fin_journal_entries je ON je.id = jl.entry_id
     JOIN fin_operations op ON op.id = je.operation_id
     WHERE jl.account_id = ? AND op.status = 'posted'`
  );
  stmt.bind([accountId]);
  const lines = [];
  while (stmt.step()) {
    lines.push(stmt.getAsObject());
  }
  stmt.free();
  return presentationBalance(lines, accountKind);
}
