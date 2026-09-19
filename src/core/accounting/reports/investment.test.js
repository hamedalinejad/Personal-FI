import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { openDb, closeAllDbs } from "../../persistence/port.js";
import { investmentHoldings } from "./investment.js";

function insertInstrument(db, id, assetClass, symbol) {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO ref_instruments (
      id, asset_class, symbol, name, created_at, updated_at, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, 1)`,
  ).run(id, assetClass, symbol, symbol, now, now);
}

test("investmentHoldings returns four investment verticals from projection tables", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-invest-report-"));
  const db = openDb(dataDir);
  const now = new Date().toISOString();

  const cryptoId = randomUUID();
  const stockId = randomUUID();
  const fundId = randomUUID();
  const metalId = randomUUID();

  insertInstrument(db, cryptoId, "crypto", "BTC");
  insertInstrument(db, stockId, "stock", "FOOLAD");
  insertInstrument(db, fundId, "fund", "FUND1");
  insertInstrument(db, metalId, "metal", "GOLD");

  db.prepare(
    `INSERT INTO inv_crypto_holdings
      (id, exchange_id, network_id, instrument_id, quantity, total_invested, cost_currency, created_at, updated_at)
      VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?)`,
  ).run(randomUUID(), "ex1", cryptoId, "2", "1000", "USDT", now, now);

  db.prepare(
    `INSERT INTO inv_stocks_iran_brokerages (id, name, created_at)
      VALUES (?, ?, ?)`,
  ).run("br1", "Broker", now);
  db.prepare(
    `INSERT INTO inv_stocks_iran_holdings
      (id, brokerage_id, account_id, instrument_id, isin, symbol, name, quantity, total_invested, cost_currency, created_at, updated_at)
      VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(randomUUID(), "br1", stockId, "IR0001", "FOOLAD", "Foolad", "10", "500", "IRR", now, now);

  db.prepare(
    `INSERT INTO inv_fif_holdings
      (id, instrument_id, brokerage_id, quantity, total_invested, total_fees_paid_base, current_nav, cost_currency, created_at, updated_at)
      VALUES (?, ?, NULL, ?, ?, NULL, ?, ?, ?, ?)`,
  ).run(randomUUID(), fundId, "20", "600", "35", "IRR", now, now);

  db.prepare(
    `INSERT INTO inv_metals_holdings
      (id, platform_id, instrument_id, quantity_mg, purity_code, purity_ratio, total_invested, cost_currency, created_at, updated_at)
      VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(randomUUID(), metalId, "1000", "18k", "0.75", "300", "IRR", now, now);

  const report = investmentHoldings(dataDir, {
    valuationContext: {
      reportCurrency: "IRR",
      asOf: "2026-09-01",
      fxRates: { USDT: "600000" },
    },
    prices: {
      [cryptoId]: { price: "2000", currency: "USDT", quoteType: "last", marketDate: "2026-09-01", unit: "per_unit", sourceId: "manual" },
      [stockId]: { price: "70", currency: "IRR", quoteType: "last", marketDate: "2026-09-01", unit: "per_unit", sourceId: "manual" },
      [fundId]: { price: "40", currency: "IRR", quoteType: "nav", marketDate: "2026-09-01", unit: "per_unit", sourceId: "manual" },
      [metalId]: { price: "0.5", currency: "IRR", quoteType: "last", marketDate: "2026-09-01", unit: "per_mg", purityBasis: "fine", sourceId: "manual" },
    },
  });

  assert.equal(report.crypto.length, 1);
  assert.equal(report.stocks.length, 1);
  assert.equal(report.funds.length, 1);
  assert.equal(report.metals.length, 1);
  assert.equal(report.crypto[0].marketValue, "2400000000");
  assert.equal(report.stocks[0].marketValue, "700");
  assert.equal(report.funds[0].marketValue, "800");
  // 1000 mg × 0.75 fine × 0.5 IRR/mg = 375 IRR
  assert.equal(report.metals[0].fineWeightMg, "750");
  assert.equal(report.metals[0].marketValue, "375");
  assert.equal(report.totals.valuedCount, 4);
  assert.equal(report.totals.totalMarketValue, "2400002875");
  closeAllDbs();
});

test("fund valuation rejects ambiguous quote types", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-invest-fund-"));
  const db = openDb(dataDir);
  const now = new Date().toISOString();
  const fundId = randomUUID();
  insertInstrument(db, fundId, "fund", "F");
  db.prepare(
    `INSERT INTO inv_fif_holdings
      (id, instrument_id, quantity, total_invested, total_fees_paid_base, current_nav, cost_currency, created_at, updated_at)
      VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
  ).run(randomUUID(), fundId, "1", "100", "110", "IRR", now, now);
  assert.throws(
    () => investmentHoldings(dataDir, {
      valuationContext: { reportCurrency: "IRR", asOf: "2026-09-01" },
      prices: { [fundId]: { price: "110", currency: "IRR", quoteType: "broker_reported_profit", marketDate: "2026-09-01", unit: "per_unit" } },
    }),
    /FUND_VALUATION_QUOTE_TYPE_INVALID/,
  );
  closeAllDbs();
});

test("metal valuation requires explicit purity basis", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-invest-metal-"));
  const db = openDb(dataDir);
  const now = new Date().toISOString();
  const metalId = randomUUID();
  insertInstrument(db, metalId, "metal", "G");
  db.prepare(
    `INSERT INTO inv_metals_holdings
      (id, platform_id, instrument_id, quantity_mg, purity_code, purity_ratio, total_invested, cost_currency, created_at, updated_at)
      VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(randomUUID(), metalId, "1000", "18k", "0.75", "300", "IRR", now, now);
  assert.throws(
    () => investmentHoldings(dataDir, {
      valuationContext: { reportCurrency: "IRR", asOf: "2026-09-01" },
      prices: { [metalId]: { price: "0.5", currency: "IRR", quoteType: "last", marketDate: "2026-09-01", unit: "per_mg" } },
    }),
    /METAL_VALUATION_PURITY_BASIS_REQUIRED/,
  );
  closeAllDbs();
});
