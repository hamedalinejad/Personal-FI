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
    if (a.eq(0)) throw new Error("INV_JOURNAL_ZERO_AMOUNT");
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

/**
 * P0-CODE-009 — mutation guard: pass previous row; if previous is posted, reject any mutation.
 * Corrections must use new operation + reverses/corrects linkage, never in-place edit.
 */
export function assertImmutablePost(previousRow, attemptedChange) {
  if (!previousRow) return true;
  const posted =
    previousRow.status === "posted" ||
    previousRow.posted === true ||
    previousRow.durability_state === "sql_committed";
  if (posted && attemptedChange) {
    throw new Error("INV_IMMUTABLE_POSTED");
  }
  if (posted && !attemptedChange) {
    throw new Error("INV_IMMUTABLE_POSTED");
  }
  return true;
}

/** Fee paid + waived ≤ due (loan fees). */
export function assertFeeConservation({ amountDue, amountPaid, amountWaived }) {
  assertFiniteMoney(amountDue, "amountDue");
  assertFiniteMoney(amountPaid || "0", "amountPaid");
  assertFiniteMoney(amountWaived || "0", "amountWaived");
  const due = toDecimal(amountDue);
  const paid = toDecimal(amountPaid || "0");
  const waived = toDecimal(amountWaived || "0");
  if (paid.lt(0) || waived.lt(0)) throw new Error("INV_FEE_NEGATIVE");
  if (paid.plus(waived).gt(due)) throw new Error("INV_FEE_OVER_APPLIED");
  return true;
}

/** gross/net/fee quantity consistency when all present. */
export function assertQuantityConservation({ gross, fee, net }) {
  if (gross == null || net == null) return true;
  assertFiniteMoney(gross, "gross");
  assertFiniteMoney(net, "net");
  const g = toDecimal(gross);
  const n = toDecimal(net);
  if (fee != null) {
    assertFiniteMoney(fee, "fee");
    const f = toDecimal(fee);
    if (!g.minus(f).eq(n) && !g.plus(f).eq(n)) {
      // allow net = gross - fee (typical)
      if (!g.minus(f).eq(n)) throw new Error("INV_QTY_NOT_CONSERVED");
    }
  }
  return true;
}

export function runInvariantGate({
  journalLines,
  rates = [],
  fee,
  quantities,
  previousPostedRow,
  attemptedMutation,
} = {}) {
  if (journalLines) assertJournalBalanced(journalLines);
  for (const r of rates) assertRatePositive(r);
  if (fee) assertFeeConservation(fee);
  if (quantities) assertQuantityConservation(quantities);
  if (previousPostedRow && attemptedMutation !== false) {
    assertImmutablePost(previousPostedRow, attemptedMutation ?? true);
  }
  return true;
}
