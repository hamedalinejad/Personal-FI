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
    /MISSING_RATE|FX_OBSERVATION_AFTER_CUTOFF|FX_HISTORICAL_ASOF_REQUIRED/,
  );
});

test("identity path same currency", () => {
  const r = convertAmount({ amount: "10", from: "IRR", to: "IRR", rates: {} });
  assert.equal(r.amount, "10");
  assert.deepEqual(r.path, ["IRR"]);
});

test("inverse rate via reciprocal edge", () => {
  const r = convertAmount({
    amount: "90",
    from: "EUR",
    to: "USD",
    rates: { "USD/EUR": "0.9" },
  });
  assert.equal(r.conversionPath[0].inverted, true);
  // reciprocal of 0.9 is repeating; must be near 100, never 0 / missing
  assert.ok(r.amount.startsWith("99.999") || r.amount.startsWith("100"));
});

test("two-hop pins conversionPath hops with rates", () => {
  const r = convertAmount({
    amount: "1",
    from: "A",
    to: "C",
    rates: {
      "A/B": { rate: "2", asOf: "2026-01-01", source: "test" },
      "B/C": { rate: "3", asOf: "2026-01-01", source: "test" },
    },
  });
  assert.equal(r.amount, "6");
  assert.equal(r.conversionPath.length, 2);
  assert.equal(r.conversionPath[0].rate, "2");
  assert.equal(r.conversionPath[1].rate, "3");
  assert.ok(r.contextHash);
});

test("historical asOf rejects observation after asOf", () => {
  assert.throws(
    () =>
      convertAmount({
        amount: "1",
        from: "USD",
        to: "EUR",
        asOf: "2025-01-01",
        rates: { "USD/EUR": { rate: "0.9", asOf: "2026-01-01", source: "future" } },
      }),
    /MISSING_RATE|FX_OBSERVATION_AFTER_CUTOFF|FX_HISTORICAL_ASOF_REQUIRED/,
  );
});

test("deterministic contextHash stable", () => {
  const args = {
    amount: "1",
    from: "USD",
    to: "EUR",
    rates: { "USD/EUR": "0.85" },
  };
  const a = convertAmount(args);
  const b = convertAmount(args);
  assert.equal(a.contextHash, b.contextHash);
});

test("stale rate rejected by default", () => {
  assert.throws(
    () =>
      convertAmount({
        amount: "10",
        from: "USD",
        to: "IRR",
        rates: { "USD/IRR": { rate: "42000", asOf: "2026-01-01", source: "manual", isStale: true } },
      }),
    /FX_RATE_STALE/,
  );
});

test("stale rate allowed when allowStale=true", () => {
  const r = convertAmount({
    amount: "10",
    from: "USD",
    to: "IRR",
    rates: { "USD/IRR": { rate: "42000", asOf: "2026-01-01", source: "manual", isStale: true } },
    allowStale: true,
  });
  assert.equal(r.amount, "420000");
  assert.equal(r.conversionPath[0].isStale, true);
  assert.equal(r.conversionPath[0].source, "manual");
});

test("no path fails closed", () => {
  assert.throws(
    () => convertAmount({ amount: "1", from: "EUR", to: "JPY", rates: { "USD/IRR": "42000" } }),
    /MISSING_RATE|FX_OBSERVATION_AFTER_CUTOFF|FX_HISTORICAL_ASOF_REQUIRED/,
  );
});

test("historical asOf rejects observation after asOf", () => {
  assert.throws(
    () =>
      convertAmount({
        amount: "1",
        from: "USD",
        to: "IRR",
        asOf: "2025-01-01",
        rates: { "USD/IRR": { rate: "42000", asOf: "2026-01-01", source: "x" } },
      }),
    /MISSING_RATE|FX_OBSERVATION_AFTER_CUTOFF|FX_HISTORICAL_ASOF_REQUIRED/,
  );
});
