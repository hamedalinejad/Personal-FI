import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyCrypto } from "../public-api/index.js";
import { setBookBaseCurrency } from "../../../core/accounting/bookSettings.js";
import { openDb, closeAllDbs } from "../../../core/persistence/port.js";
import { backupDatabase, restoreDatabase } from "../../../core/persistence/browser/sqlJsIndexedDbAdapter.js";

test("crypto recovery: buy → backup → restore → holding survives", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-cr-"));
  setBookBaseCurrency(openDb(dataDir), "USDT");
  await buyCrypto(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "inst-btc-rec",
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
  const bak = backupDatabase(dataDir, "crypto");
  closeAllDbs();
  const dataDir2 = mkdtempSync(join(tmpdir(), "pf-cr2-"));
  await restoreDatabase(dataDir2, bak);
  const db = openDb(dataDir2);
  const h = db.prepare(`SELECT * FROM inv_crypto_holdings WHERE instrument_id = ?`).get("inst-btc-rec");
  assert.ok(h);
  assert.equal(h.quantity, "0.999");
  closeAllDbs();
});
