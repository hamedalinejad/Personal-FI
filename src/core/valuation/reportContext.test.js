import test from "node:test";
import assert from "node:assert/strict";
import { buildValuationContext } from "./reportContext.js";

test("P1-PRICE-006 requires asOf", () => {
  assert.throws(() => buildValuationContext({}), /VALUATION_ASOF_REQUIRED/);
  const c = buildValuationContext({ asOf: "2026-01-01", staleStatus: "stale" });
  assert.equal(c.priceAsOf, "2026-01-01");
  assert.equal(c.staleStatus, "stale");
});
