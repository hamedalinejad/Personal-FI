import test from "node:test";
import assert from "node:assert/strict";
import { canonicalDecimalString } from "./canonicalDecimal.js";

test("BUG-CODE-001 rejects non-string", () => {
  assert.throws(() => canonicalDecimalString(1.2));
});
test("BUG-CODE-001 rejects NaN", () => {
  assert.throws(() => canonicalDecimalString("NaN"));
});
test("BUG-CODE-001 rejects Infinity", () => {
  assert.throws(() => canonicalDecimalString("Infinity"));
});
test("BUG-CODE-001 rejects -Infinity", () => {
  assert.throws(() => canonicalDecimalString("-Infinity"));
});
test("BUG-CODE-001 rejects empty", () => {
  assert.throws(() => canonicalDecimalString(""));
  assert.throws(() => canonicalDecimalString("   "));
});
test("BUG-CODE-001 rejects malformed", () => {
  assert.throws(() => canonicalDecimalString("12.3.4"));
  assert.throws(() => canonicalDecimalString("abc"));
});
test("BUG-CODE-001 normalizes -0", () => {
  assert.equal(canonicalDecimalString("-0"), "0");
});
test("BUG-CODE-001 accepts plain decimal", () => {
  assert.equal(canonicalDecimalString("12.50"), "12.5");
  assert.equal(canonicalDecimalString("12.5"), "12.5");
});
