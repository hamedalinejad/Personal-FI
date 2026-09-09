import { toDecimal } from "../money/canonicalDecimal.js";

/**
 * Iran display convention: 1 Toman = 10 IRR.
 * Book currency remains IRR only.
 */
export const TOMAN_PER_IRR = "10";

export function tomanToIrr(tomanAmount) {
  return toDecimal(tomanAmount).times(TOMAN_PER_IRR).toFixed();
}

export function irrToToman(irrAmount) {
  return toDecimal(irrAmount).div(TOMAN_PER_IRR).toFixed();
}

/**
 * Normalize UI input to IRR before journal.
 * @param {{ amount: string, unit: 'IRR'|'TOMAN' }} input
 */
export function normalizeIranMoneyInput({ amount, unit }) {
  if (unit === "IRR") return { amount: toDecimal(amount).toFixed(), currency: "IRR", displayUnit: "IRR" };
  if (unit === "TOMAN") {
    return {
      amount: tomanToIrr(amount),
      currency: "IRR",
      displayUnit: "TOMAN",
      rawDisplayAmount: toDecimal(amount).toFixed(),
    };
  }
  throw new Error("IRAN_MONEY_UNIT_UNKNOWN");
}
