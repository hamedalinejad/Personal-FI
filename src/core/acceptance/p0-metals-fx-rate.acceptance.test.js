import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyMetal } from "../../features/metals/public-api/index.js";
import { closeAllDbs, openDb } from "../persistence/port.js";

test("P0-02 metals stores real exchange_rate_to_base", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-metal-fx-"));
  await buyMetal(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "au-1",
        platformId: "plat-1",
        quantityMg: "1000",
        purity: "0.999",
        metalPricePerMg: "5",
        currency: "USD",
        baseCurrency: "IRR",
        exchangeRateToBase: "42000",
        businessDate: "2026-01-01",
        feeAmount: "0",
      },
    },
    { dataDir },
  );
  const db = openDb(dataDir);
  const row = db.prepare(`SELECT exchange_rate_to_base FROM inv_metals_transactions`).get();
  assert.equal(row.exchange_rate_to_base, "42000");
  closeAllDbs();
});
