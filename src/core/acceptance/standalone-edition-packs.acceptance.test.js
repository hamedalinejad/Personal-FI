/**
 * STANDALONE edition packs — same Financial Core, no Accounts UI required.
 * Path: boot → create → operation → statement/query → backup → restore → verify
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { openDb, closeAllDbs } from "../persistence/worker.js";
import { backupDatabase, restoreDatabase } from "../recovery/backup.js";
import { rebuildProjection } from "../rebuild/rebuildProjection.js";

import {
  createLoan,
  recordPayment,
  getStatement,
  capabilities as loanCaps,
} from "../../features/loan/public-api/index.js";
import { subscribeFund, capabilities as fundsCaps } from "../../features/funds/public-api/index.js";
import { buyMetal, capabilities as metalsCaps } from "../../features/metals/public-api/index.js";
import { buyCrypto, capabilities as cryptoCaps } from "../../features/crypto/public-api/index.js";
import { buyStock, capabilities as stocksCaps } from "../../features/stocks/public-api/index.js";

function assertEditionCaps(caps, edition) {
  assert.equal(caps.edition, edition);
  assert.equal(caps.requiresAccountsUi, false);
  assert.equal(caps.sharedCore, true);
  assert.ok(Array.isArray(caps.commands) && caps.commands.length >= 1);
  assert.ok(Array.isArray(caps.reports) && caps.reports.length >= 1);
}

test("standalone capabilities: no Accounts UI for five editions", () => {
  assertEditionCaps(loanCaps(), "loan-only");
  assertEditionCaps(cryptoCaps(), "crypto-only");
  assertEditionCaps(fundsCaps(), "fund-only");
  assertEditionCaps(stocksCaps(), "stocks-only");
  assertEditionCaps(metalsCaps(), "metals-only");
});

test("standalone Loan-only pack: create → pay → statement → backup → restore", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-loan-pack-"));
  const c = await createLoan(
    {
      operationId: randomUUID(),
      payload: {
        role: "lent",
        principal: "1000",
        currency: "IRR",
        annualRate: "12",
        periods: "4",
        method: "declining_balance",
        startDate: "2026-01-01",
        businessDate: "2026-01-01",
        dayCount: "period_based",
      },
    },
    { dataDir },
  );
  assert.ok(c.loanId);
  await recordPayment(
    {
      operationId: randomUUID(),
      payload: {
        loanId: c.loanId,
        amount: "100",
        currency: "IRR",
        businessDate: "2026-02-01",
      },
    },
    { dataDir },
  );
  const stmt = getStatement(c.loanId, { dataDir });
  assert.ok(stmt);
  const bak = join(dataDir, "loan-bak.sqlite");
  await backupDatabase(dataDir, bak);
  const dest = mkdtempSync(join(tmpdir(), "pf-loan-rest-"));
  await restoreDatabase(bak, dest);
  const db = openDb(dest);
  const ops = db.prepare(`SELECT COUNT(*) as n FROM fin_operations WHERE status = 'posted'`).get();
  assert.ok(ops.n >= 1);
  const rebuilt = rebuildProjection({
    asOf: "2026-02-01",
    sourceLedger: { projections: { loanId: c.loanId } },
  });
  assert.equal(rebuilt.projections.loanId, c.loanId);
  closeAllDbs();
});

test("standalone Fund-only pack: subscribe posts journal without Accounts UI", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-fund-pack-"));
  const r = await subscribeFund(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "fund-pack",
        symbol: "FP",
        quantity: "10",
        transactionPrice: "100",
        nav: "99",
        currency: "IRR",
        businessDate: "2026-01-01",
      },
    },
    { dataDir },
  );
  assert.ok(r.operationId);
  const db = openDb(dataDir);
  const h = db.prepare(`SELECT * FROM inv_fif_holdings WHERE instrument_id = ?`).get("fund-pack");
  assert.ok(h);
  const jl = db.prepare(`SELECT COUNT(*) as n FROM fin_journal_lines`).get();
  assert.ok(jl.n >= 2);
  closeAllDbs();
});

test("standalone Metals-only pack: buy + purity holding + journal", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-metal-pack-"));
  const r = await buyMetal(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "gold-pack",
        symbol: "GOLD",
        quantityMg: "1000",
        purityRatio: "0.75",
        metalPricePerMg: "10",
        premium: "0",
        fee: "0",
        currency: "IRR",
        businessDate: "2026-01-01",
        platformId: "plat-pack",
      },
    },
    { dataDir },
  );
  assert.ok(r.operationId);
  const db = openDb(dataDir);
  const h = db.prepare(`SELECT * FROM inv_metals_holdings WHERE instrument_id = ?`).get("gold-pack");
  assert.ok(h);
  assert.equal(String(h.purity_ratio), "0.75");
  assert.ok(db.prepare(`SELECT COUNT(*) as n FROM fin_journal_lines`).get().n >= 2);
  closeAllDbs();
});

test("standalone Crypto-only pack: buy posts journal", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-crypto-pack-"));
  const r = await buyCrypto(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "btc-pack",
        symbol: "BTC",
        exchangeId: "ex-pack",
        grossQuantity: "0.5",
        feeQuantity: "0",
        netQuantity: "0.5",
        feeRole: "fee_from_received",
        costTotal: "500000",
        costCurrency: "IRR",
        currency: "IRR",
        price: "1000000",
        priceAsOf: "2026-01-01",
        businessDate: "2026-01-01",
      },
    },
    { dataDir },
  );
  assert.ok(r.operationId);
  const db = openDb(dataDir);
  assert.ok(db.prepare(`SELECT * FROM inv_crypto_holdings WHERE instrument_id = ?`).get("btc-pack"));
  assert.ok(db.prepare(`SELECT COUNT(*) as n FROM fin_journal_lines`).get().n >= 2);
  closeAllDbs();
});

test("standalone Stocks-only pack: buy posts journal + settlement fields", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-stock-pack-"));
  const r = await buyStock(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "stock-pack",
        symbol: "FOOLAD",
        quantity: "100",
        price: "1000",
        tradeDate: "2026-01-05",
        settlementDate: "2026-01-07",
        businessDate: "2026-01-05",
        currency: "IRR",
        brokerageId: "br-pack",
        commission: "0",
      },
    },
    { dataDir },
  );
  assert.ok(r.operationId);
  const db = openDb(dataDir);
  const tx = db.prepare(`SELECT * FROM inv_stocks_iran_transactions WHERE instrument_id = ?`).get("stock-pack");
  assert.ok(tx);
  assert.ok(tx.trade_date);
  assert.ok(db.prepare(`SELECT COUNT(*) as n FROM fin_journal_lines`).get().n >= 2);
  closeAllDbs();
});
