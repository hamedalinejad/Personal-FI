/**
 * Shared valuation state contract (BUG-P1-05).
 * Single source of truth for host + React. No duplicated string literals.
 */

export const VALUATION_STATES = Object.freeze([
  "loading",
  "ready",
  "partial_valuation",
  "unpriced",
  "missing_fx",
  "mixed_currency_needs_report_currency",
  "stale",
  "error",
  "invalid_context",
]);

const STATE_SET = new Set(VALUATION_STATES);

/**
 * @param {unknown} state
 * @returns {boolean}
 */
export function isValidValuationState(state) {
  return typeof state === "string" && STATE_SET.has(state);
}

/**
 * @param {unknown} state
 * @returns {string} valid state or throws INVALID_VALUATION_STATE
 */
export function requireValuationState(state) {
  if (isValidValuationState(state)) return /** @type {string} */ (state);
  const err = new Error(`INVALID_VALUATION_STATE:${String(state)}`);
  err.code = "INVALID_VALUATION_STATE";
  throw err;
}

/**
 * UI-safe normalize: unknown → error (never silent ready).
 * @param {unknown} state
 * @returns {string}
 */
export function normalizeValuationState(state) {
  if (state == null || state === "") return "invalid_context";
  if (isValidValuationState(state)) return /** @type {string} */ (state);
  return "error";
}

export const ALLOWED_ASSET_CLASSES = Object.freeze(["crypto", "stocks", "funds", "metals"]);

/**
 * @param {unknown} assetClass
 * @returns {string|null} null if invalid (do not coerce)
 */
export function normalizeAssetClass(assetClass) {
  if (typeof assetClass !== "string") return null;
  const v = assetClass.trim().toLowerCase();
  if (ALLOWED_ASSET_CLASSES.includes(v)) return v;
  return null;
}
