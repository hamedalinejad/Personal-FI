import { createHash } from "node:crypto";
import { stableStringify } from "../domain/operation/operationEngine.js";

/**
 * Explicit valuation context — no implicit "latest".
 */
export function createValuationContext({
  valuationAsOf,
  priceAsOf,
  fxAsOf,
  cashAsOf,
  liabilityAsOf,
  baseCurrency,
  valuationMode,
  cashScope,
  liabilityScope,
  priceDatasetVersion,
  fxDatasetVersion,
  valuationPolicy,
}) {
  if (!valuationAsOf || typeof valuationAsOf !== "string") {
    throw new Error("VALUATION_ASOF_REQUIRED");
  }
  if (!baseCurrency || typeof baseCurrency !== "string") {
    throw new Error("VALUATION_BASE_CURRENCY_REQUIRED");
  }
  const ctx = {
    valuationAsOf,
    priceAsOf: priceAsOf || valuationAsOf,
    fxAsOf: fxAsOf || valuationAsOf,
    cashAsOf: cashAsOf || valuationAsOf,
    liabilityAsOf: liabilityAsOf || valuationAsOf,
    baseCurrency,
    valuationMode: valuationMode || null,
    cashScope: cashScope || null,
    liabilityScope: liabilityScope || null,
    priceDatasetVersion: priceDatasetVersion || null,
    fxDatasetVersion: fxDatasetVersion || null,
    valuationPolicy: valuationPolicy || null,
  };
  ctx.contextHash = createHash("sha256").update(stableStringify(ctx)).digest("hex").slice(0, 16);
  return Object.freeze(ctx);
}
