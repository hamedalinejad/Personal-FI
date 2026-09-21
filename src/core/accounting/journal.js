/**
 * Journal builder — Feature builds lines; Core validates + persists shape.
 * SoT after post: fin_journal_entries + fin_journal_lines.
 */

import { canonicalDecimalString, toDecimal } from "../money/canonicalDecimal.js";

/**
 * @param {{ accountId: string, amount: string, currency: string, amountInBase?: string, exchangeRateToBase?: string, memo?: string, lineKind?: string }} p
 */
export function debit(p) {
  return line({ ...p, side: "debit" });
}

/**
 * @param {{ accountId: string, amount: string, currency: string, amountInBase?: string, exchangeRateToBase?: string, memo?: string, lineKind?: string }} p
 */
export function credit(p) {
  return line({ ...p, side: "credit" });
}

function line({
  accountId,
  side,
  amount,
  currency,
  amountInBase = null,
  exchangeRateToBase = null,
  memo = null,
  lineKind = null,
  relatedFeature = null,
  relatedId = null,
}) {
  if (!accountId) throw Object.assign(new Error("JOURNAL_ACCOUNT_REQUIRED"), { code: "JOURNAL_ACCOUNT_REQUIRED" });
  if (side !== "debit" && side !== "credit") {
    throw Object.assign(new Error("JOURNAL_SIDE_INVALID"), { code: "JOURNAL_SIDE_INVALID" });
  }
  const amt = canonicalDecimalString(String(amount));
  if (toDecimal(amt).lte(0)) {
    throw Object.assign(new Error("JOURNAL_AMOUNT_POSITIVE"), { code: "JOURNAL_AMOUNT_POSITIVE" });
  }
  if (!currency || !/^[A-Z]{3}$/.test(currency)) {
    throw Object.assign(new Error("JOURNAL_CURRENCY_INVALID"), { code: "JOURNAL_CURRENCY_INVALID" });
  }
  return {
    accountId,
    side,
    amount: amt,
    currency,
    amountInBase: amountInBase != null ? canonicalDecimalString(String(amountInBase)) : amt,
    exchangeRateToBase: exchangeRateToBase != null ? canonicalDecimalString(String(exchangeRateToBase)) : "1",
    memo,
    lineKind,
    relatedFeature,
    relatedId,
  };
}

/**
 * @param {{ operationId: string, businessDate: string, memo?: string, lines: object[] }} input
 */
export function buildJournal({ operationId, businessDate, memo = null, lines }) {
  if (!operationId) throw Object.assign(new Error("JOURNAL_OPERATION_REQUIRED"), { code: "JOURNAL_OPERATION_REQUIRED" });
  if (!businessDate || !/^\d{4}-\d{2}-\d{2}$/.test(businessDate)) {
    throw Object.assign(new Error("JOURNAL_BUSINESS_DATE"), { code: "JOURNAL_BUSINESS_DATE" });
  }
  if (!Array.isArray(lines) || lines.length < 2) {
    throw Object.assign(new Error("JOURNAL_LINES_MIN"), { code: "JOURNAL_LINES_MIN" });
  }
  assertJournalBalanced(lines);
  return { operationId, businessDate, memo, lines };
}

/**
 * Balance in base amounts (amountInBase).
 */
export function assertJournalBalanced(lines) {
  let debit = toDecimal("0");
  let credit = toDecimal("0");
  for (const l of lines) {
    const base = toDecimal(l.amountInBase != null ? l.amountInBase : l.amount);
    if (l.side === "debit") debit = debit.plus(base);
    else if (l.side === "credit") credit = credit.plus(base);
    else throw Object.assign(new Error("JOURNAL_SIDE_INVALID"), { code: "JOURNAL_SIDE_INVALID" });
  }
  if (!debit.eq(credit)) {
    throw Object.assign(
      new Error(`JOURNAL_UNBALANCED debit=${debit.toFixed()} credit=${credit.toFixed()}`),
      { code: "JOURNAL_UNBALANCED" }
    );
  }
}

/**
 * Persist journal under an open SQLite transaction (caller owns BEGIN/COMMIT).
 */
export function persistJournal(db, { operationId, businessDate, memo, lines, now }) {
  const entryId =
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `je-${Date.now()}`;
  const ts = now || new Date().toISOString();
  db.run(
    `INSERT INTO fin_journal_entries (id, operation_id, business_date, memo, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [entryId, operationId, businessDate, memo, ts]
  );
  for (const l of lines) {
    const lineId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `jl-${Math.random().toString(36).slice(2)}`;
    db.run(
      `INSERT INTO fin_journal_lines (
        id, entry_id, account_id, side, amount, currency,
        amount_in_base, exchange_rate_to_base, memo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        lineId,
        entryId,
        l.accountId,
        l.side,
        l.amount,
        l.currency,
        l.amountInBase,
        l.exchangeRateToBase,
        l.memo,
      ]
    );
  }
  return { entryId };
}
