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

test("P0-03 settlement_policy_version and date columns persisted on buy", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-stk-pol-"));
  const opId = randomUUID();
  await buyStock(
    {
      operationId: opId,
      payload: {
        instrumentId: "stk-pol",
        symbol: "POL",
        brokerageId: "br-1",
        quantity: "10",
        price: "1000",
        currency: "IRR",
        tradeDate: "2026-03-01",
        businessDate: "2026-03-01",
        settlementDate: "2026-03-03",
        commission: "1",
        commissionTreatment: "expense",
      },
    },
    { dataDir },
  );
  const db = openDb(dataDir);
  const row = db
    .prepare(
      `SELECT settlement_policy_version, trade_date, settlement_date, cash_date, market_date, price_as_of, fx_as_of
       FROM inv_stocks_iran_transactions WHERE operation_id = ?`,
    )
    .get(opId);
  assert.ok(row, "tx row exists");
  assert.ok(row.settlement_policy_version, "settlement_policy_version must be set");
  assert.equal(row.trade_date, "2026-03-01");
  assert.equal(row.settlement_date, "2026-03-03");
  closeAllDbs();
});
