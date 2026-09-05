import { toDecimal } from "../money/canonicalDecimal.js";

export function applyEconomicSwap({
  sourceQty,
  sourceCarryingCost,
  consideration,
  fee = "0",
  capitalizeFee = true,
}) {
  const q = toDecimal(sourceQty);
  const carrying = toDecimal(sourceCarryingCost);
  const cons = toDecimal(consideration);
  const f = toDecimal(fee);
  if (!q.gt(0)) throw new Error("SWAP_QTY_INVALID");
  if (carrying.lt(0)) throw new Error("SWAP_CARRYING_INVALID");
  if (!cons.gt(0)) throw new Error("SWAP_CONSIDERATION_INVALID");
  if (f.lt(0)) throw new Error("SWAP_FEE_INVALID");

  const realized = cons.minus(carrying);
  const destCost = capitalizeFee ? cons.plus(f) : cons;
  return {
    realizedPnl: realized.toFixed(),
    destinationCostBasis: destCost.toFixed(),
  };
}
