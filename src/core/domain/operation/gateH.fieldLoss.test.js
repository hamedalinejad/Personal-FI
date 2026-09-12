import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyCrypto } from "../../../features/crypto/public-api/index.js";
import { loadOperation, closeAllDbs, openDb } from "../../persistence/port.js";

test("Gate H: crypto.buy payload fields survive persist→load", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-h-"));
  const opId = randomUUID();
  const payload = {
    instrumentId: "eth-h",
    symbol: "ETH",
    exchangeId: "binance",
    networkId: "ERC20",
    grossQuantity: "2.0",
    feeQuantity: "0.01",
    netQuantity: "1.99",
    feeRole: "fee_from_received",
    costTotal: "5000",
    costCurrency: "USDT",
    currency: "USDT",
    price: "2500",
    priceAsOf: "2026-02-01",
    businessDate: "2026-02-01",
    note: "gate-h-marker",
  };
  await buyCrypto({ operationId: opId, payload }, { dataDir });
  const loaded = await loadOperation(opId, { dataDir });
  assert.equal(loaded.payload?.note, "gate-h-marker");
  assert.equal(loaded.payload?.networkId, "ERC20");
  assert.equal(loaded.payload?.instrumentId, "eth-h");
  const db = openDb(dataDir);
  const tx = db.prepare(`SELECT * FROM inv_crypto_transactions WHERE operation_id=?`).get(opId);
  assert.ok(tx);
  closeAllDbs();
});
