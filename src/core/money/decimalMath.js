import { canonicalDecimalString } from "./canonicalDecimal.js";

export function D(s) {
  return canonicalDecimalString(String(s));
}

export function toNum(s) {
  const n = Number(D(s));
  if (!Number.isFinite(n)) throw new Error("DECIMAL_NON_FINITE");
  return n;
}

export function assertPositive(s, code = "NOT_POSITIVE") {
  const n = toNum(s);
  if (!(n > 0)) throw new Error(code);
  return n;
}

export function assertNonNegative(s, code = "NEGATIVE") {
  const n = toNum(s);
  if (!(n >= 0)) throw new Error(code);
  return n;
}

/** String-safe-ish add for test scale (production → decimal.js) */
export function add(a, b) {
  return String(toNum(a) + toNum(b));
}
export function sub(a, b) {
  return String(toNum(a) - toNum(b));
}
export function mul(a, b) {
  return String(toNum(a) * toNum(b));
}
export function div(a, b) {
  const den = toNum(b);
  if (den === 0) throw new Error("DIV_ZERO");
  return String(toNum(a) / den);
}
