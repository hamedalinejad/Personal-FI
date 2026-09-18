import { createHash } from "node:crypto";
import { stableStringify } from "../operation/operationEngine.js";
import { toDecimal } from "../../money/canonicalDecimal.js";
import { assertPositive } from "../../money/decimalMath.js";

/**
 * FX: string rates only, MISSING_RATE never 0.
 * Multi-hop: BFS fewest hops, then lexical path.
 * Stale observations rejected unless allowStale=true.
 */
function normalizeRate(entry) {
  if (entry == null) return null;
  if (typeof entry === "number") throw new Error("FX_RATE_NOT_STRING");
  let rate;
  let asOf = null;
  let source = "map";
  let isStale = false;
  if (typeof entry === "string") {
    rate = entry;
  } else if (typeof entry === "object") {
    if (typeof entry.rate !== "string") throw new Error("FX_RATE_NOT_STRING");
    rate = entry.rate;
    asOf = entry.asOf || null;
    source = entry.source || "unknown";
    isStale = !!entry.isStale;
  } else {
    throw new Error("FX_RATE_NOT_STRING");
  }
  // BUG-F08: rate must be positive decimal string before graph use
  const d = toDecimal(rate);
  if (!d.gt(0)) throw new Error("FX_RATE_NONPOSITIVE");
  return { rate: d.toFixed(), asOf, source, isStale };
}

function buildGraph(rates, { asOf = null, allowStale = false } = {}) {
  const edges = new Map();
  function add(from, to, meta) {
    if (!edges.has(from)) edges.set(from, []);
    edges.get(from).push({ to, ...meta });
  }
  for (const [pair, raw] of Object.entries(rates)) {
    const n = normalizeRate(raw);
    if (!n) continue;
    const [a, b] = pair.split("/");
    if (!a || !b) continue;
    add(a, b, {
      rate: n.rate,
      asOf: n.asOf,
      source: n.source,
      isStale: n.isStale,
      inverted: false,
    });
    add(b, a, {
      rate: toDecimal("1").div(toDecimal(n.rate)).toFixed(),
      asOf: n.asOf,
      source: n.source,
      isStale: n.isStale,
      inverted: true,
    });
  }
  for (const [, list] of edges) list.sort((x, y) => x.to.localeCompare(y.to));
  return edges;
}

function findPath(edges, from, to) {
  if (from === to) return { path: [from], hops: [] };
  const queue = [{ node: from, path: [from], hops: [] }];
  const seen = new Set([from]);
  while (queue.length) {
    const cur = queue.shift();
    const outs = edges.get(cur.node) || [];
    for (const e of outs) {
      if (seen.has(e.to)) continue;
      const path = [...cur.path, e.to];
      const hops = [
        ...cur.hops,
        {
          from: cur.node,
          to: e.to,
          rate: e.rate,
          asOf: e.asOf,
          source: e.source,
          isStale: e.isStale,
          inverted: e.inverted,
        },
      ];
      if (e.to === to) return { path, hops };
      seen.add(e.to);
      queue.push({ node: e.to, path, hops });
    }
  }
  return null;
}

/**
 * @param {object} args
 * @param {string} args.amount
 * @param {string} args.from
 * @param {string} args.to
 * @param {object} args.rates map "USD/IRR" -> string | {rate, asOf, source, isStale}
 * @param {string|null} [args.asOf] historical cutoff YYYY-MM-DD
 * @param {boolean} [args.allowStale=false]
 */
export function convertAmount({ amount, from, to, rates, asOf = null, allowStale = false }) {
  assertPositive(amount);
  if (typeof amount !== "string") throw new Error("FX_AMOUNT_NOT_STRING");
  if (from === to) {
    return {
      amount: toDecimal(amount).toFixed(),
      path: [from],
      conversionPath: [],
      asOf: asOf || null,
      contextHash: hashContext({ amount, from, to, path: [from], asOf, allowStale }),
    };
  }
  const edges = buildGraph(rates || {});
  const found = findPath(edges, from, to);
  if (!found) throw new Error("MISSING_RATE");
  let out = toDecimal(amount);
  for (const h of found.hops) {
    if (h.isStale && !allowStale) {
      throw new Error("FX_RATE_STALE");
    }
    // BUG-F08: historical conversion requires dated observations
    if (asOf) {
      if (!h.asOf) throw new Error("FX_HISTORICAL_ASOF_REQUIRED");
      if (h.asOf > asOf) throw new Error("FX_OBSERVATION_AFTER_CUTOFF");
    }
    out = out.times(toDecimal(h.rate));
  }
  return {
    amount: out.toFixed(),
    path: found.path,
    conversionPath: found.hops,
    asOf: asOf || null,
    allowStale: !!allowStale,
    contextHash: hashContext({
      amount,
      from,
      to,
      path: found.path,
      hops: found.hops,
      asOf,
      allowStale,
    }),
  };
}

function hashContext(obj) {
  return createHash("sha256").update(stableStringify(obj)).digest("hex").slice(0, 16);
}
