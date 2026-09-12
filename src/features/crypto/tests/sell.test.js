import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyCrypto, sellCrypto } from "../public-api/index.js";
import { closeAllDbs, openDb } from "../../../core/persistence/port.js";

test("crypto buy then sell WAC realized pnl", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-cs-"));
  await buyCrypto(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "btc-s",
        symbol: "BTC",
        exchangeId: "ex-s",
        grossQuantity: "2",
        feeQuantity: "0",
        netQuantity: "2",
        feeRole: "fee_from_received",
        costTotal: "200",
        costCurrency: "USDT",
        currency: "USDT",
        price: "100",
        priceAsOf: "2026-01-01",
        businessDate: "2026-01-01",
      },
    },
    { dataDir },
  );
  const sell = await sellCrypto(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "btc-s",
        exchangeId: "ex-s",
        quantity: "1",
        proceedsTotal: "150",
        proceedsCurrency: "USDT",
        currency: "USDT",
        businessDate: "2026-01-02",
      },
    },
    { dataDir },
  );
  assert.equal(sell.domainResult.costReleased, "100");
  assert.equal(sell.domainResult.realizedPnl, "50");
  const db = openDb(dataDir);
  const h = db.prepare(`SELECT quantity, total_invested FROM inv_crypto_holdings WHERE instrument_id=?`).get("btc-s");
  assert.equal(h.quantity, "1");
  assert.equal(h.total_invested, "100");
  closeAllDbs();
});
