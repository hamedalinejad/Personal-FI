import test from "node:test";
import assert from "node:assert/strict";
import { convertAmount } from "./crossRate.js";

test("BUG-012 multi hop", () => {
  const r = convertAmount({
    amount: "10",
    from: "EUR",
    to: "IRR",
    rates: { "EUR/USD": "1.1", "USD/IRR": "50000" },
  });
  assert.equal(r.path.length, 3);
  assert.ok(Number(r.amount) > 0);
});
