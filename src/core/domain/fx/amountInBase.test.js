import test from "node:test";
import assert from "node:assert/strict";
import { toDecimal } from "../../money/canonicalDecimal.js";

/** Canonical: amountInBase = amount × exchangeRateToBase (base per 1 txn unit) */
function amountInBase(amount, exchangeRateToBase) {
  return toDecimal(amount).times(toDecimal(exchangeRateToBase)).toFixed();
}

test("FX amountInBase exact Decimal product", () => {
  assert.equal(amountInBase("100", "42000"), "4200000");
  assert.equal(amountInBase("1.5", "2"), "3");
});

test("FX identity rate leaves amount unchanged as string scale", () => {
  assert.equal(amountInBase("10.00", "1"), "10");
});
