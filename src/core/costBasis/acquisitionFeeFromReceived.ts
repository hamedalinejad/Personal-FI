import Decimal from 'decimal.js';
import { canonicalDecimalString } from '../money/canonicalDecimal.js';

export function acquisitionCostFromReceived(params: {
  consideration: string;
  grossQty: string;
  feeQty: string;
}): { netQty: string; totalCost: string; avgCost: string } {
  const gross = new Decimal(params.grossQty);
  const fee = new Decimal(params.feeQty);
  const consideration = new Decimal(params.consideration);

  if (!gross.isFinite() || gross.lte(0)) throw new Error('gross quantity must be finite and > 0');
  if (!fee.isFinite() || fee.lt(0)) throw new Error('fee quantity must be finite and >= 0');
  if (fee.gte(gross)) throw new Error('fee quantity must be less than gross quantity');
  if (!consideration.isFinite() || consideration.lte(0)) {
    throw new Error('consideration must be finite and > 0');
  }

  const net = gross.minus(fee);
  return {
    netQty: canonicalDecimalString(net.toFixed()),
    totalCost: canonicalDecimalString(consideration.toFixed()),
    avgCost: canonicalDecimalString(consideration.div(net).toFixed()),
  };
}
