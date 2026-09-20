/**
 * Mirrored valuation state contract (must match src/application/contracts/valuationState.js).
 * BUG-P1-05: single vocabulary; no silent ready default.
 */

export const VALUATION_STATES = [
  "loading",
  "ready",
  "partial_valuation",
  "unpriced",
  "missing_fx",
  "mixed_currency_needs_report_currency",
  "stale",
  "error",
  "invalid_context",
] as const;

export type ValuationState = (typeof VALUATION_STATES)[number];

const STATE_SET = new Set<string>(VALUATION_STATES);

export function isValidValuationState(state: unknown): state is ValuationState {
  return typeof state === "string" && STATE_SET.has(state);
}

/** Unknown → error/invalid_context — never "ready" */
export function normalizeValuationState(state: unknown): ValuationState {
  if (state == null || state === "") return "invalid_context";
  if (isValidValuationState(state)) return state;
  return "error";
}

export const ALLOWED_ASSET_CLASSES = ["crypto", "stocks", "funds", "metals"] as const;
export type AssetClass = (typeof ALLOWED_ASSET_CLASSES)[number];

export function normalizeAssetClass(assetClass: unknown): AssetClass | null {
  if (typeof assetClass !== "string") return null;
  const v = assetClass.trim().toLowerCase();
  return (ALLOWED_ASSET_CLASSES as readonly string[]).includes(v) ? (v as AssetClass) : null;
}
