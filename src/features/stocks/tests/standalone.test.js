import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyStock, capabilities } from "../public-api/index.js";
import { openDb, closeAllDbs } from "../../../core/persistence/worker.js";

test("P0-MOD-001 stocks-only standalone buy", async () => {
  assert.ok(capabilities());
  const dataDir = mkdtempSync(join(tmpdir(), "pf-ssa-"));
  const r = await buyStock(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "stk-sa",
        symbol: "STKSA",
        quantity: "10",
        price: "1000",
        tradeDate: "2026-01-01",
        settlementDate: "2026-01-03",
        businessDate: "2026-01-01",
        currency: "IRR",
        brokerageId: "br-sa",
        commission: "0",
      },
    },
    { dataDir },
  );
  assert.ok(r.domainResult?.tradeDate === "2026-01-01" || r.operationId);
  const db = openDb(dataDir);
  assert.ok(db.prepare(`SELECT * FROM inv_stocks_iran_holdings WHERE instrument_id = ?`).get("stk-sa"));
  closeAllDbs();
});
