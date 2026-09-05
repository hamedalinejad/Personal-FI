import { canonicalDecimalString } from "../../money/canonicalDecimal.js";
import { toNum } from "../../money/decimalMath.js";

export function assertFiniteMoney(value, field = "amount") {
  if (typeof value !== "string") throw new Error(`INV_MONEY_NOT_STRING:${field}`);
  canonicalDecimalString(value);
}

export function assertJournalBalanced(lines) {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new Error("INV_JOURNAL_MIN_LINES");
  }
  let debit = 0;
  let credit = 0;
  for (const line of lines) {
    assertFiniteMoney(line.amount, "line.amount");
    const a = toNum(line.amount);
    if (a < 0) throw new Error("INV_JOURNAL_NEGATIVE_AMOUNT");
    if (line.side === "debit") debit += a;
    else if (line.side === "credit") credit += a;
    else throw new Error("INV_JOURNAL_SIDE");
  }
  if (Math.abs(debit - credit) > 1e-9) {
    throw new Error(`INV_JOURNAL_UNBALANCED:${debit}!=${credit}`);
  }
  return true;
}

export function assertRatePositive(rate) {
  assertFiniteMoney(rate, "rate");
  if (!(toNum(rate) > 0)) throw new Error("INV_RATE_NOT_POSITIVE");
}

export function assertImmutablePost(row) {
  if (row?.status === "posted" || row?.posted === true) {
    throw new Error("INV_IMMUTABLE_POSTED");
  }
}

export function runInvariantGate({ journalLines, rates = [] }) {
  if (journalLines) assertJournalBalanced(journalLines);
  for (const r of rates) assertRatePositive(r);
  return true;
}
