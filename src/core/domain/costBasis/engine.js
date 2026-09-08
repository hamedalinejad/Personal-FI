import { transferCost } from "../../costBasis/transferCost.js";
import { acquisitionFeeFromReceived } from "../../costBasis/acquisitionFeeFromReceived.js";
import { applyEconomicSwap } from "../../costBasis/applyEconomicSwap.js";
import { toDecimal } from "../../money/canonicalDecimal.js";
import { assertPositive, assertNonNegative } from "../../money/decimalMath.js";

export function applyAcquisition(state, { quantity, costTotal }) {
  const q = assertPositive(quantity, "ACQ_QTY");
  const c = assertNonNegative(costTotal, "ACQ_COST");
  const prevQ = toDecimal(state.quantity || "0");
  const prevC = toDecimal(state.totalInvested || "0");
  const newQ = prevQ.plus(q);
  const newC = prevC.plus(c);
  return {
    quantity: newQ.toFixed(),
    totalInvested: newC.toFixed(),
    averageCost: newQ.isZero() ? "0" : newC.div(newQ).toFixed(),
  };
}

export function applyDisposal(state, { quantity, proceeds }) {
  const q = assertPositive(quantity, "DIS_QTY");
  const p = assertNonNegative(proceeds, "DIS_PROCEEDS");
  const prevQ = toDecimal(state.quantity || "0");
  const prevC = toDecimal(state.totalInvested || "0");
  if (q.gt(prevQ)) throw new Error("DIS_INSUFFICIENT_QTY");
  const avg = prevQ.isZero() ? toDecimal("0") : prevC.div(prevQ);
  const costReleased = q.times(avg);
  const realized = p.minus(costReleased);
  const newQ = prevQ.minus(q);
  const newC = prevC.minus(costReleased);
  return {
    quantity: newQ.toFixed(),
    totalInvested: newC.toFixed(),
    averageCost: newQ.isZero() ? "0" : newC.div(newQ).toFixed(),
    costReleased: costReleased.toFixed(),
    realizedPnl: realized.toFixed(),
  };
}

/** P0-CODE-012 — one fee role → one economic allocation; amounts validated. */
export function applyFee(state, { role, feeAmount, feeQty = "0", currency, timing }) {
  const known = new Set([
    "acquisition_fee_from_received",
    "post_acquisition_network_burn",
    "standalone_asset_burn",
    "sale_fee_from_proceeds",
  ]);
  if (!known.has(role)) throw new Error(`FEE_ROLE_UNKNOWN:${role}`);

  switch (role) {
    case "acquisition_fee_from_received": {
      // Full path: use acquisitionFeeFromReceived helper; net qty already reduced
      if (feeAmount != null) assertNonNegative(feeAmount, "FEE_AMOUNT");
      if (feeQty != null && feeQty !== "0") assertNonNegative(feeQty, "FEE_QTY");
      return {
        ...state,
        lastFeeEvent: {
          role,
          feeAmount: feeAmount || "0",
          feeQty: feeQty || "0",
          currency: currency || null,
          timing: timing || "acquisition",
          allocation: "reduce_received_qty",
        },
      };
    }
    case "post_acquisition_network_burn":
    case "standalone_asset_burn": {
      const fq = assertNonNegative(feeQty, "FEE_QTY");
      if (fq.lte(0)) throw new Error("FEE_QTY_REQUIRED");
      const prevQ = toDecimal(state.quantity || "0");
      const prevC = toDecimal(state.totalInvested || "0");
      if (fq.gt(prevQ)) throw new Error("FEE_QTY_EXCEEDS");
      const avg = prevQ.isZero() ? toDecimal("0") : prevC.div(prevQ);
      const costBurn = fq.times(avg);
      const newQ = prevQ.minus(fq);
      const newC = prevC.minus(costBurn);
      return {
        quantity: newQ.toFixed(),
        totalInvested: newC.toFixed(),
        averageCost: newQ.isZero() ? "0" : newC.div(newQ).toFixed(),
        feeCostReleased: costBurn.toFixed(),
        lastFeeEvent: {
          role,
          feeQty: fq.toFixed(),
          allocation: "burn_quantity_release_cost",
          timing: timing || "post_acquisition",
        },
      };
    }
    case "sale_fee_from_proceeds": {
      const fee = assertNonNegative(feeAmount, "FEE_AMOUNT");
      if (fee.lt(0)) throw new Error("FEE_AMOUNT");
      return {
        ...state,
        saleFee: fee.toFixed(),
        lastFeeEvent: {
          role,
          feeAmount: fee.toFixed(),
          currency: currency || null,
          timing: timing || "disposal",
          allocation: "reduce_proceeds",
        },
      };
    }
    default:
      throw new Error(`FEE_ROLE_UNKNOWN:${role}`);
  }
}

export function applyTransfer(stateFrom, stateTo, params) {
  const t = transferCost(params);
  const from = applyDisposal(stateFrom, {
    quantity: params.grossQuantity,
    proceeds: t.sourceCostReleased,
  });
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

export { transferCost, acquisitionFeeFromReceived, applyEconomicSwap };
