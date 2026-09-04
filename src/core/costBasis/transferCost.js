import { canonicalDecimalString } from "../money/canonicalDecimal.js";

function asNum(s) {
  const c = canonicalDecimalString(String(s));
  const n = Number(c);
  if (!Number.isFinite(n)) throw new Error("DECIMAL_NON_FINITE");
  return n;
}

/**
 * BUG-CODE-002 — transfer cost conservation
 * feeCarrying = sourceCostReleased - destinationCarrying
 * (v1 uses Number; production should use decimal.js — invariant is conservation identity)
 */
export function transferCost({
  grossQuantity,
  feeQuantity,
  netQuantity,
  sourceUnitCost,
}) {
  const gross = asNum(grossQuantity);
  const fee = asNum(feeQuantity ?? "0");
  const net = asNum(netQuantity);
  const unit = asNum(sourceUnitCost);

  if (!(gross > 0)) throw new Error("TRANSFER_GROSS_INVALID");
  if (!(fee >= 0)) throw new Error("TRANSFER_FEE_INVALID");
  if (!(net > 0)) throw new Error("TRANSFER_NET_INVALID");
  if (!(unit >= 0)) throw new Error("TRANSFER_UNIT_COST_INVALID");
  if (Math.abs(gross - (net + fee)) > 1e-9) {
    throw new Error("TRANSFER_GROSS_NET_FEE_MISMATCH");
  }

  const sourceCostReleased = gross * unit;
  const destinationCarrying = net * unit;
  const feeCarrying = sourceCostReleased - destinationCarrying;

  return {
    sourceCostReleased: canonicalDecimalString(String(sourceCostReleased)),
    destinationCarrying: String(destinationCarrying),
    feeCarrying: String(feeCarrying),
  };
}
