import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyStock } from "../public-api/index.js";
import { openDb, closeAllDbs } from "../../../core/persistence/port.js";

test("stocks.buy keeps tradeDate ≠ settlementDate", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-st-"));
  const r = await buyStock(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "stk-1",
        symbol: "FOOLAD",
        isin: "IRO1FOLD0001",
        quantity: "100",
        price: "5000",
        tradeDate: "2026-01-01",
        settlementDate: "2026-01-03",
        currency: "IRR",
        brokerageId: "br-1",
        commission: "10000",
        tax: "0",
        otherFee: "0",
      },
    },
    { dataDir },
  );
  assert.equal(r.domainResult.tradeDate, "2026-01-01");
  assert.equal(r.domainResult.settlementDate, "2026-01-03");
  assert.equal(r.domainResult.total, "510000"); // 100*5000+10000
  const db = openDb(dataDir);
  const h = db.prepare(`SELECT * FROM inv_stocks_iran_holdings WHERE instrument_id = ?`).get("stk-1");
  assert.equal(h.quantity, "100");
  closeAllDbs();
});
