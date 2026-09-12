import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyMetal, sellMetal } from "../public-api/index.js";
import { closeAllDbs, openDb } from "../../../core/persistence/port.js";

test("metals buy then sell", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-ms-"));
  await buyMetal(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "gold-s",
        symbol: "GOLD",
        platformId: "plat-s",
        grossWeight: "10000",
        purityRatio: "1",
        metalPricePerMg: "1",
        premiumAmount: "0",
        feeAmount: "0",
        currency: "IRR",
        businessDate: "2026-01-01",
      },
    },
    { dataDir },
  );
  const sell = await sellMetal(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "gold-s",
        platformId: "plat-s",
        quantityMg: "5000",
        proceedsTotal: "6000",
        currency: "IRR",
        businessDate: "2026-01-02",
      },
    },
    { dataDir },
  );
  assert.ok(sell.domainResult.realizedPnl);
  const db = openDb(dataDir);
  const h = db.prepare(`SELECT quantity_mg FROM inv_metals_holdings WHERE instrument_id=?`).get("gold-s");
  assert.equal(h.quantity_mg, "5000");
  closeAllDbs();
});
