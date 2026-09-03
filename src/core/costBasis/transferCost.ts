import Decimal from 'decimal.js';
import { canonicalDecimalString } from '../money/canonicalDecimal.js';

export type TransferCostResult = {
  sourceCostReleased: string;
  destinationCarrying: string;
  feeCarrying: string;
};

/**
 * ONE release of gross carrying cost; split to dest(net) + fee.
 * Must not be duplicated by a second fee_burn release.
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
  if (!gross.equals(net.plus(fee))) {
    throw new Error('gross must equal net + feeQty');
  }
  const avg = cost.div(gross);
  const dest = avg.times(net);
  const feeC = avg.times(fee);
  // exact reconcilation: dest + feeC === cost (within decimal)
  const sum = dest.plus(feeC);
  if (!sum.equals(cost)) {
    // adjust fee residual to source total (last-cent to fee)
    const adjustedFee = cost.minus(dest);
    return {
      sourceCostReleased: canonicalDecimalString(cost.toFixed()),
      destinationCarrying: canonicalDecimalString(dest.toFixed()),
      feeCarrying: canonicalDecimalString(adjustedFee.toFixed()),
    };
  }
  return {
    sourceCostReleased: canonicalDecimalString(cost.toFixed()),
    destinationCarrying: canonicalDecimalString(dest.toFixed()),
    feeCarrying: canonicalDecimalString(feeC.toFixed()),
  };
}
