import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyCrypto } from "../../../features/crypto/public-api/index.js";
import { closeAllDbs } from "../../persistence/port.js";
import { trialBalance, generalLedger } from "./statements.js";

test("R-007 trial balance balances after crypto.buy", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-tb-"));
  await buyCrypto(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "btc-tb",
        symbol: "BTC",
        exchangeId: "ex1",
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
      },
    },
    { dataDir },
  );
  const tb = trialBalance(dataDir, { asOf: "2026-12-31" });
  assert.equal(tb.balanced, true);
  assert.ok(generalLedger(dataDir).length >= 2);
  closeAllDbs();
});
