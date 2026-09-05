import test from "node:test";
import assert from "node:assert/strict";
import { subscribe, reinvestDistribution } from "./engine.js";

test("BUG-014 nav vs tx", () => {
  const s = subscribe({ quantity: "10", nav: "100", transactionPrice: "101" });
  assert.equal(s.valuationMode, "transaction_price");
});

test("BUG-014 reinvest two legs", () => {
  const r = reinvestDistribution({ cashAmount: "1000", nav: "100" });
  assert.equal(r.legs.length, 2);
});
