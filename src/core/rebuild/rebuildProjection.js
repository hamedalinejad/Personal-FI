/**
 * Deterministic projection rebuild (R-M21).
 * BUG-F07: must replay from authoritative operations — not clone projections.
 */
import { createHash } from "node:crypto";

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

function sortKey(op) {
  return [
    op.businessDate || "",
    op.createdAt || op.created_at || "",
    op.operationId || op.id || "",
  ].join("|");
}

/**
 * Rebuild projections from posted operations up to asOf.
 * @param {object} args
 * @param {string} args.asOf
 * @param {object} args.sourceLedger must include operations[] (posted financial history)
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
  if (!Array.isArray(sourceLedger.operations)) {
    throw new Error("REBUILD_REQUIRES_OPERATIONS");
  }

  const ops = sourceLedger.operations
    .filter((o) => {
      const status = o.status || "posted";
      const bd = o.businessDate || o.business_date;
      return status === "posted" && bd && bd <= asOf;
    })
    .slice()
    .sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : sortKey(a) > sortKey(b) ? 1 : 0));

  // Reconstruct simple projection bags from journal/domain facts on each op
  const holdings = {};
  const projections = { operationCount: 0, byType: {} };
  for (const op of ops) {
    projections.operationCount += 1;
    const t = op.type || "unknown";
    projections.byType[t] = (projections.byType[t] || 0) + 1;
    const dr = op.domainResult || {};
    if (dr.holdingId && dr.quantity != null) {
      holdings[dr.holdingId] = {
        holdingId: dr.holdingId,
        quantity: String(dr.quantity),
        instrumentId: dr.instrumentId || op.payload?.instrumentId || null,
        cost: dr.cost != null ? String(dr.cost) : null,
      };
    }
  }

  const input = {
    asOf,
    engineVersions,
    policyVersions,
    watermark,
    priceContext,
    fxContext,
    operationIds: ops.map((o) => o.operationId || o.id),
  };
  const inputHash = createHash("sha256").update(stableStringify(input)).digest("hex");
  const resultPayload = { projections, holdings: Object.values(holdings) };
  const resultHash = createHash("sha256").update(stableStringify(resultPayload)).digest("hex");

  return {
    asOf,
    engineVersions: { ...engineVersions },
    policyVersions: { ...policyVersions },
    watermark,
    priceContext,
    fxContext,
    projections,
    holdings: Object.values(holdings),
    inputHash,
    resultHash,
    operationCount: ops.length,
    deterministic: true,
    method: "replay_operations",
  };
}
