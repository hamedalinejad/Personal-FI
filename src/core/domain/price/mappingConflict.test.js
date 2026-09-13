
import test from "node:test";
import assert from "node:assert/strict";
import {
  intervalsOverlap,
  assertValidInterval,
  assertNoActiveMappingOverlap,
} from "./mappingConflict.js";

test("BUG-CUR-024 adjacent intervals do not overlap", () => {
  assert.equal(intervalsOverlap("2026-01-01", "2026-06-01", "2026-06-01", null), false);
});

test("BUG-CUR-024 open-ended overlap rejected", () => {
  assert.throws(
    () =>
      assertNoActiveMappingOverlap(
        [
          {
            instrument_id: "i1",
            source_id: "s1",
            market: null,
            valid_from: "2026-01-01",
            valid_to: null,
            status: "active",
          },
        ],
        {
          instrumentId: "i1",
          sourceId: "s1",
          market: null,
          validFrom: "2026-03-01",
          validTo: "2026-04-01",
        },
      ),
    /PRICE_MAPPING_OVERLAP/,
  );
});

test("BUG-CUR-024 invalid interval", () => {
  assert.throws(() => assertValidInterval("2026-06-01", "2026-01-01"), /PRICE_MAPPING_INVALID/);
});
