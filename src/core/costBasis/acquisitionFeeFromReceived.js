import { canonicalDecimalString } from "../money/canonicalDecimal.js";

function asNum(s) {
  const c = canonicalDecimalString(String(s));
  const n = Number(c);
  if (!Number.isFinite(n)) throw new Error("DECIMAL_NON_FINITE");
  return n;
}

/** BUG-CODE-003 */
export function acquisitionFeeFromReceived({ gross, fee, consideration }) {
  const g = asNum(gross);
  const f = asNum(fee);
  const c = asNum(consideration);
  if (!(g > 0)) throw new Error("ACQ_GROSS_INVALID");
  if (!(f >= 0 && f < g)) throw new Error("ACQ_FEE_INVALID");
  if (!(c > 0)) throw new Error("ACQ_CONSIDERATION_INVALID");
  const net = g - f;
  return {
    netQuantity: String(net),
    costOnNet: String(c),
    unitCost: String(c / net),
  };
}
