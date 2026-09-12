import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyCrypto } from "../../../features/crypto/public-api/index.js";
import { closeAllDbs, openDb } from "../../persistence/port.js";

test("Recovery: same operationId + same command is idempotent replay", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-rec-"));
  const opId = randomUUID();
  const payload = {
    instrumentId: "btc-rec",
    symbol: "BTC",
    exchangeId: "ex-rec",
    grossQuantity: "1.0",
    feeQuantity: "0",
    netQuantity: "1.0",
    feeRole: "fee_from_received",
    costTotal: "1000",
    costCurrency: "USDT",
    currency: "USDT",
    price: "1000",
    priceAsOf: "2026-01-01",
    businessDate: "2026-01-01",
  };
  const r1 = await buyCrypto({ operationId: opId, payload }, { dataDir });
  const r2 = await buyCrypto({ operationId: opId, payload }, { dataDir });
  assert.equal(r1.idempotentReplay, false);
  assert.equal(r2.idempotentReplay, true);
  const db = openDb(dataDir);
  const txs = db.prepare(`SELECT * FROM inv_crypto_transactions WHERE operation_id=?`).all(opId);
  assert.equal(txs.length, 1);
  closeAllDbs();
});

test("Recovery: same operationId + different command conflicts", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-rec2-"));
  const opId = randomUUID();
  const base = {
    instrumentId: "btc-c",
    symbol: "BTC",
    exchangeId: "ex-c",
    grossQuantity: "1.0",
    feeQuantity: "0",
    netQuantity: "1.0",
    feeRole: "fee_from_received",
    costTotal: "1000",
    costCurrency: "USDT",
    currency: "USDT",
    price: "1000",
    priceAsOf: "2026-01-01",
    businessDate: "2026-01-01",
  };
  await buyCrypto({ operationId: opId, payload: base }, { dataDir });
  await assert.rejects(
    () => buyCrypto({ operationId: opId, payload: { ...base, costTotal: "2000" } }, { dataDir }),
    (e) => /OP_IDEMPOTENCY_CONFLICT|IDEMPOTENCY/.test(String(e && e.message)),
  );
  closeAllDbs();
});
