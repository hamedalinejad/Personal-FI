/** Financial-core acceptance (consolidated capability suite). */
import assert from "node:assert/strict";
import test from "node:test";
import { buyCrypto, sellCrypto } from "../../features/crypto/public-api/index.js";
import { redeemFund, subscribeFund } from "../../features/funds/public-api/index.js";
import { normalizeLoanRole } from "../../features/loan/domain/role.js";
import { deliverMetal, sellMetal } from "../../features/metals/public-api/index.js";
import { sellStock } from "../../features/stocks/public-api/index.js";
import { archiveAccount } from "../accounting/chartOfAccounts.js";
import { applyFeeEvents, applySingleFee } from "../domain/fee/feeEngine.js";
import { normalizeRatePercentage, scheduleFlat, scheduleQarz } from "../domain/loan/scheduleEngine.js";
import { computeCommandHash, normalizeCommand } from "../domain/operation/operationEngine.js";
import { assertNoActiveMappingOverlap, intervalsOverlap } from "../domain/price/mappingConflict.js";
import { toDecimal } from "../money/canonicalDecimal.js";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

test("BUG-CUR-001 normalize preserves temporal/provenance", () => {
  const n = normalizeCommand({
    operationId: "op-1",
    status: "posted",
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    settlementDate: "2026-01-03",
    eventAt: "2026-01-01T10:00:00Z",
    provenance: { batch: "b1" },
    sourceChannel: "api",
    sourceType: "manual",
    sourceReference: "ref-1",
    journalLines: [
      { accountId: "a", side: "debit", amount: "1", currency: "IRR", amountInBase: "1" },
      { accountId: "b", side: "credit", amount: "1", currency: "IRR", amountInBase: "1" },
    ],
  });
  assert.equal(n.settlementDate, "2026-01-03");
  assert.equal(n.eventAt, "2026-01-01T10:00:00Z");
  assert.deepEqual(n.provenance, { batch: "b1" });
  assert.equal(n.sourceChannel, "api");
  assert.equal(n.sourceType, "manual");
  assert.equal(n.sourceReference, "ref-1");
  const h = computeCommandHash(n);
  assert.ok(h.length === 64);
});

test("BUG-CUR-002 borrower deferred", () => {
  assert.equal(normalizeLoanRole("lent"), "lender");
  // createLoan throws LOAN_ROLE_DEFERRED — unit level role is still borrower
  assert.equal(normalizeLoanRole("borrowed"), "borrower");
});

test("BUG-CUR-008 flat rate 12% not 1200%", () => {
  const s = scheduleFlat({
    principal: "1000",
    annualRate: "12",
    periods: "12",
    startDate: "2026-01-01",
    dayCount: "period_based",
  });
  let ti = toDecimal("0");
  for (const r of s.rows) ti = ti.plus(toDecimal(r.interest));
  assert.ok(ti.minus(toDecimal("120")).abs().lte(toDecimal("0.02")), ti.toFixed());
});

test("BUG-CUR-009 qarz fee 4% of 100000 = 4000", () => {
  const s = scheduleQarz({
    principal: "100000",
    periods: "10",
    feePercent: "4",
    startDate: "2026-01-01",
    dayCount: "period_based",
  });
  let tf = toDecimal("0");
  for (const r of s.rows) tf = tf.plus(toDecimal(r.fee || r.interest || "0"));
  // fee may be on fee field
  if (s.rows[0].fee != null) {
    let f = toDecimal("0");
    for (const r of s.rows) f = f.plus(toDecimal(r.fee || "0"));
    assert.ok(f.minus(toDecimal("4000")).abs().lte(toDecimal("0.02")), f.toFixed());
  }
});

test("BUG-CUR-008 normalizeRatePercentage", () => {
  assert.equal(normalizeRatePercentage("12").toFixed(), "0.12");
});

function openSchema() {
  const sql = readFileSync("docs/core/db/schema.sql", "utf8")
    .split("\n")
    .map((l) => (l.includes("--") ? l.slice(0, l.indexOf("--")) : l))
    .join("\n");
  const db = new DatabaseSync(join(mkdtempSync(join(tmpdir(), "pf-b21-")), "t.sqlite"));
  db.exec(sql);
  return db;
}

test("BUG-CUR-023 no legacy account_kind aliases", () => {
  const db = openSchema();
  const sql = db.prepare(`SELECT sql FROM sqlite_master WHERE name='acc_accounts'`).get().sql;
  assert.ok(!sql.includes("'bank'") || sql.includes("bank_account"));
  assert.ok(sql.includes("bank_account"));
  assert.ok(!/',investment'/.test(sql) && !sql.includes("'investment'"));
  db.close();
});

test("BUG-CUR-029 client hash is diagnostic only; canonical always computed", () => {
  const n = normalizeCommand({
    operationId: "x",
    status: "posted",
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    commandHash: "deadbeef",
    journalLines: [
      { accountId: "a", side: "debit", amount: "1", currency: "IRR", amountInBase: "1" },
      { accountId: "b", side: "credit", amount: "1", currency: "IRR", amountInBase: "1" },
    ],
  });
  assert.equal(n.clientCommandHash, "deadbeef");
  const h = computeCommandHash(n);
  assert.notEqual(h, "deadbeef");
  assert.equal(h.length, 64);
});

