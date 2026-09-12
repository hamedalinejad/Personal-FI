import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { subscribeFund, capabilities } from "../public-api/index.js";
import { openDb, closeAllDbs } from "../../../core/persistence/worker.js";

test("P0-MOD-001 fund-only standalone subscribe", async () => {
  assert.ok(capabilities());
  const dataDir = mkdtempSync(join(tmpdir(), "pf-fsa-"));
  const r = await subscribeFund(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "fund-sa",
        symbol: "FSA",
        quantity: "5",
        transactionPrice: "100",
        nav: "99",
        currency: "IRR",
        businessDate: "2026-01-01",
      },
    },
    { dataDir },
  );
  assert.ok(r.operationId);
  const db = openDb(dataDir);
  const h = db.prepare(`SELECT * FROM inv_fif_holdings WHERE instrument_id = ?`).get("fund-sa");
  assert.ok(h);
  closeAllDbs();
});
