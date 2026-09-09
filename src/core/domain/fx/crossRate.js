import { createHash } from "node:crypto";
import { toDecimal } from "../../money/canonicalDecimal.js";
import { assertPositive } from "../../money/decimalMath.js";

/**
 * FX conversion with provenance. Missing rate → throw (never silent zero).
 * rates: { "EUR/USD": { rate: "1.1", asOf: "2026-01-01", source: "manual" } }
 *   or legacy string map "EUR/USD": "1.1"
 */
function normalizeRate(entry) {
  if (entry == null) return null;
  if (typeof entry === "number") {
    throw new Error("FX_RATE_NOT_STRING");
  }
  if (typeof entry === "string") {
    return { rate: entry, asOf: null, source: "map" };
  }
  if (typeof entry.rate !== "string") throw new Error("FX_RATE_NOT_STRING");
  return {
    rate: entry.rate,
    asOf: entry.asOf || null,
    source: entry.source || "unknown",
    isStale: !!entry.isStale,
  };
}

function lookup(rates, pair) {
  if (rates[pair] != null) return normalizeRate(rates[pair]);
  // inverse
  const [a, b] = pair.split("/");
  const inv = rates[`${b}/${a}`];
  if (inv != null) {
    const n = normalizeRate(inv);
    return {
      rate: toDecimal("1").div(toDecimal(n.rate)).toFixed(),
      asOf: n.asOf,
      source: n.source,
      isStale: n.isStale,
      inverted: true,
    };
  }
  return null;
}

export function convertAmount({ amount, from, to, rates, pivot = "USD", asOf }) {
  assertPositive(amount);
  if (from === to) {
    return {
      amount: toDecimal(amount).toFixed(),
      path: [from],
      asOf: asOf || null,
      contextHash: hashContext({ amount, from, to, path: [from], asOf }),
    };
  }

  const hops = [];
  const direct = lookup(rates, `${from}/${to}`);
  if (direct) {
    const out = toDecimal(amount).times(toDecimal(direct.rate));
    hops.push({ from, to, rate: direct.rate, asOf: direct.asOf || asOf, inverted: !!direct.inverted });
    return finish(out, [from, to], hops, asOf, amount, from, to);
  }

  const a = lookup(rates, `${from}/${pivot}`);
  const b = lookup(rates, `${pivot}/${to}`);
  if (a && b) {
    const out = toDecimal(amount).times(toDecimal(a.rate)).times(toDecimal(b.rate));
    hops.push(
      { from, to: pivot, rate: a.rate, asOf: a.asOf || asOf, inverted: !!a.inverted },
      { from: pivot, to, rate: b.rate, asOf: b.asOf || asOf, inverted: !!b.inverted },
    );
    return finish(out, [from, pivot, to], hops, asOf, amount, from, to);
  }

  throw new Error("FX_PATH_MISSING");
}

function finish(out, path, hops, asOf, amount, from, to) {
  return {
    amount: out.toFixed(),
    path,
    conversionPath: hops,
    asOf: asOf || null,
    contextHash: hashContext({ amount, from, to, path, hops, asOf }),
  };
}

function hashContext(obj) {
  return createHash("sha256").update(JSON.stringify(obj)).digest("hex").slice(0, 16);
}
