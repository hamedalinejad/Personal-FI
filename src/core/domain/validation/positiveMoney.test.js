import test from "node:test";
import assert from "node:assert/strict";
import { assertPositive, assertNonNegative } from "./positiveMoney.js";

test("assertPositive rejects zero", () => {
  assert.throws(() => assertPositive("0"), /NONPOSITIVE/);
});
test("assertNonNegative rejects negative", () => {
  assert.throws(() => assertNonNegative("-1"), /NEGATIVE/);
});
test("assertPositive accepts 1", () => {
  assert.equal(assertPositive("1").toFixed(), "1");
});
