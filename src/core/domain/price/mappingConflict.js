import { toDecimal } from "../../money/canonicalDecimal.js";

/**
 * BUG-CUR-024 — reject overlapping active intervals for same instrument+source+provider_symbol.
 * Intervals are [validFrom, validTo) with null validTo = open-ended.
 */
export function intervalsOverlap(aFrom, aTo, bFrom, bTo) {
  const aEnd = aTo == null || aTo === "" ? "9999-12-31" : aTo;
  const bEnd = bTo == null || bTo === "" ? "9999-12-31" : bTo;
  return aFrom < bEnd && bFrom < aEnd;
}

export function assertNoActiveMappingOverlap(existingRows, candidate) {
  const actives = (existingRows || []).filter((r) => r.status === "active");
  for (const row of actives) {
    if (
      row.instrument_id === candidate.instrumentId &&
      row.source_id === candidate.sourceId &&
      row.provider_symbol === candidate.providerSymbol &&
      intervalsOverlap(row.valid_from, row.valid_to, candidate.validFrom, candidate.validTo)
    ) {
      throw new Error("PRICE_MAPPING_OVERLAP");
    }
  }
  return true;
}
