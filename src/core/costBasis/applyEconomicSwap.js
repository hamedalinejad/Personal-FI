import { canonicalDecimalString } from "../money/canonicalDecimal.js";

function asNum(s) {
  const c = canonicalDecimalString(String(s));
  const n = Number(c);
  if (!Number.isFinite(n)) throw new Error("DECIMAL_NON_FINITE");
  return n;
}

/**
 * BUG-CODE-004 — destination cost from economic consideration, not market mark
 */
export function applyEconomicSwap({
  sourceQty,
  sourceCarryingCost,
  consideration,
  fee = "0",
  capitalizeFee = true,
}) {
  const q = asNum(sourceQty);
  const carrying = asNum(sourceCarryingCost);
  const cons = asNum(consideration);
  const f = asNum(fee);
  if (!(q > 0)) throw new Error("SWAP_QTY_INVALID");
  if (!(carrying >= 0)) throw new Error("SWAP_CARRYING_INVALID");
  if (!(cons > 0)) throw new Error("SWAP_CONSIDERATION_INVALID");
  if (!(f >= 0)) throw new Error("SWAP_FEE_INVALID");

  const realized = cons - carrying;
  const destCost = capitalizeFee ? cons + f : cons;
  return {
    realizedPnl: String(realized),
    destinationCostBasis: String(destCost),
    // explicit: marketPrice not used
  };
}
