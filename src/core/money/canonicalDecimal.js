import Decimal from "decimal.js";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

/**
 * P0-002 — canonicalize without JavaScript Number
 */
export function canonicalDecimalString(input) {
  if (typeof input !== "string") {
    throw new Error("DECIMAL_NOT_STRING");
  }
  const s = input.trim();
  if (s === "") throw new Error("DECIMAL_EMPTY");
  if (/^nan$/i.test(s) || /^[-+]?infinity$/i.test(s)) {
    throw new Error("DECIMAL_NON_FINITE");
  }
  let d;
  try {
    d = new Decimal(s);
  } catch {
    throw new Error("DECIMAL_INVALID");
  }
  if (!d.isFinite()) throw new Error("DECIMAL_NON_FINITE");
  if (d.isZero()) return "0";
  // fixed string without exponential for normal ranges
  return d.toFixed();
}

export function toDecimal(input) {
  const s = canonicalDecimalString(String(input));
  return new Decimal(s);
}

export { Decimal };
