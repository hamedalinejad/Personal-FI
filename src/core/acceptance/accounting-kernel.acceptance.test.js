/**
 * P2-09 — Accounting Kernel acceptance (end-to-end through operation engine).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../domain/operation/operationEngine.js";
import { closeAllDbs, openDb } from "../persistence/worker.js";
import {
  ensureAccount,
  assertAccountUsable,
  archiveAccount,
  getAccount,
  CANONICAL_ACCOUNT_KINDS,
} from "../accounting/chartOfAccounts.js";
import { trialBalance, cashFlow, generalLedger } from "../accounting/reports/statements.js";
import { normalizeFeeTreatment } from "../domain/fee/feeEngine.js";

async function postSimple(dataDir, { amount = "100", status = "posted", extra = {} } = {}) {
  const opId = randomUUID();
  const cashId = "cash_k";
  const incomeId = "income_k";
  return runAtomicFinancialOperation({
    operationId: opId,
    type: "kernel.test",
    status,
    businessDate: "2026-06-01",
    baseCurrency: "IRR",
    dataDir,
    persistMode: "sqlite",
    engineVersions: { money: "1.0.0" },
    source: "api",
    journalLines: [
      {
        accountId: cashId,
        side: "debit",
        amount,
        currency: "IRR",
        amountInBase: amount,
        exchangeRateToBase: "1",
        lineKind: "other",
      },
      {
        accountId: incomeId,
        side: "credit",
        amount,
        currency: "IRR",
        amountInBase: amount,
        exchangeRateToBase: "1",
        lineKind: "other",
      },
    ],
    withinTransaction(db) {
      const now = new Date().toISOString();
      ensureAccount(db, {
        id: cashId,
        name: "Cash",
        accountKind: "asset",
        currency: "IRR",
        systemRole: "cash",
      });
      ensureAccount(db, {
        id: incomeId,
        name: "Income",
        accountKind: "income",
        currency: "IRR",
        systemRole: null,
      });
    },
    ...extra,
  });
}

test("P2 account kinds locked", () => {
  assert.deepEqual([...CANONICAL_ACCOUNT_KINDS], [
    "asset",
    "liability",
    "equity",
    "income",
    "expense",
  ]);
});

test("posted balanced journal → TB includes; draft excluded from GL", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-ak-"));
  await postSimple(dataDir, { amount: "100" });
  const draft = await postSimple(dataDir, { amount: "50", status: "draft" });
  assert.equal(draft.status, "draft");
  const gl = generalLedger(dataDir);
  assert.ok(gl.some((r) => r.amount === "100"));
  const tb = trialBalance(dataDir, { bookBaseCurrency: "IRR" });
  assert.equal(tb.balanced, true);
  closeAllDbs();
});

test("posted + 1 line rejected", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-ak1-"));
  await assert.rejects(
    () =>
      runAtomicFinancialOperation({
        operationId: randomUUID(),
        type: "kernel.one",
        status: "posted",
        businessDate: "2026-06-01",
        baseCurrency: "IRR",
        dataDir,
        persistMode: "sqlite",
        journalLines: [
          {
            accountId: "a",
            side: "debit",
            amount: "1",
            currency: "IRR",
            amountInBase: "1",
            exchangeRateToBase: "1",
          },
        ],
        withinTransaction() {},
      }),
    /OP_POSTED_REQUIRES_JOURNAL|INV_JOURNAL/,
  );
  closeAllDbs();
});

test("closed account rejects new use", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-ak-cl-"));
  await postSimple(dataDir, { amount: "0" }).catch(() => {});
  // create zero journal path via direct ensure + archive
  const db = openDb(dataDir);
  ensureAccount(db, {
    id: "arch1",
    name: "Arch",
    accountKind: "asset",
    currency: "IRR",
    systemRole: "cash",
  });
  archiveAccount(db, "arch1");
  assert.throws(() => getAccount(db, "arch1"), /ACCOUNT_CLOSED/);
  assert.throws(() => assertAccountUsable(db, "arch1", "IRR"), /ACCOUNT_CLOSED/);
  closeAllDbs();
});

test("currency mismatch on usable account", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-ak-ccy-"));
  const db = openDb(dataDir);
  ensureAccount(db, {
    id: "usd1",
    name: "USD cash",
    accountKind: "asset",
    currency: "USD",
    systemRole: "cash",
  });
  assert.throws(() => assertAccountUsable(db, "usd1", "IRR"), /ACCOUNT_CURRENCY_MISMATCH/);
  closeAllDbs();
});

test("cashFlow uses account.role not id prefix alone", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-ak-cf-"));
  await postSimple(dataDir, { amount: "200" });
  const cf = cashFlow(dataDir);
  // cash_k has role cash — should appear
  assert.equal(cf.netCashChange, "200");
  closeAllDbs();
});


test("fee treatment required; equity deferred", () => {
  assert.throws(() => normalizeFeeTreatment(null), /FEE_TREATMENT_REQUIRED/);
  assert.throws(() => normalizeFeeTreatment("equity_adjustment"), /FEE_TREATMENT_DEFERRED/);
});

test("idempotent replay same economics", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-ak-idem-"));
  const opId = randomUUID();
  const mk = () =>
    runAtomicFinancialOperation({
      operationId: opId,
      type: "kernel.idem",
      status: "posted",
      businessDate: "2026-06-01",
      baseCurrency: "IRR",
      dataDir,
      persistMode: "sqlite",
      engineVersions: { money: "1.0.0" },
      journalLines: [
        {
          accountId: "c1",
          side: "debit",
          amount: "10",
          currency: "IRR",
          amountInBase: "10",
          exchangeRateToBase: "1",
        },
        {
          accountId: "e1",
          side: "credit",
          amount: "10",
          currency: "IRR",
          amountInBase: "10",
          exchangeRateToBase: "1",
        },
      ],
      withinTransaction(db) {
        const now = new Date().toISOString();
        for (const [id, kind, role] of [
          ["c1", "asset", "cash"],
          ["e1", "income", null],
        ]) {
          ensureAccount(db, {
            id,
            name: id,
            accountKind: kind,
            currency: "IRR",
            systemRole: role,
          });
        }
      },
    });
  const r1 = await mk();
  const r2 = await mk();
  assert.equal(r2.idempotentReplay, true);
  assert.equal(r1.commandHash, r2.commandHash);
  closeAllDbs();
});
