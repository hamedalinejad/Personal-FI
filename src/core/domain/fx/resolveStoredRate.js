/**
 * Deterministic FX observation resolver.
 * Historical path: never "latest now". Fail closed if no observation.
 *
 * Selection order (LOCKED):
 * 1. Prefer exact asOf match among rows with as_of = requested (lowest source_priority, then id)
 * 2. Else among as_of <= requested: lowest source_priority, then latest as_of, then id
 * 3. if is_stale=1 and allowStale=false → fail
 * 4. rate must be positive decimal string
 *
 * crossRate.js builds multi-hop paths using this resolver for each hop.
 */
import { toDecimal } from "../../money/canonicalDecimal.js";

export function resolveStoredRate(db, { fromCurrency, toCurrency, asOf, allowStale = false }) {
  if (!fromCurrency || !toCurrency || !asOf) {
    throw new Error("FX_RESOLVE_ARGS");
  }
  if (fromCurrency === toCurrency) {
    return {
      rate: "1",
      asOf,
      source: "identity",
      sourcePriority: 0,
      conversionPath: null,
      isStale: false,
    };
  }

  // 1) exact asOf
  let row = db
    .prepare(
      `SELECT * FROM cur_exchange_rates
       WHERE from_currency = ? AND to_currency = ? AND as_of = ?
       ORDER BY source_priority ASC, id ASC
       LIMIT 1`,
    )
    .get(fromCurrency, toCurrency, asOf);

  // 2) as_of <= requested
  if (!row) {
    row = db
      .prepare(
        `SELECT * FROM cur_exchange_rates
         WHERE from_currency = ? AND to_currency = ? AND as_of <= ?
         ORDER BY source_priority ASC, as_of DESC, id ASC
         LIMIT 1`,
      )
      .get(fromCurrency, toCurrency, asOf);
  }

  if (!row) {
    throw new Error(`FX_RATE_NOT_FOUND:${fromCurrency}/${toCurrency}@${asOf}`);
  }
  if (row.is_stale === 1 && !allowStale) {
    throw new Error(`FX_RATE_STALE:${fromCurrency}/${toCurrency}@${row.as_of}`);
  }

  const rate = toDecimal(row.rate);
  if (!rate.gt(0)) {
    throw new Error(`FX_RATE_NONPOSITIVE:${fromCurrency}/${toCurrency}`);
  }

  return {
    rate: rate.toFixed(),
    asOf: row.as_of,
    source: row.source,
    sourcePriority: row.source_priority,
    conversionPath: row.conversion_path,
    isStale: row.is_stale === 1,
    id: row.id,
  };
}
