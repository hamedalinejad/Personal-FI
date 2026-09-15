/**
 * Deterministic projection rebuild contract (R-M21).
 * No live providers — only ledger + pinned contexts.
 */
export function rebuildProjection({
  asOf,
  engineVersions = {},
  sourceLedger,
  priceContext = null,
  fxContext = null,
  policyVersions = {},
  watermark = null,
} = {}) {
  if (!asOf || typeof asOf !== "string") throw new Error("REBUILD_ASOF_REQUIRED");
  if (!sourceLedger || typeof sourceLedger !== "object") throw new Error("REBUILD_LEDGER_REQUIRED");
  // Placeholder executable surface: callers supply ledger snapshot; full event replay is vertical-specific.
  return {
    asOf,
    engineVersions,
    policyVersions,
    watermark,
    priceContext,
    fxContext,
    projections: sourceLedger.projections || {},
    rebuildVersion: "1.0.0-scaffold",
  };
}
