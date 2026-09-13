import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyStock } from "../../features/stocks/public-api/index.js";
import { closeAllDbs } from "../persistence/port.js";

test("P0-01 USD trade IRR base fee expense account matches USD line", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-fee-ccy-"));
  const r = await buyStock(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "stk-usd",
        symbol: "STKUSD",
        quantity: "1",
        price: "10",
        commission: "1",
        currency: "USD",
        baseCurrency: "IRR",
        exchangeRateToBase: "50000",
        tradeDate: "2026-01-01",
        businessDate: "2026-01-01",
        settlementDate: "2026-01-03",
        brokerageId: "br-fx",
      },
    },
    { dataDir },
  );
  assert.equal(r.status, "posted");
  const feeLines = (r.journalLines || []).filter((l) => l.lineKind === "fee");
  for (const line of feeLines) {
    assert.equal(line.currency, "USD");
  }
  closeAllDbs();
});
