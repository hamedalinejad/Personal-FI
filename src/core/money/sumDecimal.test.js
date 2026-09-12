import test from "node:test";
import assert from "node:assert/strict";
import { sumDecimalStrings, sumDecimalSides } from "./canonicalDecimal.js";

test("sumDecimalStrings aggregates TEXT decimals", () => {
  assert.equal(sumDecimalStrings(["1.10", "2.20", "0.70"]), "4");
});

test("sumDecimalSides balances", () => {
  const r = sumDecimalSides([
    { side: "debit", amount: "10" },
    { side: "credit", amount: "10" },
  ]);
  assert.equal(r.balanced, true);
});
