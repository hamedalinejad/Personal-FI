import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyCrypto } from "../public-api/index.js";
import { setBookBaseCurrency } from "../../../core/accounting/bookSettings.js";
import { closeAllDbs, openDb } from "../../../core/persistence/port.js";

test("crypto multi-currency: USDT cost vs IRR book base with explicit FX", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-mc-"));
  setBookBaseCurrency(openDb(dataDir), "IRR");
  await buyCrypto(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "btc-mc",
        symbol: "BTC",
        exchangeId: "ex-mc",
        grossQuantity: "1",
        feeQuantity: "0",
        netQuantity: "1",
        feeRole: "fee_from_received",
        costTotal: "100",
        costCurrency: "USDT",
        currency: "USDT",
        exchangeRateToBase: "60000",
        price: "100",
        priceAsOf: "2026-01-01",
        businessDate: "2026-01-01",
      },
    },
    { dataDir },
  );
  const db = openDb(dataDir);
  const acc = db.prepare(`SELECT currency FROM fin_accounts WHERE id = ?`).get("crypto_inventory:USDT");
  assert.ok(acc);
  assert.equal(acc.currency, "USDT");
  const h = db.prepare(`SELECT total_invested, cost_currency FROM inv_crypto_holdings WHERE instrument_id=?`).get("btc-mc");
  assert.equal(h.cost_currency, "USDT");
  assert.equal(h.total_invested, "100");
  const tx = db.prepare(`SELECT price, price_as_of, amount, currency, fee_amount, fee_quantity FROM inv_crypto_transactions WHERE instrument_id=?`).get("btc-mc");
  assert.equal(tx.price, "100");
  assert.equal(tx.price_as_of, "2026-01-01");
  assert.equal(tx.amount, "100");
  assert.equal(tx.currency, "USDT");
  closeAllDbs();
});

test("crypto.buy rejects currency != costCurrency in v1", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-mc-rej-"));
  setBookBaseCurrency(openDb(dataDir), "IRR");
  await assert.rejects(
    () =>
      buyCrypto(
        {
          operationId: randomUUID(),
          payload: {
            instrumentId: "btc-rej",
            symbol: "BTC",
            exchangeId: "ex-rej",
            grossQuantity: "1",
            feeQuantity: "0",
            netQuantity: "1",
            feeRole: "fee_from_received",
            costTotal: "100",
            costCurrency: "USDT",
            currency: "IRR",
            exchangeRateToBase: "60000",
            price: "100",
            priceAsOf: "2026-01-01",
            businessDate: "2026-01-01",
          },
        },
        { dataDir },
      ),
    /CRYPTO_CURRENCY_COST_MISMATCH/,
  );
  closeAllDbs();
});
