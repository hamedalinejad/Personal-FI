import { createHash } from "node:crypto";
import { stableStringify } from "../operation/operationEngine.js";
import { toDecimal } from "../../money/canonicalDecimal.js";
import { assertPositive } from "../../money/decimalMath.js";

/**
 * FX: string rates only, MISSING_RATE never 0.
 * Multi-hop: BFS fewest hops, then lexical path.
 */
function normalizeRate(entry) {
  if (entry == null) return null;
  if (typeof entry === "number") throw new Error("FX_RATE_NOT_STRING");
  if (typeof entry === "string") {
    return { rate: entry, asOf: null, source: "map", isStale: false };
  }
  if (typeof entry.rate !== "string") throw new Error("FX_RATE_NOT_STRING");
  return {
    rate: entry.rate,
    asOf: entry.asOf || null,
    source: entry.source || "unknown",
    isStale: !!entry.isStale,
  };
}

function buildGraph(rates) {
  const edges = new Map(); // from -> [{to, rate, asOf, source, inverted}]
  function add(from, to, meta) {
    if (!edges.has(from)) edges.set(from, []);
    edges.get(from).push({ to, ...meta });
  }
  for (const [pair, raw] of Object.entries(rates)) {
    const n = normalizeRate(raw);
    if (!n) continue;
    const [a, b] = pair.split("/");
    if (!a || !b) continue;
    add(a, b, { rate: n.rate, asOf: n.asOf, source: n.source, inverted: false });
    add(b, a, {
      rate: toDecimal("1").div(toDecimal(n.rate)).toFixed(),
      asOf: n.asOf,
      source: n.source,
      inverted: true,
    });
  }
  // stable order
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
        { from: cur.node, to: e.to, rate: e.rate, asOf: e.asOf, inverted: e.inverted },
      ];
      if (e.to === to) return { path, hops };
      seen.add(e.to);
      queue.push({ node: e.to, path, hops });
    }
  }
  return null;
}

export function convertAmount({ amount, from, to, rates, asOf }) {
  assertPositive(amount);
  if (typeof amount !== "string") throw new Error("FX_AMOUNT_NOT_STRING");
  if (from === to) {
    return {
      amount: toDecimal(amount).toFixed(),
      path: [from],
      conversionPath: [],
      asOf: asOf || null,
      contextHash: hashContext({ amount, from, to, path: [from], asOf }),
    };
  }
  const edges = buildGraph(rates);
  const found = findPath(edges, from, to);
  if (!found) throw new Error("MISSING_RATE");
  let out = toDecimal(amount);
  for (const h of found.hops) {
    if (asOf && h.asOf && h.asOf > asOf) {
      // observation after asOf not allowed for historical
      throw new Error("MISSING_RATE");
    }
    out = out.times(toDecimal(h.rate));
  }
  return {
    amount: out.toFixed(),
    path: found.path,
    conversionPath: found.hops,
    asOf: asOf || null,
    contextHash: hashContext({
      amount,
      from,
      to,
      path: found.path,
      hops: found.hops,
      asOf,
    }),
  };
}

function hashContext(obj) {
  return createHash("sha256").update(stableStringify(obj)).digest("hex").slice(0, 16);
}
