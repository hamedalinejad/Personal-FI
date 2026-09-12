import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyCrypto } from "../../../features/crypto/public-api/index.js";
import { closeAllDbs } from "../../persistence/port.js";
import { trialBalance, generalLedger } from "./statements.js";

test("R-007 trial balance balances after crypto.buy", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-tb-"));
  await buyCrypto(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "btc-tb",
        symbol: "BTC",
        exchangeId: "ex1",
        grossQuantity: "1.0",
        feeQuantity: "0",
        netQuantity: "1.0",
        feeRole: "fee_from_received",
        costTotal: "1000",
        costCurrency: "USDT",
        currency: "USDT",
        price: "1000",
        priceAsOf: "2026-01-01",
        businessDate: "2026-01-01",
      },
    },
    { dataDir },
  );
  const tb = trialBalance(dataDir, { asOf: "2026-12-31" });
  assert.equal(tb.balanced, true);
  assert.ok(generalLedger(dataDir).length >= 2);
  closeAllDbs();
});

import { balanceSheet, incomeStatement, cashFlow } from "./statements.js";
import { investmentHoldings } from "./investment.js";

test("BS/IS/CF run after crypto.buy", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-bs-"));
  await buyCrypto(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "btc-bs",
        symbol: "BTC",
        exchangeId: "ex-bs",
        grossQuantity: "1.0",
        feeQuantity: "0",
        netQuantity: "1.0",
        feeRole: "fee_from_received",
        costTotal: "500",
        costCurrency: "USDT",
        currency: "USDT",
        price: "500",
        priceAsOf: "2026-01-01",
        businessDate: "2026-01-01",
      },
    },
    { dataDir },
  );
  const bs = balanceSheet(dataDir, { asOf: "2026-12-31" });
  assert.ok(bs.assets.length >= 1);
  const is = incomeStatement(dataDir, { fromDate: "2026-01-01", toDate: "2026-12-31" });
  assert.ok(is.netIncome != null);
  const cf = cashFlow(dataDir, { fromDate: "2026-01-01", toDate: "2026-12-31" });
  assert.ok(cf.netCashChange != null);
  const inv = investmentHoldings(dataDir);
  assert.equal(inv.crypto.length, 1);
  closeAllDbs();
});
