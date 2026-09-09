import test from "node:test";
import assert from "node:assert/strict";
import { createValuationContext } from "./valuationContext.js";

test("requires valuationAsOf and baseCurrency", () => {
  assert.throws(() => createValuationContext({ baseCurrency: "IRR" }));
  assert.throws(() => createValuationContext({ valuationAsOf: "2026-01-01" }));
});

test("stable contextHash", () => {
  const a = createValuationContext({ valuationAsOf: "2026-01-01", baseCurrency: "IRR" });
  const b = createValuationContext({ valuationAsOf: "2026-01-01", baseCurrency: "IRR" });
  assert.equal(a.contextHash, b.contextHash);
});
