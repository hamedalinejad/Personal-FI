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

/** Rate strictly > 0 (FX, prices). */
export function assertRatePositive(rate) {
  assertFiniteMoney(rate, "rate");
  if (!toDecimal(rate).gt(0)) throw new Error("INV_RATE_NOT_POSITIVE");
}

/** Interest rate may be zero (qarz / zero-interest loans). */
export function assertRateNonNegative(rate) {
  assertFiniteMoney(rate, "rate");
  if (toDecimal(rate).lt(0)) throw new Error("INV_RATE_NEGATIVE");
}

/**
 * Business immutability only — not durability_state.
 * Corrections = new operation + reverses/corrects linkage.
 */
export function assertImmutablePost(previousRow, attemptedChange) {
  if (!previousRow) return true;
  const posted =
    previousRow.status === "posted" || previousRow.posted === true;
  if (posted) {
    throw new Error("INV_IMMUTABLE_POSTED");
  }
  return true;
}

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

/**
 * Role-aware quantity conservation.
 * fee_from_received / network_burn: net = gross - fee
 * non-quantity fee: fee may be currency-only (fee qty optional)
 */
export function assertQuantityConservation({ role, gross, fee, net }) {
  if (gross == null || net == null) return true;
  assertFiniteMoney(gross, "gross");
  assertFiniteMoney(net, "net");
  const g = toDecimal(gross);
  const n = toDecimal(net);
  const r = role || "fee_from_received";

  if (fee == null || fee === "0") {
    if (!g.eq(n) && r !== "non_quantity_fee") {
      // allow equal when no fee qty
    }
    return true;
  }
  assertFiniteMoney(fee, "fee");
  const f = toDecimal(fee);

  if (r === "fee_from_received" || r === "network_burn" || r === "standalone_burn") {
    if (!g.minus(f).eq(n)) throw new Error("INV_QTY_NOT_CONSERVED");
    return true;
  }
  if (r === "non_quantity_fee") {
    return true;
  }
  // default: net = gross - fee
  if (!g.minus(f).eq(n)) throw new Error("INV_QTY_NOT_CONSERVED");
  return true;
}

export function runInvariantGate({
  journalLines,
  rates = [],
  ratesNonNegative = [],
  fee,
  quantities,
  previousPostedRow,
  attemptedMutation,
} = {}) {
  if (journalLines) assertJournalBalanced(journalLines);
  for (const r of rates) assertRatePositive(r);
  for (const r of ratesNonNegative) assertRateNonNegative(r);
  if (fee) assertFeeConservation(fee);
  if (quantities) assertQuantityConservation(quantities);
  if (previousPostedRow && attemptedMutation !== false) {
    assertImmutablePost(previousPostedRow, attemptedMutation ?? true);
  }
  return true;
}
