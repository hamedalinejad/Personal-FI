import { transferCost } from "../../costBasis/transferCost.js";
import { acquisitionFeeFromReceived } from "../../costBasis/acquisitionFeeFromReceived.js";
import { applyEconomicSwap } from "../../costBasis/applyEconomicSwap.js";
import { toNum, assertPositive, assertNonNegative, add, sub, mul, div } from "../../money/decimalMath.js";

/**
 * Weighted-average cost basis engine (v1)
 */
export function applyAcquisition(state, { quantity, costTotal }) {
  const q = assertPositive(quantity, "ACQ_QTY");
  const c = assertNonNegative(costTotal, "ACQ_COST");
  const prevQ = state.quantity ? toNum(state.quantity) : 0;
  const prevC = state.totalInvested ? toNum(state.totalInvested) : 0;
  const newQ = prevQ + q;
  const newC = prevC + c;
  return {
    quantity: String(newQ),
    totalInvested: String(newC),
    averageCost: newQ === 0 ? "0" : String(newC / newQ),
  };
}

export function applyDisposal(state, { quantity, proceeds }) {
  const q = assertPositive(quantity, "DIS_QTY");
  const p = assertNonNegative(proceeds, "DIS_PROCEEDS");
  const prevQ = toNum(state.quantity || "0");
  const prevC = toNum(state.totalInvested || "0");
  if (q > prevQ + 1e-12) throw new Error("DIS_INSUFFICIENT_QTY");
  const avg = prevQ === 0 ? 0 : prevC / prevQ;
  const costReleased = q * avg;
  const realized = p - costReleased;
  const newQ = prevQ - q;
  const newC = prevC - costReleased;
  return {
    quantity: String(newQ),
    totalInvested: String(newC),
    averageCost: newQ === 0 ? "0" : String(newC / newQ),
    costReleased: String(costReleased),
    realizedPnl: String(realized),
  };
}

export function applyFee(state, { role, feeAmount, feeQty = "0" }) {
  // roles: acquisition_fee_from_received | post_acquisition_network_burn | sale_fee_from_proceeds | standalone_asset_burn
  switch (role) {
    case "acquisition_fee_from_received":
      return { ...state, note: "handled at acquisition net qty" };
    case "post_acquisition_network_burn":
    case "standalone_asset_burn": {
      const fq = assertNonNegative(feeQty, "FEE_QTY");
      const prevQ = toNum(state.quantity || "0");
      const prevC = toNum(state.totalInvested || "0");
      if (fq > prevQ) throw new Error("FEE_QTY_EXCEEDS");
      const avg = prevQ === 0 ? 0 : prevC / prevQ;
      const costBurn = fq * avg;
      return {
        quantity: String(prevQ - fq),
        totalInvested: String(prevC - costBurn),
        averageCost: prevQ - fq === 0 ? "0" : String((prevC - costBurn) / (prevQ - fq)),
        feeCostReleased: String(costBurn),
      };
    }
    case "sale_fee_from_proceeds":
      return { ...state, saleFee: feeAmount };
    default:
      throw new Error(`FEE_ROLE_UNKNOWN:${role}`);
  }
}

export function applyTransfer(stateFrom, stateTo, params) {
  const t = transferCost(params);
  const from = applyDisposal(stateFrom, {
    quantity: params.grossQuantity,
    proceeds: t.sourceCostReleased, // internal: no realized
  });
  // override realized to 0 for internal transfer
  from.realizedPnl = "0";
  const to = applyAcquisition(stateTo || { quantity: "0", totalInvested: "0" }, {
    quantity: params.netQuantity,
    costTotal: t.destinationCarrying,
  });
  return { from, to, transfer: t };
}

export function applyC2CSwap(sourceState, params) {
  const swap = applyEconomicSwap(params);
  const afterSource = applyDisposal(sourceState, {
    quantity: params.sourceQty,
    proceeds: params.consideration,
  });
  return { afterSource, swap };
}

export {
  transferCost,
  acquisitionFeeFromReceived,
  applyEconomicSwap,
};
