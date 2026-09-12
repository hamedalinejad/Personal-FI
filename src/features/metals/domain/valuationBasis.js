/**
 * METAL-002 — Coin vs bullion identity.
 * Coins: instrument carries unit/valuation basis. Do not default to fine-weight × bullion price.
 */
export function assertInstrumentValuationPolicy({ assetClass, instrumentId, valuationMode }) {
  const coinClasses = new Set(["gold_coin", "coin", "metal_coin"]);
  const isCoin =
    coinClasses.has(assetClass) ||
    (typeof instrumentId === "string" && /coin|emami|bahar|azadi/i.test(instrumentId));

  if (isCoin && valuationMode === "fine_weight_metal_price") {
    throw new Error(
      "METAL_COIN_VALUATION: fine_weight_metal_price is analytical only — use instrument_quote or explicit_analytical",
    );
  }
  if (isCoin && valuationMode === "explicit_analytical") {
    return { basis: "analytical_metal_equivalent", soT: false };
  }
  if (isCoin) {
    return { basis: "instrument_quote", soT: true };
  }
  return { basis: "bullion_fine_weight_or_quote", soT: true };
}
