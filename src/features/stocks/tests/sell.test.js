import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyStock, sellStock } from "../public-api/index.js";
import { closeAllDbs, openDb } from "../../../core/persistence/port.js";

test("stocks buy then sell reduces quantity WAC", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-ss-"));
  await buyStock(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "stk-sell",
        symbol: "X",
        quantity: "10",
        price: "100",
        tradeDate: "2026-01-01",
        businessDate: "2026-01-01",
        settlementDate: "2026-01-03",
        currency: "IRR",
        brokerageId: "br-x",
        commission: "0",
        allowSameDaySettlement: false,
      },
    },
    { dataDir },
  );
  const sell = await sellStock(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "stk-sell",
        brokerageId: "br-x",
        quantity: "4",
        price: "120",
        tradeDate: "2026-01-05",
        businessDate: "2026-01-05",
        settlementDate: "2026-01-07",
        currency: "IRR",
        commission: "0",
      },
    },
    { dataDir },
  );
  assert.equal(sell.domainResult.costReleased, "400");
  assert.equal(sell.domainResult.realizedPnl, "80");
  const db = openDb(dataDir);
  const h = db.prepare(`SELECT quantity FROM inv_stocks_iran_holdings WHERE instrument_id=?`).get("stk-sell");
  assert.equal(h.quantity, "6");
  closeAllDbs();
});
