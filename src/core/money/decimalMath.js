import { canonicalDecimalString, toDecimal, Decimal } from "./canonicalDecimal.js";

/** @deprecated prefer toDecimal — requires string */
export function D(s) {
  return canonicalDecimalString(s);
}

/** @deprecated use toDecimal */
export function toNum(s) {
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
