import { toDecimal } from "../../money/canonicalDecimal.js";
import { assertPositive, assertNonNegative } from "../../money/decimalMath.js";

/** fineWeight = grossWeight × purityRatio */
export function computeFineWeight({ grossWeight, purityRatio }) {
  const g = assertPositive(grossWeight, "GROSS_WEIGHT");
  const r = assertNonNegative(purityRatio, "PURITY_RATIO");
  if (r.gt(1)) throw new Error("PURITY_RATIO_GT_1");
  return g.times(r).toFixed();
}

/** Premium is separate from metal price — both required as strings when present */
export function metalsCostComponents({ fineWeight, metalPrice, premium = "0", fee = "0" }) {
  const fw = toDecimal(fineWeight);
  const mp = toDecimal(metalPrice);
  const pr = toDecimal(premium);
  const f = toDecimal(fee);
  const metalCost = fw.times(mp);
  return {
    metalCost: metalCost.toFixed(),
    premium: pr.toFixed(),
    fee: f.toFixed(),
    totalCost: metalCost.plus(pr).plus(f).toFixed(),
  };
}
