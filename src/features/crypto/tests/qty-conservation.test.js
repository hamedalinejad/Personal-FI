import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyCrypto } from "../public-api/index.js";
import { setBookBaseCurrency } from "../../../core/accounting/bookSettings.js";
import { closeAllDbs, openDb } from "../../../core/persistence/port.js";

test("crypto.buy reduce_received_quantity enforces gross-fee=net", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-qc-"));
  setBookBaseCurrency(openDb(dataDir), "USDT");
  await assert.rejects(
    () =>
      buyCrypto(
        {
          operationId: randomUUID(),
          payload: {
            instrumentId: "btc-qc",
            symbol: "BTC",
            exchangeId: "ex",
            grossQuantity: "1",
            feeQuantity: "0.1",
            netQuantity: "0.95",
            feeTreatment: "reduce_received_quantity",
            feeRole: "reduce_received_quantity",
            costTotal: "100",
            costCurrency: "USDT",
            currency: "USDT",
            price: "100",
            priceAsOf: "2026-01-01",
            businessDate: "2026-01-01",
          },
        },
        { dataDir },
      ),
    /INV_QTY_CONSERVATION/,
  );
  closeAllDbs();
});
