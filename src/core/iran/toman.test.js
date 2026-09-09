import test from "node:test";
import assert from "node:assert/strict";
import { tomanToIrr, irrToToman, normalizeIranMoneyInput } from "./toman.js";

test("1 Toman = 10 IRR", () => {
  assert.equal(tomanToIrr("1"), "10");
  assert.equal(tomanToIrr("100"), "1000");
  assert.equal(irrToToman("1000"), "100");
});

test("normalize TOMAN before journal", () => {
  const n = normalizeIranMoneyInput({ amount: "50", unit: "TOMAN" });
  assert.equal(n.currency, "IRR");
  assert.equal(n.amount, "500");
  assert.equal(n.rawDisplayAmount, "50");
});

test("rejects number-like via toDecimal path", () => {
  assert.throws(() => tomanToIrr(10));
});
