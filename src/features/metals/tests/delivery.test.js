import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyMetal, deliverMetal } from "../public-api/index.js";
import { closeAllDbs, openDb } from "../../../core/persistence/port.js";

test("metals.delivery moves carrying to physical", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-del-"));
  await buyMetal(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "gold-d",
        symbol: "GOLD",
        platformId: "plat-d",
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
  await deliverMetal(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "gold-d",
        platformId: "plat-d",
        quantityMg: "4000",
        currency: "IRR",
        businessDate: "2026-01-02",
        deliveryFee: "10",
      },
    },
    { dataDir },
  );
  const db = openDb(dataDir);
  const h = db.prepare(`SELECT quantity_mg FROM inv_metals_holdings WHERE instrument_id=?`).get("gold-d");
  assert.equal(h.quantity_mg, "6000");
  closeAllDbs();
});
