import { canonicalDecimalString, toDecimal } from "../../money/canonicalDecimal.js";

export function assertFiniteMoney(value, field = "amount") {
  if (typeof value !== "string") throw new Error(`INV_MONEY_NOT_STRING:${field}`);
  canonicalDecimalString(value);
}

export function assertJournalBalanced(lines) {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new Error("INV_JOURNAL_MIN_LINES");
  }
  let debit = toDecimal("0");
  let credit = toDecimal("0");
  for (const line of lines) {
    assertFiniteMoney(line.amount, "line.amount");
    const a = toDecimal(line.amount);
    if (a.lt(0)) throw new Error("INV_JOURNAL_NEGATIVE_AMOUNT");
    if (line.side === "debit") debit = debit.plus(a);
    else if (line.side === "credit") credit = credit.plus(a);
    else throw new Error("INV_JOURNAL_SIDE");
  }
  if (!debit.eq(credit)) {
    throw new Error(`INV_JOURNAL_UNBALANCED:${debit.toFixed()}!=${credit.toFixed()}`);
  }
  return true;
}

export function assertRatePositive(rate) {
  assertFiniteMoney(rate, "rate");
  if (!toDecimal(rate).gt(0)) throw new Error("INV_RATE_NOT_POSITIVE");
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
