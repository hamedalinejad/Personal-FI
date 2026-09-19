import { canonicalDecimalString, toDecimal } from "../../money/canonicalDecimal.js";

export function assertFiniteMoney(value, field = "amount") {
  if (typeof value !== "string") throw new Error(`INV_MONEY_NOT_STRING:${field}`);
  canonicalDecimalString(value);
}

/**
 * Balance in base currency when amountInBase present on any line;
 * otherwise all lines must share one currency and balance on amount.
 */
export function assertJournalBalanced(lines, opts = {}) {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new Error("INV_JOURNAL_MIN_LINES");
  }
  const baseCurrency = opts.baseCurrency || null;
  const posted = opts.posted === true || opts.requireBaseFields === true;
  let anyBase = lines.some((l) => l.amountInBase != null || l.amount_in_base != null);
  // Posted journals with a book base must balance in base — never allow foreign-only balance
  if (posted && baseCurrency) {
    anyBase = true;
  }
  let debit = toDecimal("0");
  let credit = toDecimal("0");
  let currency = null;
  const lineNumbers = new Set();
  for (const line of lines) {
    if (!line.side || (line.side !== "debit" && line.side !== "credit")) {
      throw new Error("INV_JOURNAL_SIDE_REQUIRED");
    }
    if (!line.currency || typeof line.currency !== "string") {
      throw new Error("INV_JOURNAL_CURRENCY_REQUIRED");
    }
    const lineNumber = line.line_number ?? line.lineNumber ?? null;
    if (lineNumber != null) {
      if (!Number.isInteger(lineNumber) || lineNumber < 1) {
        throw new Error("INV_JOURNAL_LINE_NUMBER_INVALID");
      }
      if (lineNumbers.has(lineNumber)) {
        throw new Error("INV_JOURNAL_LINE_NUMBER_DUPLICATE");
      }
      lineNumbers.add(lineNumber);
    }
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
      // Prove amountInBase = amount × exchangeRateToBase (required when base amounts used)
      let fx = line.exchangeRateToBase ?? line.exchange_rate_to_base;
      if (fx == null || fx === "") {
        // Same-currency cache: amountInBase must equal amount and rate defaults to 1
        if (!a.eq(balAmount)) {
          throw new Error("INV_JOURNAL_MISSING_EXCHANGE_RATE");
        }
        fx = "1";
      }
      assertFiniteMoney(String(fx), "line.exchangeRateToBase");
      if (toDecimal(fx).lte(0)) throw new Error("INV_JOURNAL_FX_NONPOSITIVE");
      const expected = a.times(toDecimal(fx));
      if (!expected.eq(balAmount)) {
        throw new Error(
          `INV_JOURNAL_FX_MISMATCH:${a.toFixed()}*${toDecimal(fx).toFixed()}!=${balAmount.toFixed()}`,
        );
      }
      // BUG-F02: same-currency lines must use identity FX
      if (baseCurrency && line.currency && line.currency === baseCurrency) {
        if (!toDecimal(fx).eq(1)) {
          throw new Error(`INV_JOURNAL_SAME_CURRENCY_FX_NOT_1:${fx}`);
        }
        if (!a.eq(balAmount)) {
          throw new Error("INV_JOURNAL_SAME_CURRENCY_BASE_NEQ_AMOUNT");
        }
      }
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

export function assertPostedHasJournal(status, journalLines) {
  if (status === "posted") {
    if (!Array.isArray(journalLines) || journalLines.length < 2) {
      throw new Error("OP_POSTED_REQUIRES_JOURNAL");
    }
  }
  return true;
}

export function assertImmutablePost(previousRow) {
  if (!previousRow) return true;
  const posted = previousRow.status === "posted" || previousRow.posted === true;
  if (posted) throw new Error("INV_IMMUTABLE_POSTED");
  return true;
}

export function assertFeeConservation({ gross, fee, net, direction }) {
  if (direction !== "subtract" && direction !== "add") {
    throw new Error("INV_FEE_DIRECTION_REQUIRED");
  }
  const g = toDecimal(gross);
  const f = toDecimal(fee);
  const n = toDecimal(net);
  const expected = direction === "subtract" ? g.minus(f) : g.plus(f);
  if (!expected.eq(n)) {
    throw new Error("INV_FEE_CONSERVATION");
  }
  return true;
}

export function assertQuantityConservation({ gross, fee, net, role, treatment }) {
  // Canonical treatments only — unknown/missing role is reject, not guess
  const raw = treatment ?? role;
  if (raw == null || raw === "") {
    throw new Error("INV_QTY_ROLE_REQUIRED");
  }
  let t = String(raw);
  // legacy aliases → canonical
  if (t === "fee_from_received" || t === "feeBurnQuantity" || t === "network_burn") {
    t = "reduce_received_quantity";
  }
  if (t === "reduce_received_quantity") {
    if (!toDecimal(gross).minus(toDecimal(fee || "0")).eq(toDecimal(net))) {
      throw new Error("INV_QTY_CONSERVATION");
    }
    return true;
  }
  throw new Error(`INV_QTY_ROLE_UNKNOWN:${t}`);
}

export function runInvariantGate({ journalLines, rates, baseCurrency, status } = {}) {
  if (journalLines) {
    assertJournalBalanced(journalLines, {
      baseCurrency,
      posted: status === "posted",
    });
  }
  if (rates) {
    for (const r of rates) {
      if (r == null) continue;
      const rate = typeof r === "string" ? r : r.rate;
      const kind = typeof r === "object" && r != null ? r.type || r.kind || "fx" : "fx";
      // FX rates must be strictly positive; interest may be zero via explicit type
      if (kind === "interest" || kind === "non_negative") {
        assertRateNonNegative(rate);
      } else {
        assertRatePositive(rate);
      }
    }
  }
  return true;
}
