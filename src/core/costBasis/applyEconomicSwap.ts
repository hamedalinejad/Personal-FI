import Decimal from 'decimal.js';
import { canonicalDecimalString } from '../money/canonicalDecimal.js';

/**
 * economic_trade_or_swap only.
 * destination cost = consideration (+ capitalized fees later);
 * NOT source carrying cost.
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
  const realized = consideration.minus(released).minus(saleFee);
  const destinationCost = consideration.plus(cap);
  return {
    realized: canonicalDecimalString(realized.toFixed()),
    destinationCost: canonicalDecimalString(destinationCost.toFixed()),
  };
}
