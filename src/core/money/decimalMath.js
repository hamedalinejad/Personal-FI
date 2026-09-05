import { canonicalDecimalString, toDecimal, Decimal } from "./canonicalDecimal.js";

export function D(s) {
  return canonicalDecimalString(String(s));
}

/** @deprecated use toDecimal — kept name but no Number */
export function toNum(s) {
  // Returns Decimal for call sites that still treat as numeric-like; prefer toDecimal
  return toDecimal(s);
}

export function assertPositive(s, code = "NOT_POSITIVE") {
  const d = toDecimal(s);
  if (d.lte(0)) throw new Error(code);
  return d;
}

export function assertNonNegative(s, code = "NEGATIVE") {
  const d = toDecimal(s);
  if (d.lt(0)) throw new Error(code);
  return d;
}

export function add(a, b) {
  return toDecimal(a).plus(toDecimal(b)).toFixed();
}
export function sub(a, b) {
  return toDecimal(a).minus(toDecimal(b)).toFixed();
}
export function mul(a, b) {
  return toDecimal(a).times(toDecimal(b)).toFixed();
}
export function div(a, b) {
  const den = toDecimal(b);
  if (den.isZero()) throw new Error("DIV_ZERO");
  return toDecimal(a).div(den).toFixed();
}

export function eq(a, b) {
  return toDecimal(a).eq(toDecimal(b));
}

export { Decimal, toDecimal, canonicalDecimalString };
