import { canonicalDecimalString } from "../../money/canonicalDecimal.js";

const manual = new Map();
const cache = new Map();

function validateObservation(o, instrumentId) {
  if (!o || typeof o !== "object") throw new Error("PRICE_INVALID_OBSERVATION");
  if (typeof o.price !== "string") throw new Error("PRICE_NOT_STRING");
  canonicalDecimalString(o.price);
  if (!o.currency || typeof o.currency !== "string") throw new Error("PRICE_CURRENCY_REQUIRED");
  if (!o.asOf || typeof o.asOf !== "string") throw new Error("PRICE_ASOF_REQUIRED");
  return {
    instrumentId: o.instrumentId || instrumentId,
    price: o.price,
    currency: o.currency,
    quoteType: o.quoteType || "last",
    asOf: o.asOf,
    fetchedAt: o.fetchedAt || new Date().toISOString(),
    source: o.source || "unknown",
    isStale: !!o.isStale,
    isManual: !!o.isManual,
    provenance: o.provenance || null,
  };
}

export function setManualPrice(instrumentId, price, asOf, currency = "IRR") {
  const obs = validateObservation(
    { price: String(price), asOf, currency, source: "manual", isManual: true, isStale: false },
    instrumentId,
  );
  manual.set(instrumentId, obs);
  return obs;
}

export function cachePrice(instrumentId, observation) {
  const obs = validateObservation(
    typeof observation === "object"
      ? observation
      : { price: String(observation), asOf: arguments[2], currency: arguments[3] || "IRR", source: "cached", isStale: true },
    instrumentId,
  );
  cache.set(instrumentId, { ...obs, source: obs.source || "cached", isStale: true });
  return cache.get(instrumentId);
}

/**
 * Async-safe price resolution. onlineFetch may return observation or Promise.
 */
export async function getPrice(instrumentId, { onlineFetch } = {}) {
  if (manual.has(instrumentId)) {
    return { ...manual.get(instrumentId), isStale: false, isManual: true };
  }
  if (cache.has(instrumentId)) {
    return {
      ...cache.get(instrumentId),
      isStale: true,
      reconciliationNeeded: true,
    };
  }
  if (typeof onlineFetch === "function") {
    let p = onlineFetch(instrumentId);
    if (p && typeof p.then === "function") p = await p;
    if (!p) throw new Error("PRICE_MISSING");
    const obs = validateObservation({ ...p, source: p.source || "online" }, instrumentId);
    cache.set(instrumentId, { ...obs, isStale: false });
    return obs;
  }
  throw new Error("PRICE_MISSING");
}

/** Sync helper for tests that only use manual/cache */
export function getPriceSync(instrumentId) {
  if (manual.has(instrumentId)) return { ...manual.get(instrumentId), isStale: false };
  if (cache.has(instrumentId)) return { ...cache.get(instrumentId), isStale: true };
  throw new Error("PRICE_MISSING");
}
