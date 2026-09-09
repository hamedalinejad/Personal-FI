import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyCrypto, capabilities } from "../public-api/index.js";
import { openDb, closeAllDbs } from "../../../core/persistence/worker.js";

test("crypto.buy fee_from_received posts journal + holding", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-crypto-"));
  const r = await buyCrypto(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "inst-btc",
        symbol: "BTC",
        exchangeId: "ex-binance",
        grossQuantity: "1.0",
        feeQuantity: "0.001",
        netQuantity: "0.999",
        feeRole: "fee_from_received",
        costTotal: "50000",
        costCurrency: "USDT",
        currency: "USDT",
        price: "50000",
        priceAsOf: "2026-01-01",
        businessDate: "2026-01-01",
      },
    },
    { dataDir },
  );
  assert.equal(r.idempotentReplay, false);
  const db = openDb(dataDir);
  const h = db.prepare(`SELECT * FROM inv_crypto_holdings WHERE instrument_id = ?`).get("inst-btc");
  assert.equal(h.quantity, "0.999");
  assert.equal(h.total_invested, "50000");
  const txs = db.prepare(`SELECT * FROM inv_crypto_transactions WHERE operation_id = ?`).all(r.operationId);
  assert.equal(txs.length, 1);
  closeAllDbs();
});

test("crypto capabilities partial", () => {
  assert.equal(capabilities().status, "PARTIAL");
  assert.ok(capabilities().implements.includes("crypto.buy"));
});
