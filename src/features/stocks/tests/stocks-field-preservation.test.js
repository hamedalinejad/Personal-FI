import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyStock } from "../public-api/index.js";
import { loadOperation, closeAllDbs, openDb } from "../../../core/persistence/port.js";

test("Gate H stocks.buy field survival", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-sh-"));
  const opId = randomUUID();
  await buyStock(
    {
      operationId: opId,
      payload: {
        instrumentId: "stk-h",
        symbol: "SH",
        brokerageId: "br-1",
        quantity: "100",
        price: "10",
        currency: "IRR",
        tradeDate: "2026-01-01",
        businessDate: "2026-01-01",
        settlementDate: "2026-01-03",
        commission: "5",
        commissionTreatment: "expense",
        note: "stocks-gate-h",
      },
    },
    { dataDir },
  );
  const loaded = await loadOperation(opId, { dataDir });
  assert.equal(loaded.payload?.note, "stocks-gate-h");
  assert.equal(loaded.domainResult?.tradeDate, "2026-01-01");
  assert.equal(loaded.domainResult?.settlementDate, "2026-01-03");
  const db = openDb(dataDir);
  const tx = db.prepare(`SELECT * FROM inv_stocks_iran_transactions WHERE operation_id=?`).get(opId);
  assert.ok(tx);
  closeAllDbs();
});
