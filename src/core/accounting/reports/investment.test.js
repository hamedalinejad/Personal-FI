<<<<<<< HEAD
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

describe("valueHoldings golden PHASE 2.4 extras", () => {
  it("metal-style quantity with same currency values", () => {
    const r = valueHoldings({
      holdings: [
        {
          instrumentId: "gold-18k",
          quantity: "10000",
          costBasis: "50000000",
          costCurrency: "IRR",
          assetClass: "metals",
        },
      ],
      prices: new Map([["gold-18k", { price: "6000", currency: "IRR", asOf: "2026-01-01" }]]),
    });
    assert.equal(r.state, "ready");
    assert.equal(r.rows[0].marketValue, "60000000");
  });

  it("fund: price is transaction/liquidation separate from NAV label — valuation uses supplied price only", () => {
    // NAV must never silently replace transaction price; here we only pass explicit price
    const r = valueHoldings({
      holdings: [
        { instrumentId: "fund-a", quantity: "100", costBasis: "1000000", costCurrency: "IRR" },
      ],
      prices: new Map([
        ["fund-a", { price: "11000", currency: "IRR", asOf: "2026-01-01" }],
      ]),
    });
    assert.equal(r.state, "ready");
    assert.equal(r.rows[0].marketValue, "1100000");
    assert.equal(r.rows[0].unrealizedPnl, "100000");
  });
=======
/**
 * Phase 5 — unified investment valuation acceptance.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb, closeAllDbs } from "../../persistence/worker.js";
import { investmentHoldings } from "./investment.js";
import { toDecimal } from "../../money/canonicalDecimal.js";

function seedAll(db) {
  const now = "2026-06-01T00:00:00.000Z";
  // instruments
  for (const [id, cls, sym] of [
    ["inst-btc", "crypto", "BTC"],
    ["inst-stock", "stock", "FOOLAD"],
    ["inst-fund", "fund", "FUND1"],
    ["inst-gold", "metal", "GOLD"],
  ]) {
    db.prepare(
      `INSERT INTO ref_instruments (id, asset_class, symbol, name, created_at, updated_at, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
    ).run(id, cls, sym, sym, now, now);
  }
  db.prepare(`INSERT INTO inv_crypto_exchanges (id, name, created_at) VALUES ('ex1','TestEx',?)`).run(now);
  db.prepare(
    `INSERT INTO inv_crypto_holdings (id, exchange_id, network_id, instrument_id, quantity, total_invested, cost_currency, created_at, updated_at)
     VALUES ('ch1','ex1',NULL,'inst-btc','2','80000','USD',?,?)`,
  ).run(now, now);

  db.prepare(`INSERT INTO inv_stocks_iran_brokerages (id, name, created_at) VALUES ('br1','Broker',?)`).run(now);
  db.prepare(
    `INSERT INTO inv_stocks_iran_holdings (id, brokerage_id, instrument_id, quantity, total_invested, cost_currency, symbol, isin, market, created_at, updated_at)
     VALUES ('sh1','br1','inst-stock','100','5000000','IRR','FOOLAD','IR123','bourse',?,?)`,
  ).run(now, now);

  db.prepare(
    `INSERT INTO inv_fif_funds (id, instrument_id, name, created_at, updated_at) VALUES ('f1','inst-fund','Fund One',?,?)`,
  ).run(now, now);
  db.prepare(
    `INSERT INTO inv_fif_holdings (id, instrument_id, quantity, total_invested, cost_currency, created_at, updated_at)
     VALUES ('fh1','inst-fund','10','1000000','IRR',?,?)`,
  ).run(now, now);

  db.prepare(`INSERT INTO inv_metals_platforms (id, name, created_at) VALUES ('mp1','GoldShop',?)`).run(now);
  db.prepare(
    `INSERT INTO inv_metals_holdings (id, platform_id, instrument_id, quantity_mg, purity_code, purity_ratio, total_invested, cost_currency, created_at, updated_at)
     VALUES ('mh1','mp1','inst-gold','10000','24k','1','50000000','IRR',?,?)`,
  ).run(now, now);
}

test("cross-asset unified report: crypto FX + stock + fund NAV + metal fine", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-inv-"));
  const db = openDb(dataDir);
  seedAll(db);
  closeAllDbs();

  const report = investmentHoldings(dataDir, {
    valuationContext: {
      reportCurrency: "IRR",
      asOf: "2026-06-15",
      fxRates: { USD: "42000" },
    },
    prices: {
      "inst-btc": {
        price: "50000",
        currency: "USD",
        quoteType: "last",
        marketDate: "2026-06-10",
        sourceId: "manual",
      },
      "inst-stock": {
        price: "60000",
        currency: "IRR",
        quoteType: "last",
        marketDate: "2026-06-10",
      },
      "inst-fund": {
        price: "120000",
        currency: "IRR",
        quoteType: "nav",
        marketDate: "2026-06-10",
      },
      "inst-gold": {
        price: "6000",
        currency: "IRR",
        quoteType: "last",
        marketDate: "2026-06-10",
        unit: "per_mg",
        purityBasis: "fine",
      },
    },
  });

  assert.equal(report.crypto.length, 1);
  assert.equal(report.stocks.length, 1);
  assert.equal(report.funds.length, 1);
  assert.equal(report.metals.length, 1);
  assert.equal(report.totals.valuedCount, 4);

  // crypto: 2 * 50000 USD * 42000 = 4_200_000_000 IRR
  assert.equal(report.crypto[0].marketValue, "4200000000");
  // stock: 100 * 60000 = 6_000_000
  assert.equal(report.stocks[0].marketValue, "6000000");
  // fund: 10 * 120000 = 1_200_000
  assert.equal(report.funds[0].marketValue, "1200000");
  // metal fine 10000mg * 1 * 6000 = 60_000_000
  assert.equal(report.metals[0].marketValue, "60000000");

  const expectedTotal = toDecimal("4200000000")
    .plus("6000000")
    .plus("1200000")
    .plus("60000000");
  assert.equal(report.totals.totalMarketValue, expectedTotal.toFixed());
  closeAllDbs();
});

test("fund invalid quoteType rejected", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-inv-fund-"));
  const db = openDb(dataDir);
  seedAll(db);
  closeAllDbs();
  assert.throws(
    () =>
      investmentHoldings(dataDir, {
        valuationContext: { reportCurrency: "IRR", asOf: "2026-06-15" },
        prices: {
          "inst-fund": {
            price: "1",
            currency: "IRR",
            quoteType: "broker_reported_profit",
            marketDate: "2026-06-10",
          },
        },
      }),
    /FUND_VALUATION_QUOTE_TYPE_INVALID/,
  );
  closeAllDbs();
});

test("metal without purityBasis rejected", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-inv-metal-"));
  const db = openDb(dataDir);
  seedAll(db);
  closeAllDbs();
  assert.throws(
    () =>
      investmentHoldings(dataDir, {
        valuationContext: { reportCurrency: "IRR", asOf: "2026-06-15" },
        prices: {
          "inst-gold": {
            price: "6000",
            currency: "IRR",
            marketDate: "2026-06-10",
            unit: "per_mg",
          },
        },
      }),
    /METAL_VALUATION_PURITY_BASIS_REQUIRED/,
  );
  closeAllDbs();
});

test("price after asOf rejected", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-inv-asof-"));
  const db = openDb(dataDir);
  seedAll(db);
  closeAllDbs();
  assert.throws(
    () =>
      investmentHoldings(dataDir, {
        valuationContext: { reportCurrency: "IRR", asOf: "2026-06-01" },
        prices: {
          "inst-stock": {
            price: "1",
            currency: "IRR",
            marketDate: "2026-06-15",
          },
        },
      }),
    /VALUATION_PRICE_AFTER_ASOF/,
  );
  closeAllDbs();
});

test("missing FX rejects cross-currency valuation", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-inv-fx-"));
  const db = openDb(dataDir);
  seedAll(db);
  closeAllDbs();
  assert.throws(
    () =>
      investmentHoldings(dataDir, {
        valuationContext: { reportCurrency: "IRR", asOf: "2026-06-15", fxRates: {} },
        prices: {
          "inst-btc": {
            price: "50000",
            currency: "USD",
            marketDate: "2026-06-10",
          },
        },
      }),
    /VALUATION_FX_MISSING/,
  );
  closeAllDbs();
});


test("zero market value remains string zero not null", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-inv-zero-"));
  const db = openDb(dataDir);
  seedAll(db);
  closeAllDbs();
  const report = investmentHoldings(dataDir, {
    valuationContext: {
      reportCurrency: "IRR",
      asOf: "2026-06-15",
      fxRates: { USD: "42000" },
    },
    prices: {
      "inst-stock": {
        price: "0",
        currency: "IRR",
        quoteType: "last",
        marketDate: "2026-06-10",
      },
    },
  });
  assert.equal(report.stocks[0].marketValue, "0");
  // cost 5000000, market 0 → unrealized -5000000 (must not be null)
  assert.equal(report.stocks[0].unrealizedPnl, "-5000000");
  closeAllDbs();
});

test("scalar metal price without purityBasis rejected", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-inv-scalar-metal-"));
  const db = openDb(dataDir);
  seedAll(db);
  closeAllDbs();
  assert.throws(
    () =>
      investmentHoldings(dataDir, {
        valuationContext: { reportCurrency: "IRR", asOf: "2026-06-15" },
        prices: { "inst-gold": "6000" },
      }),
    /METAL_VALUATION_PURITY_BASIS_REQUIRED|VALUATION_/,
  );
  closeAllDbs();
});

test("stale price rejected unless allowStale", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-inv-stale-"));
  const db = openDb(dataDir);
  seedAll(db);
  closeAllDbs();
  assert.throws(
    () =>
      investmentHoldings(dataDir, {
        valuationContext: { reportCurrency: "IRR", asOf: "2026-06-15" },
        prices: {
          "inst-stock": {
            price: "1200",
            currency: "IRR",
            marketDate: "2026-06-10",
            isStale: true,
          },
        },
      }),
    /VALUATION_PRICE_STALE/,
  );
  const ok = investmentHoldings(dataDir, {
    valuationContext: {
      reportCurrency: "IRR",
      asOf: "2026-06-15",
      allowStale: true,
      fxRates: { USD: "42000" },
    },
    prices: {
      "inst-stock": {
        price: "1200",
        currency: "IRR",
        marketDate: "2026-06-10",
        isStale: true,
      },
    },
  });
  assert.equal(ok.stocks[0].marketValue, "120000");
  closeAllDbs();
});

test("metal per_g vs per_mg and gross vs fine basis", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-inv-metal-units-"));
  const db = openDb(dataDir);
  seedAll(db);
  db.prepare(`UPDATE inv_metals_holdings SET purity_ratio = '0.9' WHERE id = 'mh1'`).run();
  closeAllDbs();
  const ctx = {
    reportCurrency: "IRR",
    asOf: "2026-06-15",
    fxRates: { USD: "42000" },
  };
  const grossMg = investmentHoldings(dataDir, {
    valuationContext: ctx,
    prices: {
      "inst-gold": {
        price: "6",
        currency: "IRR",
        marketDate: "2026-06-10",
        unit: "per_mg",
        purityBasis: "gross",
      },
    },
  });
  assert.equal(grossMg.metals[0].marketValue, "60000");
  const fineMg = investmentHoldings(dataDir, {
    valuationContext: ctx,
    prices: {
      "inst-gold": {
        price: "6",
        currency: "IRR",
        marketDate: "2026-06-10",
        unit: "per_mg",
        purityBasis: "fine",
      },
    },
  });
  assert.equal(fineMg.metals[0].marketValue, "54000");
  const grossG = investmentHoldings(dataDir, {
    valuationContext: ctx,
    prices: {
      "inst-gold": {
        price: "6000",
        currency: "IRR",
        marketDate: "2026-06-10",
        unit: "per_g",
        purityBasis: "gross",
      },
    },
  });
  assert.equal(grossG.metals[0].marketValue, "60000");
  closeAllDbs();
});

test("report currency converts crypto with explicit FX", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-inv-report-ccy-"));
  const db = openDb(dataDir);
  seedAll(db);
  closeAllDbs();
  const report = investmentHoldings(dataDir, {
    valuationContext: {
      reportCurrency: "IRR",
      asOf: "2026-06-15",
      fxRates: { USD: "42000" },
    },
    prices: {
      "inst-btc": {
        price: "50000",
        currency: "USD",
        marketDate: "2026-06-10",
      },
    },
  });
  assert.equal(report.crypto[0].marketValue, "4200000000");
  assert.equal(report.crypto[0].valuation.reportCurrency, "IRR");
  closeAllDbs();
});

test("mixed holdings report includes all verticals when priced", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-inv-mixed-"));
  const db = openDb(dataDir);
  seedAll(db);
  closeAllDbs();
  const report = investmentHoldings(dataDir, {
    valuationContext: {
      reportCurrency: "IRR",
      asOf: "2026-06-15",
      fxRates: { USD: "42000" },
    },
    prices: {
      "inst-btc": { price: "50000", currency: "USD", marketDate: "2026-06-10" },
      "inst-stock": { price: "1000", currency: "IRR", marketDate: "2026-06-10" },
      "inst-fund": {
        price: "10",
        currency: "IRR",
        quoteType: "nav",
        marketDate: "2026-06-10",
      },
      "inst-gold": {
        price: "5",
        currency: "IRR",
        marketDate: "2026-06-10",
        unit: "per_mg",
        purityBasis: "gross",
      },
    },
  });
  assert.equal(report.holdings.length, 4);
  assert.equal(report.totals.valuedCount, 4);
  assert.ok(toDecimal(report.totals.totalMarketValue).gt(toDecimal("0")));
  closeAllDbs();
>>>>>>> origin/main
});
