/**
 * P0-PRICE-002 — reject overlapping active intervals for same
 * (instrument_id, source_id, market) [and optional provider_symbol].
 * Intervals are [validFrom, validTo) with null validTo = open-ended.
 */
export function intervalsOverlap(aFrom, aTo, bFrom, bTo) {
  const aEnd = aTo == null || aTo === "" ? "9999-12-31" : aTo;
  const bEnd = bTo == null || bTo === "" ? "9999-12-31" : bTo;
  return aFrom < bEnd && bFrom < aEnd;
}

export function assertValidInterval(validFrom, validTo) {
  if (validTo != null && validTo !== "" && !(validTo > validFrom)) {
    throw new Error("PRICE_MAPPING_INVALID_INTERVAL");
  }
  return true;
}

export function assertNoActiveMappingOverlap(existingRows, candidate) {
  assertValidInterval(candidate.validFrom, candidate.validTo);
  const market = candidate.market ?? null;
  const actives = (existingRows || []).filter((r) => r.status === "active");
  for (const row of actives) {
    const sameInstr = row.instrument_id === candidate.instrumentId;
    const sameSource = row.source_id === candidate.sourceId;
    const sameMarket = (row.market ?? null) === market;
    if (!sameInstr || !sameSource || !sameMarket) continue;
    if (
      intervalsOverlap(row.valid_from, row.valid_to, candidate.validFrom, candidate.validTo)
    ) {
      throw new Error("PRICE_MAPPING_OVERLAP");
    }
  }
  return true;
}
