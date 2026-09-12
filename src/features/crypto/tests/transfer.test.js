import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyCrypto, transferCrypto } from "../public-api/index.js";
import { closeAllDbs, openDb } from "../../../core/persistence/port.js";

test("crypto transfer moves qty with cost, no realized pnl", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-tr-"));
  await buyCrypto(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "btc-t",
        symbol: "BTC",
        exchangeId: "ex-a",
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
  await transferCrypto(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "btc-t",
        fromExchangeId: "ex-a",
        toExchangeId: "ex-b",
        grossQuantity: "1",
        feeQuantity: "0",
        netQuantity: "1",
        businessDate: "2026-01-02",
        currency: "USDT",
      },
    },
    { dataDir },
  );
  const db = openDb(dataDir);
  const a = db.prepare(`SELECT quantity FROM inv_crypto_holdings WHERE exchange_id='ex-a'`).get();
  const b = db.prepare(`SELECT quantity, total_invested FROM inv_crypto_holdings WHERE exchange_id='ex-b'`).get();
  assert.equal(a.quantity, "1");
  assert.equal(b.quantity, "1");
  assert.equal(b.total_invested, "100");
  closeAllDbs();
});
