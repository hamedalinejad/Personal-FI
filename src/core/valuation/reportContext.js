/** P1-PRICE-006 / P1-REPORT — every historical valuation result carries context */
export function buildValuationContext({
  asOf,
  priceAsOf = null,
  fxAsOf = null,
  engineVersions = null,
  staleStatus = "fresh",
} = {}) {
  if (!asOf) throw new Error("VALUATION_ASOF_REQUIRED");
  const allowed = new Set(["fresh", "stale", "missing", "degraded"]);
  if (!allowed.has(staleStatus)) throw new Error("VALUATION_STALE_STATUS_INVALID");
  return {
    asOf,
    priceAsOf: priceAsOf || asOf,
    fxAsOf: fxAsOf || asOf,
    engineVersions: engineVersions || {},
    staleStatus,
  };
}
