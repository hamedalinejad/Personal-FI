import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { valueHoldings } from "./investment.js";

describe("valueHoldings BUG-P0-01/02", () => {
  it("IRR cost + IRR price → valid without report currency", () => {
    const r = valueHoldings({
      holdings: [{ instrumentId: "a", quantity: "10", costBasis: "1000", costCurrency: "IRR" }],
      prices: new Map([["a", { price: "120", currency: "IRR", asOf: "2026-01-01" }]]),
    });
    assert.equal(r.state, "ready");
    assert.equal(r.rows[0].marketValue, "1200");
    assert.equal(r.rows[0].unrealizedPnl, "200");
    assert.ok(r.totals);
    assert.equal(r.totals.currency, "IRR");
  });

  it("IRR cost + USD price without report currency → no market value, no uPnL", () => {
    const r = valueHoldings({
      holdings: [{ instrumentId: "a", quantity: "10", costBasis: "1000", costCurrency: "IRR" }],
      prices: new Map([["a", { price: "1", currency: "USD", asOf: "2026-01-01" }]]),
    });
    assert.equal(r.state, "mixed_currency_needs_report_currency");
    assert.equal(r.rows[0].marketValue, null);
    assert.equal(r.rows[0].unrealizedPnl, null);
    assert.equal(r.totals, null);
  });

  it("IRR + USD with report currency IRR and FX → valid", () => {
    const r = valueHoldings({
      holdings: [{ instrumentId: "a", quantity: "2", costBasis: "84000", costCurrency: "IRR" }],
      prices: new Map([["a", { price: "1", currency: "USD", asOf: "2026-01-01" }]]),
      reportCurrency: "IRR",
      fxToReport: new Map([["USD", "42000"]]),
    });
    assert.equal(r.state, "ready");
    assert.equal(r.rows[0].marketValue, "84000");
    assert.equal(r.rows[0].unrealizedPnl, "0");
  });

  it("partial valuation when only one of two holdings priced", () => {
    const r = valueHoldings({
      holdings: [
        { instrumentId: "a", quantity: "1", costBasis: "10", costCurrency: "IRR" },
        { instrumentId: "b", quantity: "1", costBasis: "20", costCurrency: "IRR" },
      ],
      prices: new Map([["a", { price: "15", currency: "IRR", asOf: "2026-01-01" }]]),
    });
    assert.equal(r.state, "partial_valuation");
    assert.equal(r.meta.valuedCount, 1);
    assert.equal(r.totals, null);
  });

  it("unpriced when holdings exist but no prices", () => {
    const r = valueHoldings({
      holdings: [{ instrumentId: "a", quantity: "1", costBasis: "10", costCurrency: "IRR" }],
      prices: new Map(),
    });
    assert.equal(r.state, "unpriced");
  });

  it("missing_fx when report currency needs conversion", () => {
    const r = valueHoldings({
      holdings: [{ instrumentId: "a", quantity: "1", costBasis: "10", costCurrency: "USD" }],
      prices: new Map([["a", { price: "2", currency: "USD", asOf: "2026-01-01" }]]),
      reportCurrency: "IRR",
      fxToReport: new Map(),
    });
    assert.equal(r.state, "missing_fx");
  });

  it("stale price rejected unless allowStale", () => {
    const r = valueHoldings({
      holdings: [{ instrumentId: "a", quantity: "1", costBasis: "10", costCurrency: "IRR" }],
      prices: new Map([["a", { price: "12", currency: "IRR", asOf: "2026-01-01", stale: true }]]),
    });
    assert.equal(r.state, "stale");
  });

  it("future price relative to asOf → error row", () => {
    const r = valueHoldings({
      holdings: [{ instrumentId: "a", quantity: "1", costBasis: "10", costCurrency: "IRR" }],
      prices: new Map([["a", { price: "12", currency: "IRR", asOf: "2026-12-31" }]]),
      asOf: "2026-01-01",
    });
    assert.equal(r.rows[0].valuationState, "error");
    assert.equal(r.rows[0].reason, "FUTURE_PRICE");
  });

  it("empty holdings → ready with zero totals", () => {
    const r = valueHoldings({ holdings: [], prices: new Map() });
    assert.equal(r.state, "ready");
    assert.equal(r.totals.marketValue, "0");
  });
});
