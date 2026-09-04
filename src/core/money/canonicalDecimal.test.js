import test from "node:test";
import assert from "node:assert/strict";
import { canonicalDecimalString } from "./canonicalDecimal.js";

test("rejects non-string", () => {
  assert.throws(() => canonicalDecimalString(1.2));
});
test("rejects NaN token", () => {
  assert.throws(() => canonicalDecimalString("NaN"));
});
test("normalizes -0", () => {
  assert.equal(canonicalDecimalString("-0"), "0");
});
test("accepts plain decimal", () => {
  assert.equal(canonicalDecimalString("12.50"), "12.50");
});
