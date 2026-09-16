/**
 * Deterministic projection rebuild (R-M21).
 * No live providers — only ledger + pinned contexts.
 */
import { createHash } from "node:crypto";

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

/**
 * @param {object} args
 * @param {string} args.asOf YYYY-MM-DD
 * @param {object} [args.engineVersions]
 * @param {object} args.sourceLedger — immutable snapshot { projections?, operations?, holdings? }
 * @param {object|null} [args.priceContext]
 * @param {object|null} [args.fxContext]
 * @param {object} [args.policyVersions]
 * @param {string|null} [args.watermark]
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

  const input = {
    asOf,
    engineVersions,
    policyVersions,
    watermark,
    priceContext,
    fxContext,
    sourceLedger,
  };
  const inputHash = createHash("sha256").update(stableStringify(input)).digest("hex");

  return {
    asOf,
    engineVersions: { ...engineVersions },
    policyVersions: { ...policyVersions },
    watermark,
    priceContext,
    fxContext,
    projections: structuredClone(sourceLedger.projections || {}),
    holdings: structuredClone(sourceLedger.holdings || {}),
    rebuildVersion: "1.1.0",
    inputHash,
    deterministic: true,
  };
}
