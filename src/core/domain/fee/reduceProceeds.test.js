import test from "node:test";
import assert from "node:assert/strict";
import { normalizeFeeTreatment, CANONICAL_FEE_TREATMENTS } from "./feeEngine.js";

test("reduce_proceeds is in single canonical enum", () => {
  assert.ok(CANONICAL_FEE_TREATMENTS.includes("reduce_proceeds"));
  assert.equal(normalizeFeeTreatment("reduce_proceeds"), "reduce_proceeds");
});

test("all locked treatments normalize", () => {
  for (const t of CANONICAL_FEE_TREATMENTS) {
    assert.equal(normalizeFeeTreatment(t), t);
  }
});
