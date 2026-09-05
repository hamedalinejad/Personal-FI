import { toDecimal } from "../money/canonicalDecimal.js";

export function acquisitionFeeFromReceived({ gross, fee, consideration }) {
  const g = toDecimal(gross);
  const f = toDecimal(fee);
  const c = toDecimal(consideration);
  if (!g.gt(0)) throw new Error("ACQ_GROSS_INVALID");
  if (f.lt(0) || !f.lt(g)) throw new Error("ACQ_FEE_INVALID");
  if (!c.gt(0)) throw new Error("ACQ_CONSIDERATION_INVALID");
  const net = g.minus(f);
  return {
    netQuantity: net.toFixed(),
    costOnNet: c.toFixed(),
    unitCost: c.div(net).toFixed(),
  };
}
