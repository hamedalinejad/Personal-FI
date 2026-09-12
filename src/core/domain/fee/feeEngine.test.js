import test from "node:test";
import assert from "node:assert/strict";
import { applySingleFee, buildFeeEvents, applyFeeEvents } from "./feeEngine.js";

test("BUG-011 capitalized fee increases carryingDeltaBase only", () => {
  const r = applySingleFee(
    { feeAmount: "10", feeCurrency: "IRR", treatment: "capitalized_cost" },
    { baseCurrency: "IRR", transactionCurrency: "IRR", exchangeRateToBase: "1" },
  );
  assert.equal(r.carryingDeltaBase, "10");
  assert.equal(r.journalLines.length, 0);
  assert.equal(r.derivedFeeBases[0].feeAmountBase, "10");
});

test("BUG-011 expense fee posts balanced journal", () => {
  const r = applySingleFee(
    { feeAmount: "5", feeCurrency: "IRR", treatment: "expense" },
    { baseCurrency: "IRR", transactionCurrency: "IRR", exchangeRateToBase: "1" },
  );
  assert.equal(r.carryingDeltaBase, "0");
  assert.equal(r.journalLines.length, 2);
});

test("BUG-011 fee_from_received with matching currencies", () => {
  const r = applySingleFee(
    { feeAmount: "0.01", feeCurrency: "IRR", treatment: "fee_from_received" },
    { baseCurrency: "IRR", transactionCurrency: "IRR", exchangeRateToBase: "1" },
  );
  assert.equal(r.quantityDelta, "-0.01");
  assert.equal(r.carryingDeltaBase, "0");
});
