import Decimal from "decimal.js";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

/**
 * P0-002 / P0-CODE-001 — canonicalize without JavaScript Number.
 * Public money boundary accepts **strings only**.
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
  return d.toFixed();
}

/** Same rejection rules as canonicalDecimalString — no String(number) coercion. */
export function toDecimal(input) {
  const s = canonicalDecimalString(input);
  return new Decimal(s);
}

export { Decimal };

/**
 * ACCOUNTING-003 — sole canonical financial aggregation helper.
 * All reports must use this instead of ad-hoc loops or SQL SUM on TEXT.
 */
export function sumDecimalStrings(values) {
  if (!Array.isArray(values)) throw new Error("SUM_DECIMAL_NOT_ARRAY");
  let total = toDecimal("0");
  for (const v of values) {
    if (v == null || v === "") continue;
    total = total.plus(toDecimal(v));
  }
  return total.toFixed();
}

export function sumDecimalSides(lines, { amountField = "amount", sideField = "side" } = {}) {
  let debit = toDecimal("0");
  let credit = toDecimal("0");
  for (const line of lines) {
    const a = toDecimal(line[amountField] ?? line.amount);
    if (line[sideField] === "debit") debit = debit.plus(a);
    else if (line[sideField] === "credit") credit = credit.plus(a);
    else throw new Error("SUM_DECIMAL_SIDE");
  }
  return { debit: debit.toFixed(), credit: credit.toFixed(), balanced: debit.eq(credit) };
}
