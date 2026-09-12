import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyMetal } from "../public-api/index.js";
import { loadOperation, closeAllDbs, openDb } from "../../../core/persistence/port.js";

test("Gate H metals.buy field survival", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-mh-"));
  const opId = randomUUID();
  await buyMetal(
    {
      operationId: opId,
      payload: {
        instrumentId: "gold-h",
        symbol: "GOLD",
        platformId: "plat-h",
        grossWeight: "10000",
        purityRatio: "0.75",
        metalPricePerMg: "1",
        premiumAmount: "100",
        feeAmount: "50",
        feeTreatment: "expense",
        premiumTreatment: "capitalized_cost",
        currency: "IRR",
        businessDate: "2026-01-01",
        note: "metals-gate-h",
      },
    },
    { dataDir },
  );
  const loaded = await loadOperation(opId, { dataDir });
  assert.equal(loaded.payload?.note, "metals-gate-h");
  assert.equal(loaded.domainResult?.quantityMg, "10000");
  const db = openDb(dataDir);
  const tx = db.prepare(`SELECT * FROM inv_metals_transactions WHERE operation_id=?`).get(opId);
  assert.ok(tx);
  closeAllDbs();
});
