import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyStock, settleStock } from "../public-api/index.js";
import { closeAllDbs, openDb } from "../../../core/persistence/port.js";

test("stocks.settle clears payable after buy T+n", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-settle-"));
  const tradeId = randomUUID();
  const buy = await buyStock(
    {
      operationId: tradeId,
      payload: {
        instrumentId: "stk-s",
        symbol: "SH",
        quantity: "10",
        price: "100",
        tradeDate: "2026-01-01",
        businessDate: "2026-01-01",
        settlementDate: "2026-01-03",
        currency: "IRR",
        brokerageId: "br-s",
        commission: "50",
      },
    },
    { dataDir },
  );
  assert.equal(buy.domainResult.settlementStatus, "pending_settlement");

  const settleId = randomUUID();
  const settle = await settleStock(
    {
      operationId: settleId,
      payload: {
        originalTradeOperationId: tradeId,
        businessDate: "2026-01-03",
        settlementDate: "2026-01-03",
        currency: "IRR",
      },
    },
    { dataDir },
  );
  assert.equal(settle.domainResult.settlementStatus, "settled");
  assert.equal(settle.domainResult.amount, "1050"); // 10*100+50

  // double settle rejects
  await assert.rejects(
    () =>
      settleStock(
        {
          operationId: randomUUID(),
          payload: {
            originalTradeOperationId: tradeId,
            businessDate: "2026-01-04",
          },
        },
        { dataDir },
      ),
    (e) => /ALREADY_SETTLED/.test(String(e && e.message)),
  );

  const db = openDb(dataDir);
  const h = db.prepare(`SELECT quantity FROM inv_stocks_iran_holdings WHERE instrument_id=?`).get("stk-s");
  assert.equal(h.quantity, "10"); // position unchanged by settle
  closeAllDbs();
});