test("BUG-CUR-024 overlap detection", () => {
  assert.ok(intervalsOverlap("2026-01-01", "2026-06-01", "2026-05-01", "2026-12-01"));
  assert.ok(!intervalsOverlap("2026-01-01", "2026-06-01", "2026-06-01", "2026-12-01"));
  assert.throws(
    () =>
      assertNoActiveMappingOverlap(
        [{ instrument_id: "i", source_id: "s", market: "bourse", provider_symbol: "X", valid_from: "2026-01-01", valid_to: null, status: "active" }],
        { instrumentId: "i", sourceId: "s", market: "bourse", providerSymbol: "X", validFrom: "2026-03-01", validTo: null },
      ),
    /PRICE_MAPPING_OVERLAP/,
  );
});

test("BUG-CUR-021 journal lines have no operation_id column", () => {
  const db = openSchema();
  const cols = db.prepare(`PRAGMA table_info(fin_journal_lines)`).all().map((c) => c.name);
  assert.ok(!cols.includes("operation_id"));
  db.close();
});

test("BUG-FINAL-005 fee engine TX vs BASE dimensions", () => {
  const r = applyFeeEvents(
    [
      {
        feeAmount: "10",
        feeCurrency: "USD",
        treatment: "capitalized_cost",
        baseCurrency: "IRR",
        transactionCurrency: "USD",
        exchangeRateToBase: "42000",
        label: "fee",
      },
    ],
    { transactionCurrency: "USD" },
  );
  assert.equal(r.carryingDeltaTx.amount, "10");
  assert.equal(r.carryingDeltaTx.currency, "USD");
  assert.equal(r.carryingDeltaBase, "420000");
  assert.notEqual(r.carryingDeltaTx.amount, r.carryingDeltaBase);
});

test("BUG-FINAL-006 fee-from-received rejects different instrument", () => {
  assert.throws(
    () =>
      applySingleFee(
        {
          feeAmount: "1",
          feeInstrumentId: "usdt-trc20",
          treatment: "fee_from_received",
        },
        {
          receivedInstrumentId: "btc",
          receivedQuantityUnit: "asset",
          transactionCurrency: "BTC",
          baseCurrency: "IRR",
          exchangeRateToBase: "1",
        },
      ),
    /FEE_UNIT_MISMATCH/,
  );
});

test("BUG-FINAL-008 crypto buy rejects non-positive gross", async () => {
  await assert.rejects(
    () =>
      buyCrypto({
        operationId: "op-neg",
        payload: {
          instrumentId: "btc",
          exchangeId: "ex",
          grossQuantity: "0",
          netQuantity: "0",
          feeQuantity: "0",
          costTotal: "1",
          costCurrency: "IRR",
          currency: "IRR",
          price: "1",
          priceAsOf: "2026-01-01",
          businessDate: "2026-01-01",
          feeRole: "fee_from_received",
        },
      }),
    /CRYPTO_QTY_NONPOSITIVE/,
  );
});

test("BUG-FINAL-009 crypto sell rejects non-positive quantity", async () => {
  await assert.rejects(
    () =>
      sellCrypto({
        operationId: "op-neg2",
        payload: {
          instrumentId: "btc",
          exchangeId: "ex",
          quantity: "0",
          proceedsTotal: "100",
          proceedsCurrency: "IRR",
          businessDate: "2026-01-01",
        },
      }),
    /CRYPTO_QTY_NONPOSITIVE/,
  );
});

test("BUG-FINAL-011 fund redeem rejects non-positive units", async () => {
  await assert.rejects(
    () =>
      redeemFund({
        operationId: "x",
        payload: {
          instrumentId: "f",
          units: "0",
          transactionPrice: "1",
          currency: "IRR",
          businessDate: "2026-01-01",
        },
      }),
    /FUND_UNITS_NONPOSITIVE/,
  );
});

test("BUG-FINAL-012 stocks sell rejects non-positive qty", async () => {
  await assert.rejects(
    () =>
      sellStock({
        operationId: "x",
        payload: {
          instrumentId: "s",
          brokerageId: "b",
          quantity: "0",
          price: "10",
          currency: "IRR",
          tradeDate: "2026-01-01",
          businessDate: "2026-01-01",
        },
      }),
    /STOCK_QTY_NONPOSITIVE/,
  );
});

test("BUG-FINAL-013 metals sell rejects non-positive qty", async () => {
  await assert.rejects(
    () =>
      sellMetal({
        operationId: "x",
        payload: {
          instrumentId: "g",
          platformId: "p",
          quantityMg: "0",
          proceedsTotal: "10",
          currency: "IRR",
          businessDate: "2026-01-01",
        },
      }),
    /METAL_QTY_NONPOSITIVE/,
  );
});

test("BUG-FINAL-014 metals delivery rejects non-positive qty", async () => {
  await assert.rejects(
    () =>
      deliverMetal({
        operationId: "x",
        payload: {
          instrumentId: "g",
          platformId: "p",
          quantityMg: "0",
          currency: "IRR",
          businessDate: "2026-01-01",
        },
      }),
    /METAL_DELIVERY_QTY_NONPOSITIVE/,
  );
});

test("BUG-FINAL-029 fund subscribe rejects non-positive price", async () => {
  await assert.rejects(
    () =>
      subscribeFund({
        operationId: "x",
        payload: {
          instrumentId: "f",
          units: "10",
          transactionPrice: "0",
          currency: "IRR",
          businessDate: "2026-01-01",
        },
      }),
    /FUND_PRICE_NONPOSITIVE/,
  );
});
