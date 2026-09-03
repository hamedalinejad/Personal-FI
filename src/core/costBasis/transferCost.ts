import Decimal from 'decimal.js';
import { canonicalDecimalString } from '../money/canonicalDecimal.js';

export type TransferCostResult = {
  sourceCostReleased: string;
  destinationCarrying: string;
  feeCarrying: string;
};

/**
 * Releases the carrying cost attributable to the gross quantity exactly once,
 * then splits that released cost between the net quantity moved and the fee.
 * `beforeCost` MUST be the cost attributable to `gross`, not an unrelated pool.
 */
export function transferCost(params: {
  beforeCost: string;
  gross: string;
  net: string;
  feeQty: string;
}): TransferCostResult {
  const cost = new Decimal(params.beforeCost);
  const gross = new Decimal(params.gross);
  const net = new Decimal(params.net);
  const fee = new Decimal(params.feeQty);

  if (!cost.isFinite() || cost.lt(0)) throw new Error('beforeCost must be finite and non-negative');
  if (!gross.isFinite() || gross.lte(0)) throw new Error('gross quantity must be finite and > 0');
  if (!net.isFinite() || net.lt(0)) throw new Error('net quantity must be finite and >= 0');
  if (!fee.isFinite() || fee.lt(0)) throw new Error('fee quantity must be finite and >= 0');
  if (!gross.equals(net.plus(fee))) {
    throw new Error('gross must equal net + feeQty');
  }

  const avg = cost.div(gross);
  const destination = avg.times(net);
  // Allocate the residual to fee so the released pool is exactly conserved.
  const feeCarrying = cost.minus(destination);
  const reconciled = destination.plus(feeCarrying);
  if (!reconciled.equals(cost)) {
    throw new Error('transfer cost allocation failed to reconcile');
  }

  return {
    sourceCostReleased: canonicalDecimalString(cost.toFixed()),
    destinationCarrying: canonicalDecimalString(destination.toFixed()),
    feeCarrying: canonicalDecimalString(feeCarrying.toFixed()),
  };
}
