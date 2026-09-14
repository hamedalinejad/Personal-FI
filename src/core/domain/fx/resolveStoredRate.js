/**
 * Deterministic FX observation resolver (REVIEW-013).
 * Historical path: never "latest now". Fail closed if no observation.
 *
 * Selection order:
 * 1. exact asOf match
 * 2. among candidates with as_of <= requested asOf: lowest source_priority, then latest as_of
 * 3. if is_stale=1 and allowStale=false → fail
 * 4. otherwise return observation
 */
import { toDecimal } from "../../money/canonicalDecimal.js";

export function resolveStoredRate(db, { fromCurrency, toCurrency, asOf, allowStale = false }) {
  if (!fromCurrency || !toCurrency) throw new Error("FX_PAIR_REQUIRED");
  if (fromCurrency === toCurrency) {
    return {
      rate: "1",
      asOf: asOf || null,
      source: "identity",
      isStale: false,
      sourcePriority: 0,
    };
  }
  if (!asOf) throw new Error("FX_ASOF_REQUIRED");

  const rows = db
    .prepare(
      `SELECT id, rate, as_of as asOf, source, source_priority as sourcePriority,
              is_stale as isStale, is_manual as isManual
       FROM cur_exchange_rates
       WHERE from_currency = ? AND to_currency = ? AND as_of <= ?
       ORDER BY source_priority ASC, as_of DESC, id ASC`,
    )
    .all(fromCurrency, toCurrency, asOf);

  if (!rows.length) throw new Error(`FX_RATE_NOT_FOUND:${fromCurrency}/${toCurrency}@${asOf}`);

  const pick = rows[0];
  if (Number(pick.isStale) === 1 && !allowStale) {
    throw new Error(`FX_RATE_STALE:${fromCurrency}/${toCurrency}@${pick.asOf}`);
  }
  toDecimal(String(pick.rate)); // validate decimal string
  return {
    id: pick.id,
    rate: String(pick.rate),
    asOf: pick.asOf,
    source: pick.source,
    isStale: Number(pick.isStale) === 1,
    sourcePriority: pick.sourcePriority,
  };
}
