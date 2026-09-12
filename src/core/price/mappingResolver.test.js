import test from "node:test";
import assert from "node:assert/strict";
import { assertMappingIntervalsValid, resolveMapping } from "./mappingResolver.js";

test("P0-PRICE-002 overlap rejected", () => {
  assert.throws(
    () =>
      assertMappingIntervalsValid([
        {
          instrument_id: "i1",
          source_id: "s1",
          market: null,
          valid_from: "2020-01-01",
          valid_to: "2025-01-01",
          status: "active",
        },
        {
          instrument_id: "i1",
          source_id: "s1",
          market: null,
          valid_from: "2024-06-01",
          valid_to: null,
          status: "active",
        },
      ]),
    /PRICE_MAPPING_OVERLAP/,
  );
});

test("P0-PRICE-002 resolve single match", () => {
  const rows = [
    {
      instrument_id: "i1",
      source_id: "s1",
      market: null,
      valid_from: "2020-01-01",
      valid_to: "2025-01-01",
      status: "active",
      provider_symbol: "X",
    },
  ];
  const m = resolveMapping(rows, { instrumentId: "i1", sourceId: "s1", asOf: "2024-01-01" });
  assert.equal(m.provider_symbol, "X");
});
