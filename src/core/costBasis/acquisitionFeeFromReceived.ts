import Decimal from 'decimal.js';
import { canonicalDecimalString } from '../money/canonicalDecimal.js';

export function acquisitionCostFromReceived(params: {
  consideration: string;
  grossQty: string;
  feeQty: string;
}): { netQty: string; totalCost: string; avgCost: string } {
  const gross = new Decimal(params.grossQty);
  const fee = new Decimal(params.feeQty);
  const net = gross.minus(fee);
  if (net.lte(0)) throw new Error('net quantity must be > 0');
  const consideration = new Decimal(params.consideration);
  return {
    netQty: canonicalDecimalString(net.toFixed()),
    totalCost: canonicalDecimalString(consideration.toFixed()),
    avgCost: canonicalDecimalString(consideration.div(net).toFixed()),
  };
}
