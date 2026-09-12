import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyCrypto } from "../public-api/index.js";
import { closeAllDbs, openDb } from "../../../core/persistence/port.js";

test("crypto multi-currency: inventory account currency matches costCurrency", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-mc-"));
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
        currency: "IRR",
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
  closeAllDbs();
});
