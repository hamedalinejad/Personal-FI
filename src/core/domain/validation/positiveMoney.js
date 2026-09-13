import { toDecimal } from "../../money/canonicalDecimal.js";

/** Reject non-positive money/qty strings. */
export function assertPositive(value, code = "NONPOSITIVE") {
  const d = toDecimal(value);
  if (!d.gt(0)) throw new Error(code);
  return d;
}

export function assertNonNegative(value, code = "NEGATIVE") {
  const d = toDecimal(value);
  if (d.isNegative()) throw new Error(code);
  return d;
}
