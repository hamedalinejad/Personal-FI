import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyMetal } from "../public-api/index.js";
import { openDb, closeAllDbs } from "../../../core/persistence/worker.js";

test("metals.buy fineWeight and separate premium", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-mt-"));
  const r = await buyMetal(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "gold-24",
        symbol: "GOLD",
        grossWeight: "10000", // mg
        purityRatio: "0.995",
        metalPrice: "3", // per mg fine
        premium: "50",
        fee: "10",
        currency: "IRR",
        businessDate: "2026-01-01",
        platformId: "plat-1",
      },
    },
    { dataDir },
  );
  // fine = 10000 * 0.995 = 9950; metalCost = 9950*3 = 29850; total = 29850+50+10 = 29910
  assert.equal(r.domainResult.fineWeight, "9950");
  assert.equal(r.domainResult.premium, "50");
  assert.equal(r.domainResult.total, "29910");
  const db = openDb(dataDir);
  const h = db.prepare(`SELECT * FROM inv_metals_holdings WHERE instrument_id = ?`).get("gold-24");
  assert.equal(h.quantity_mg, "10000");
  assert.equal(h.purity_ratio, "0.995");
  closeAllDbs();
});
