import test from "node:test";
import assert from "node:assert/strict";
import { resolveBaseAmountSync } from "./bookSettings.js";

test("same currency forces rate 1", () => {
  const r = resolveBaseAmountSync("100.00", "IRR", "IRR", "90000");
  assert.equal(r.exchangeRateToBase, "1");
  assert.equal(r.amountInBase, "100");
});

test("cross currency multiplies", () => {
  const r = resolveBaseAmountSync("10", "USD", "IRR", "90000");
  assert.equal(r.amountInBase, "900000");
  assert.equal(r.exchangeRateToBase, "90000");
});

test("cross currency requires rate", () => {
  assert.throws(() => resolveBaseAmountSync("10", "USD", "IRR", null));
});

test("resolveBaseAmountSync rejects Number amount", () => {
  assert.throws(() => resolveBaseAmountSync(100, "IRR", "IRR", "1"), /DECIMAL_NOT_STRING/);
});

test("resolveBaseAmountSync rejects Number rate", () => {
  assert.throws(() => resolveBaseAmountSync("10", "USD", "IRR", 90000), /DECIMAL_NOT_STRING/);
});

test("resolveBaseAmountSync rejects nonpositive rate", () => {
  assert.throws(() => resolveBaseAmountSync("10", "USD", "IRR", "0"), /nonpositive|FX|VALIDATION/i);
  assert.throws(() => resolveBaseAmountSync("10", "USD", "IRR", "-1"), /nonpositive|FX|VALIDATION/i);
});
