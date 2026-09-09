import { canonicalDecimalString, toDecimal } from "../../money/canonicalDecimal.js";

export function assertFiniteMoney(value, field = "amount") {
  if (typeof value !== "string") throw new Error(`INV_MONEY_NOT_STRING:${field}`);
  canonicalDecimalString(value);
}

/**
 * Balance in base currency when amountInBase present on any line;
 * otherwise all lines must share one currency and balance on amount.
 */
export function assertJournalBalanced(lines) {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new Error("INV_JOURNAL_MIN_LINES");
  }
  const anyBase = lines.some((l) => l.amountInBase != null || l.amount_in_base != null);
  let debit = toDecimal("0");
  let credit = toDecimal("0");
  let currency = null;
  for (const line of lines) {
    assertFiniteMoney(line.amount, "line.amount");
    const a = toDecimal(line.amount);
    if (a.lt(0)) throw new Error("INV_JOURNAL_NEGATIVE_AMOUNT");
    if (a.eq(0)) throw new Error("INV_JOURNAL_ZERO_AMOUNT");

    let balAmount;
    if (anyBase) {
      const base = line.amountInBase ?? line.amount_in_base;
      if (base == null) throw new Error("INV_JOURNAL_MISSING_AMOUNT_IN_BASE");
      assertFiniteMoney(base, "line.amountInBase");
      balAmount = toDecimal(base);
      if (balAmount.lt(0)) throw new Error("INV_JOURNAL_NEGATIVE_AMOUNT_IN_BASE");
    } else {
      if (!line.currency) throw new Error("INV_JOURNAL_CURRENCY_REQUIRED");
      if (currency == null) currency = line.currency;
      else if (currency !== line.currency) {
        throw new Error("INV_JOURNAL_MULTI_CURRENCY_REQUIRES_BASE");
      }
      balAmount = a;
    }

    if (line.side === "debit") debit = debit.plus(balAmount);
    else if (line.side === "credit") credit = credit.plus(balAmount);
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

export function assertRateNonNegative(rate) {
  assertFiniteMoney(rate, "rate");
  if (toDecimal(rate).lt(0)) throw new Error("INV_RATE_NEGATIVE");
}

export function assertImmutablePost(previousRow) {
  if (!previousRow) return true;
  const posted = previousRow.status === "posted" || previousRow.posted === true;
  if (posted) throw new Error("INV_IMMUTABLE_POSTED");
  return true;
}

export function assertFeeConservation({ gross, fee, net }) {
  const g = toDecimal(gross);
  const f = toDecimal(fee);
  const n = toDecimal(net);
  if (!g.minus(f).eq(n) && !g.plus(f).eq(n)) {
    throw new Error("INV_FEE_CONSERVATION");
  }
  return true;
}

export function assertQuantityConservation({ gross, fee, net, role }) {
  if (role === "fee_from_received" || role === "network_burn" || !role) {
    if (!toDecimal(gross).minus(toDecimal(fee || "0")).eq(toDecimal(net))) {
      throw new Error("INV_QTY_CONSERVATION");
    }
  }
  return true;
}

export function runInvariantGate({ journalLines, rates } = {}) {
  if (journalLines) assertJournalBalanced(journalLines);
  if (rates) {
    for (const r of rates) {
      if (r != null) assertRateNonNegative(typeof r === "string" ? r : r.rate);
    }
  }
  return true;
}
