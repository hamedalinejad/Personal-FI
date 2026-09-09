import test from "node:test";
import assert from "node:assert/strict";
import { convertAmount } from "./crossRate.js";

test("direct string rate", () => {
  const r = convertAmount({
    amount: "100",
    from: "USD",
    to: "EUR",
    rates: { "USD/EUR": "0.9" },
  });
  assert.equal(r.amount, "90");
});

test("rejects number rate", () => {
  assert.throws(
    () =>
      convertAmount({
        amount: "100",
        from: "USD",
        to: "EUR",
        rates: { "USD/EUR": 0.9 },
      }),
    /FX_RATE_NOT_STRING/,
  );
});

test("multi-hop fewest hops BTC→IRR via USDT", () => {
  const r = convertAmount({
    amount: "2",
    from: "BTC",
    to: "IRR",
    rates: {
      "BTC/USDT": "50000",
      "USDT/IRR": "600000",
    },
  });
  assert.equal(r.path.length, 3);
  assert.equal(r.amount, "60000000000");
});

test("MISSING_RATE not zero", () => {
  assert.throws(
    () =>
      convertAmount({
        amount: "1",
        from: "AAA",
        to: "BBB",
        rates: {},
      }),
    /MISSING_RATE/,
  );
});
