import { toDecimal, canonicalDecimalString } from "../money/canonicalDecimal.js";

export function transferCost({
  grossQuantity,
  feeQuantity,
  netQuantity,
  sourceUnitCost,
}) {
  const gross = toDecimal(grossQuantity);
  const fee = toDecimal(feeQuantity ?? "0");
  const net = toDecimal(netQuantity);
  const unit = toDecimal(sourceUnitCost);

  if (!gross.gt(0)) throw new Error("TRANSFER_GROSS_INVALID");
  if (fee.lt(0)) throw new Error("TRANSFER_FEE_INVALID");
  if (!net.gt(0)) throw new Error("TRANSFER_NET_INVALID");
  if (unit.lt(0)) throw new Error("TRANSFER_UNIT_COST_INVALID");
  if (!gross.eq(net.plus(fee))) throw new Error("TRANSFER_GROSS_NET_FEE_MISMATCH");

  const sourceCostReleased = gross.times(unit);
  const destinationCarrying = net.times(unit);
  const feeCarrying = sourceCostReleased.minus(destinationCarrying);

  return {
    sourceCostReleased: sourceCostReleased.toFixed(),
    destinationCarrying: destinationCarrying.toFixed(),
    feeCarrying: feeCarrying.toFixed(),
  };
}
