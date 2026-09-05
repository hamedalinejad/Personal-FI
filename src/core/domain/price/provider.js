const manual = new Map();
const cache = new Map();

export function setManualPrice(instrumentId, price, asOf) {
  manual.set(instrumentId, { price: String(price), asOf, source: "manual" });
}

export function cachePrice(instrumentId, price, asOf) {
  cache.set(instrumentId, { price: String(price), asOf, source: "cached" });
}

/**
 * Selection: manual > cached > online(optional)
 * Offline: never throws if last known exists; sets isStale
 */
export function getPrice(instrumentId, { onlineFetch } = {}) {
  if (manual.has(instrumentId)) {
    return { ...manual.get(instrumentId), isStale: false };
  }
  if (cache.has(instrumentId)) {
    return { ...cache.get(instrumentId), isStale: true, reconciliationNeeded: true };
  }
  if (typeof onlineFetch === "function") {
    const p = onlineFetch(instrumentId);
    if (p) {
      cachePrice(instrumentId, p.price, p.asOf);
      return { ...p, source: "online", isStale: false };
    }
  }
  throw new Error("PRICE_MISSING");
}
