import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyStock, sellStock } from "../public-api/index.js";
import { setBookBaseCurrency } from "../../../core/accounting/bookSettings.js";
import { closeAllDbs, openDb } from "../../../core/persistence/port.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";

test("stocks.sell non-zero fee: receivable = gross - fee, no double reduction", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-ssf-"));
  setBookBaseCurrency(openDb(dataDir), "IRR");
  const buyOp = randomUUID();
  await buyStock(
    {
      operationId: buyOp,
      payload: {
        instrumentId: "stk-1",
        symbol: "FOOLAD",
        brokerageId: "br-1",
        quantity: "10",
        price: "100",
        currency: "IRR",
        tradeDate: "2026-01-01",
        businessDate: "2026-01-01",
        settlementDate: "2026-01-01",
        allowSameDaySettlement: true,
      },
    },
    { dataDir },
  );
  const sellOp = randomUUID();
  await sellStock(
    {
      operationId: sellOp,
      payload: {
        instrumentId: "stk-1",
        brokerageId: "br-1",
        quantity: "10",
        price: "100",
        currency: "IRR",
        tradeDate: "2026-01-10",
        businessDate: "2026-01-10",
        commission: "5",
        tax: "0",
        otherFee: "0",
      },
    },
    { dataDir },
  );
  const db = openDb(dataDir);
  // Sum receivable lines for sell op
  const lines = db
    .prepare(
      `SELECT jl.side, jl.amount, jl.account_id FROM fin_journal_lines jl
       JOIN fin_journal_entries je ON je.id = jl.entry_id
       WHERE je.operation_id = ?`,
    )
    .all(sellOp);
  const recv = lines.filter((l) => String(l.account_id).includes("broker_receivable"));
  let net = toDecimal("0");
  for (const l of recv) {
    const a = toDecimal(l.amount);
    net = l.side === "debit" ? net.plus(a) : net.minus(a);
  }
  // gross 1000 - fee 5 = 995
  assert.equal(net.toFixed(), "995", `expected receivable net 995 got ${net.toFixed()} lines=${JSON.stringify(recv)}`);
  closeAllDbs();
});
