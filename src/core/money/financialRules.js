/**
 * Exact financial rules programmers must follow (PHASE doc §24).
 * Guards against Number/parseFloat/Math.round on money paths.
 */

import { toDecimal, canonicalDecimalString } from "./canonicalDecimal.js";

/**
 * Reject JS Number for financial input at boundary.
 * @param {unknown} input
 */
export function assertMoneyString(input) {
  if (typeof input === "number") {
    throw Object.assign(new Error("MONEY_MUST_BE_DECIMAL_STRING"), {
      code: "MONEY_MUST_BE_DECIMAL_STRING",
    });
  }
  return canonicalDecimalString(String(input));
}

/**
 * FX rule: same ccy → 1; cross → explicit positive rate.
 */
export function resolveFxRate(bookBase, txnCcy, fxRate) {
  if (!bookBase || !txnCcy) {
    throw Object.assign(new Error("CURRENCY_REQUIRED"), { code: "CURRENCY_REQUIRED" });
  }
  if (bookBase === txnCcy) return { rate: "1", isCross: false };
  if (fxRate == null || fxRate === "") {
    throw Object.assign(new Error("FX_REQUIRED_FOR_CROSS_CURRENCY"), {
      code: "FX_REQUIRED_FOR_CROSS_CURRENCY",
    });
  }
  const r = toDecimal(String(fxRate));
  if (r.lte(0)) {
    throw Object.assign(new Error("FX_MUST_BE_POSITIVE"), { code: "FX_MUST_BE_POSITIVE" });
  }
  return { rate: canonicalDecimalString(r.toFixed()), isCross: true };
}

/** Metals: fine = gross × purity; 1g = 1000mg */
export function fineWeightMg(grossMg, purityRatio) {
  const g = toDecimal(String(grossMg));
  const p = toDecimal(String(purityRatio));
  if (g.lte(0)) throw Object.assign(new Error("MASS_MUST_BE_POSITIVE"), { code: "VALIDATION_ERROR" });
  if (p.lte(0) || p.gt(1)) {
    throw Object.assign(new Error("PURITY_OUT_OF_RANGE"), { code: "VALIDATION_ERROR" });
  }
  return canonicalDecimalString(g.times(p).toFixed());
}

export function gramsToMg(grams) {
  return canonicalDecimalString(toDecimal(String(grams)).times(1000).toFixed());
}

/** Crypto quantity fee: net = gross - fee */
export function cryptoNetFromGross(gross, feeQty, treatment = "reduce_received") {
  const g = toDecimal(String(gross));
  const f = toDecimal(String(feeQty || "0"));
  if (treatment === "reduce_received" || treatment === "expense") {
    const net = g.minus(f);
    if (net.lt(0)) {
      throw Object.assign(new Error("INV_QTY_CONSERVATION"), { code: "INV_QTY_CONSERVATION" });
    }
    return canonicalDecimalString(net.toFixed());
  }
  return canonicalDecimalString(g.toFixed());
}

/** Loan v1 allocation order: penalty → fee → interest → principal */
export function allocateLoanPayment(payment, { penalty = "0", fee = "0", interest = "0", principalDue = "0" }) {
  let rest = toDecimal(String(payment));
  const out = { penalty: "0", fee: "0", interest: "0", principal: "0" };
  const buckets = [
    ["penalty", penalty],
    ["fee", fee],
    ["interest", interest],
    ["principal", principalDue],
  ];
  for (const [key, dueStr] of buckets) {
    const due = toDecimal(String(dueStr));
    const take = rest.lt(due) ? rest : due;
    out[key] = canonicalDecimalString(take.toFixed());
    rest = rest.minus(take);
  }
  return { ...out, residual: canonicalDecimalString(rest.toFixed()) };
}

/** Funds: never treat NAV as tx price unless mode says so */
export function assertFundPricingMode(mode, nav, txPrice) {
  if (mode === "NAV") {
    if (nav == null || nav === "") {
      throw Object.assign(new Error("NAV_REQUIRED"), { code: "VALIDATION_ERROR" });
    }
    return canonicalDecimalString(String(nav));
  }
  if (txPrice == null || txPrice === "") {
    throw Object.assign(new Error("TRANSACTION_PRICE_REQUIRED"), { code: "VALIDATION_ERROR" });
  }
  // Explicit separation: do not return nav when mode is not NAV
  return canonicalDecimalString(String(txPrice));
}
