import Decimal from 'decimal.js';
import { canonicalDecimalString } from '../money/canonicalDecimal.js';

/**
 * economic_trade_or_swap only.
 * Destination cost is the explicit economic consideration plus capitalized
 * acquisition fees; it is never inherited from source carrying cost.
 */
export function applyEconomicSwap(params: {
  sourceCarryingReleased: string;
  swapConsideration: string;
  saleFee: string;
  capitalizedDestFees?: string;
}): {
  realized: string;
  destinationCost: string;
} {
  const released = new Decimal(params.sourceCarryingReleased);
  const consideration = new Decimal(params.swapConsideration);
  const saleFee = new Decimal(params.saleFee);
  const cap = new Decimal(params.capitalizedDestFees ?? '0');

  if (!released.isFinite() || released.lt(0)) throw new Error('source carrying cost must be finite and non-negative');
  if (!consideration.isFinite() || consideration.lte(0)) throw new Error('swap consideration must be finite and > 0');
  if (!saleFee.isFinite() || saleFee.lt(0)) throw new Error('sale fee must be finite and >= 0');
  if (!cap.isFinite() || cap.lt(0)) throw new Error('capitalized destination fee must be finite and >= 0');

  const realized = consideration.minus(released).minus(saleFee);
  const destinationCost = consideration.plus(cap);
  return {
    realized: canonicalDecimalString(realized.toFixed()),
    destinationCost: canonicalDecimalString(destinationCost.toFixed()),
  };
}
