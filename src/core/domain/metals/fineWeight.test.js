import test from "node:test";
import assert from "node:assert/strict";
import { computeFineWeight, metalsCostComponents } from "./fineWeight.js";

test("fine weight formula", () => {
  assert.equal(computeFineWeight({ grossWeight: "10", purityRatio: "0.9" }), "9");
});

test("premium separate from metal", () => {
  const c = metalsCostComponents({
    fineWeight: "9",
    metalPrice: "100",
    premium: "50",
    fee: "10",
  });
  assert.equal(c.metalCost, "900");
  assert.equal(c.premium, "50");
  assert.equal(c.totalCost, "960");
});
