import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyCrypto } from "../public-api/index.js";
import { setBookBaseCurrency } from "../../../core/accounting/bookSettings.js";
import { closeAllDbs, openDb } from "../../../core/persistence/port.js";

test("crypto.buy capitalize_inventory adds fee to total_invested", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-cap-"));
  setBookBaseCurrency(openDb(dataDir), "USDT");
  await buyCrypto(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "btc-cap",
        symbol: "BTC",
        exchangeId: "ex-cap",
        grossQuantity: "1",
        feeQuantity: "0",
        netQuantity: "1",
        feeRole: "expense",
        feeTreatment: "capitalize_inventory",
        feeAmount: "10",
        feeCurrency: "USDT",
        costTotal: "100",
        costCurrency: "USDT",
        currency: "USDT",
        price: "100",
        priceAsOf: "2026-01-01",
        businessDate: "2026-01-01",
      },
    },
    { dataDir },
  );
  const db = openDb(dataDir);
  const h = db.prepare("SELECT total_invested FROM inv_crypto_holdings WHERE instrument_id=?").get("btc-cap");
  assert.equal(h.total_invested, "110");
  closeAllDbs();
});
