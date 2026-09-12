import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyMetal, capabilities } from "../public-api/index.js";
import { openDb, closeAllDbs } from "../../../core/persistence/worker.js";

test("P0-MOD-001 metals-only standalone buy", async () => {
  assert.ok(capabilities());
  const dataDir = mkdtempSync(join(tmpdir(), "pf-msa-"));
  const r = await buyMetal(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "gold-sa",
        symbol: "GOLD",
        quantityMg: "1000",
        purityRatio: "1",
        metalPricePerMg: "10",
        premium: "0",
        fee: "0",
        currency: "IRR",
        businessDate: "2026-01-01",
        platformId: "plat-sa",
      },
    },
    { dataDir },
  );
  assert.ok(r.operationId);
  const db = openDb(dataDir);
  assert.ok(db.prepare(`SELECT * FROM inv_metals_holdings WHERE instrument_id = ?`).get("gold-sa"));
  closeAllDbs();
});
