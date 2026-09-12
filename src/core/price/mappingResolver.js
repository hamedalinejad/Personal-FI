/**
 * P0-PRICE-002 — reject ambiguous/overlapping active mappings.
 * valid_to exclusive; valid_from inclusive.
 */
export function intervalsOverlap(aFrom, aTo, bFrom, bTo) {
  const aEnd = aTo == null ? "9999-12-31" : aTo;
  const bEnd = bTo == null ? "9999-12-31" : bTo;
  return aFrom < bEnd && bFrom < aEnd;
}

export function assertMappingIntervalsValid(rows) {
  for (const r of rows) {
    if (r.valid_to != null && !(r.valid_to > r.valid_from)) {
      throw new Error("PRICE_MAPPING_INVALID_INTERVAL");
    }
  }
  const active = rows.filter((r) => r.status === "active");
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      if (
        a.instrument_id === b.instrument_id &&
        a.source_id === b.source_id &&
        (a.market || null) === (b.market || null) &&
        intervalsOverlap(a.valid_from, a.valid_to, b.valid_from, b.valid_to)
      ) {
        throw new Error("PRICE_MAPPING_OVERLAP");
      }
    }
  }
  return true;
}

export function resolveMapping(rows, { instrumentId, sourceId, market = null, asOf }) {
  assertMappingIntervalsValid(rows);
  const matches = rows.filter(
    (r) =>
      r.status === "active" &&
      r.instrument_id === instrumentId &&
      r.source_id === sourceId &&
      (r.market || null) === (market || null) &&
      r.valid_from <= asOf &&
      (r.valid_to == null || asOf < r.valid_to),
  );
  if (matches.length === 0) return null;
  if (matches.length > 1) throw new Error("PRICE_MAPPING_AMBIGUOUS");
  return matches[0];
}
