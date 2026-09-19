/**
 * Phase 7 — GL/TB/BS/IS/CF + pack + as-of + investment/loan hooks
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { closeAllDbs } from "../../persistence/worker.js";
import {
  reportPack,
  generalLedger,
  trialBalance,
  balanceSheet,
  incomeStatement,
  cashFlow,
  accountActivity,
} from "./index.js";
import { createAccount, deposit } from "../../../features/accounts/public-api/index.js";
import { createIncome } from "../../../features/income/public-api/index.js";
import { createExpense as expCreate } from "../../../features/expense/public-api/index.js";

function tmp() {
  return mkdtempSync(join(tmpdir(), "pf-p7-"));
}

test("Phase7 GL TB BS IS CF after income+expense", async () => {
  const dataDir = tmp();
  const a = await createAccount(
    {
      operationId: randomUUID(),
      payload: { name: "Cash", currency: "IRR", accountKind: "cash" },
    },
    { dataDir },
  );
  await createIncome(
    {
      operationId: randomUUID(),
      payload: {
        accountId: a.accountId,
        amount: "1000",
        currency: "IRR",
        businessDate: "2026-01-10",
      },
    },
    { dataDir },
  );
  await expCreate(
    {
      operationId: randomUUID(),
      payload: {
        accountId: a.accountId,
        amount: "300",
        currency: "IRR",
        businessDate: "2026-01-15",
      },
    },
    { dataDir },
  );

  const gl = generalLedger(dataDir, { fromDate: "2026-01-01", toDate: "2026-01-31" });
  assert.ok(gl.length >= 4);

  const tb = trialBalance(dataDir, { asOf: "2026-01-31" });
  assert.equal(tb.balanced, true);

  const bs = balanceSheet(dataDir, { asOf: "2026-01-31" });
  assert.ok(bs.totalAssets != null || bs.assets);

  const is = incomeStatement(dataDir, { fromDate: "2026-01-01", toDate: "2026-01-31" });
  assert.equal(is.income, "1000");
  assert.equal(is.expense, "300");
  assert.equal(is.netIncome, "700");

  const cf = cashFlow(dataDir, { fromDate: "2026-01-01", toDate: "2026-01-31" });
  assert.ok(cf.netCashChange != null);

  const pack = reportPack(dataDir, {
    asOf: "2026-01-31",
    fromDate: "2026-01-01",
    toDate: "2026-01-31",
  });
  assert.equal(pack.deferred.TWR, "DEFERRED");
  assert.equal(pack.incomeStatement.netIncome, "700");
  assert.ok(pack.trialBalance.balanced);

  closeAllDbs();
});

test("Phase7 as-of excludes later activity from GL window", async () => {
  const dataDir = tmp();
  const a = await createAccount(
    {
      operationId: randomUUID(),
      payload: { name: "Cash", currency: "IRR", accountKind: "cash" },
    },
    { dataDir },
  );
  await createIncome(
    {
      operationId: randomUUID(),
      payload: {
        accountId: a.accountId,
        amount: "100",
        currency: "IRR",
        businessDate: "2026-01-05",
      },
    },
    { dataDir },
  );
  await createIncome(
    {
      operationId: randomUUID(),
      payload: {
        accountId: a.accountId,
        amount: "900",
        currency: "IRR",
        businessDate: "2026-02-01",
      },
    },
    { dataDir },
  );
  const isJan = incomeStatement(dataDir, { fromDate: "2026-01-01", toDate: "2026-01-31" });
  assert.equal(isJan.income, "100");
  closeAllDbs();
});
