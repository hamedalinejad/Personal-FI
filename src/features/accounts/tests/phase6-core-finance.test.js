/**
 * Phase 6 — Core finance modules acceptance (accounts/income/expense/cheque/tax/assets/planning)
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { openDb, closeAllDbs } from "../../../core/persistence/worker.js";
import { createAccount, deposit, withdraw, transfer, archiveAccount } from "../public-api/index.js";
import { createIncome, reverseIncome } from "../../income/public-api/index.js";
import { createExpense, reverseExpense } from "../../expense/public-api/index.js";
import { registerCheque, depositCheque, clearCheque, bounceCheque, cancelCheque } from "../../cheque/public-api/index.js";
import { assessTax, payTax, adjustTax } from "../../tax/public-api/index.js";
import { registerAsset, updateAsset, disposeAsset } from "../../assets/public-api/index.js";
import { setBudget } from "../../budget/public-api/index.js";
import { createGoal } from "../../goals/public-api/index.js";
import { scheduleBill } from "../../bills/public-api/index.js";

function tmp() {
  return mkdtempSync(join(tmpdir(), "pf-p6-"));
}

test("accounts create + deposit + transfer + withdraw journal path", async () => {
  const dataDir = tmp();
  const a1 = await createAccount({
    operationId: randomUUID(),
    payload: { name: "Cash", currency: "IRR", accountKind: "cash" },
  }, { dataDir });
  const a2 = await createAccount({
    operationId: randomUUID(),
    payload: { name: "Bank", currency: "IRR", accountKind: "bank_account" },
  }, { dataDir });

  await deposit({
    operationId: randomUUID(),
    payload: { accountId: a1.accountId, amount: "1000", currency: "IRR", businessDate: "2026-01-01" },
  }, { dataDir });

  await transfer({
    operationId: randomUUID(),
    payload: {
      fromAccountId: a1.accountId,
      toAccountId: a2.accountId,
      amount: "400",
      currency: "IRR",
      businessDate: "2026-01-02",
    },
  }, { dataDir });

  await withdraw({
    operationId: randomUUID(),
    payload: { accountId: a2.accountId, amount: "100", currency: "IRR", businessDate: "2026-01-03" },
  }, { dataDir });

  const db = openDb(dataDir);
  const ops = db.prepare(`SELECT COUNT(*) AS c FROM fin_operations WHERE status='posted'`).get().c;
  assert.ok(ops >= 3);
  const lines = db.prepare(`SELECT COUNT(*) AS c FROM fin_journal_lines`).get().c;
  assert.ok(lines >= 6);
  const txs = db.prepare(`SELECT COUNT(*) AS c FROM acc_transactions`).get().c;
  assert.ok(txs >= 4);
  closeAllDbs();
});

test("income create + reverse", async () => {
  const dataDir = tmp();
  const a = await createAccount({
    operationId: randomUUID(),
    payload: { name: "Cash", currency: "IRR", accountKind: "cash" },
  }, { dataDir });
  const opId = randomUUID();
  await createIncome({
    operationId: opId,
    payload: { accountId: a.accountId, amount: "500", currency: "IRR", businessDate: "2026-02-01", description: "salary" },
  }, { dataDir });
  await reverseIncome({
    operationId: randomUUID(),
    payload: { originalOperationId: opId, businessDate: "2026-02-02" },
  }, { dataDir });
  const db = openDb(dataDir);
  const voided = db.prepare(`SELECT is_voided FROM inc_transactions WHERE operation_id = ?`).get(opId);
  assert.equal(voided.is_voided, 1);
  closeAllDbs();
});

test("expense create + reverse", async () => {
  const dataDir = tmp();
  const a = await createAccount({
    operationId: randomUUID(),
    payload: { name: "Cash", currency: "IRR", accountKind: "cash" },
  }, { dataDir });
  await deposit({
    operationId: randomUUID(),
    payload: { accountId: a.accountId, amount: "1000", currency: "IRR", businessDate: "2026-03-01" },
  }, { dataDir });
  const opId = randomUUID();
  await createExpense({
    operationId: opId,
    payload: { accountId: a.accountId, amount: "200", currency: "IRR", businessDate: "2026-03-02" },
  }, { dataDir });
  await reverseExpense({
    operationId: randomUUID(),
    payload: { originalOperationId: opId, businessDate: "2026-03-03" },
  }, { dataDir });
  const db = openDb(dataDir);
  const voided = db.prepare(`SELECT is_voided FROM exp_transactions WHERE operation_id = ?`).get(opId);
  assert.equal(voided.is_voided, 1);
  closeAllDbs();
});

test("cheque lifecycle: register without cash, clear with cash, bounce reverses", async () => {
  const dataDir = tmp();
  const a = await createAccount({
    operationId: randomUUID(),
    payload: { name: "Bank", currency: "IRR", accountKind: "bank_account" },
  }, { dataDir });
  const reg = await registerCheque({
    payload: {
      accountId: a.accountId,
      direction: "receivable",
      amount: "300",
      currency: "IRR",
      dueDate: "2026-04-01",
    },
  }, { dataDir });
  // register must not create journal
  let db = openDb(dataDir);
  assert.equal(db.prepare(`SELECT COUNT(*) AS c FROM fin_operations`).get().c, 0);
  closeAllDbs();

  await depositCheque({ payload: { chequeId: reg.chequeId } }, { dataDir });
  const clearOp = randomUUID();
  await clearCheque({
    operationId: clearOp,
    payload: { chequeId: reg.chequeId, businessDate: "2026-04-05" },
  }, { dataDir });

  db = openDb(dataDir);
  assert.equal(db.prepare(`SELECT status FROM chk_cheques WHERE id=?`).get(reg.chequeId).status, "cleared");
  assert.ok(db.prepare(`SELECT COUNT(*) AS c FROM fin_journal_lines`).get().c >= 2);
  closeAllDbs();

  await bounceCheque({
    operationId: randomUUID(),
    payload: { chequeId: reg.chequeId, businessDate: "2026-04-06", reason: "NSF" },
  }, { dataDir });
  db = openDb(dataDir);
  assert.equal(db.prepare(`SELECT status FROM chk_cheques WHERE id=?`).get(reg.chequeId).status, "bounced");
  closeAllDbs();
});

test("cheque cancel pre-clear; invalid clear after cancel", async () => {
  const dataDir = tmp();
  const a = await createAccount({
    operationId: randomUUID(),
    payload: { name: "Bank", currency: "IRR", accountKind: "bank_account" },
  }, { dataDir });
  const reg = await registerCheque({
    payload: { accountId: a.accountId, direction: "payable", amount: "50", currency: "IRR" },
  }, { dataDir });
  await cancelCheque({ payload: { chequeId: reg.chequeId } }, { dataDir });
  await assert.rejects(
    () =>
      clearCheque({
        operationId: randomUUID(),
        payload: { chequeId: reg.chequeId, businessDate: "2026-04-10" },
      }, { dataDir }),
    /CHEQUE_INVALID_TRANSITION/,
  );
  closeAllDbs();
});

test("tax assess does not pay; pay marks paid; adjust cannot set paid", async () => {
  const dataDir = tmp();
  const a = await createAccount({
    operationId: randomUUID(),
    payload: { name: "Cash", currency: "IRR", accountKind: "cash" },
  }, { dataDir });
  await deposit({
    operationId: randomUUID(),
    payload: { accountId: a.accountId, amount: "5000", currency: "IRR", businessDate: "2026-05-01" },
  }, { dataDir });

  const assessed = await assessTax({
    operationId: randomUUID(),
    payload: {
      amount: "1000",
      currency: "IRR",
      businessDate: "2026-05-02",
      periodKey: "1404",
      jurisdiction: "IR",
      taxKind: "income",
    },
  }, { dataDir });

  let db = openDb(dataDir);
  assert.equal(db.prepare(`SELECT status FROM tax_records WHERE id=?`).get(assessed.taxRecordId).status, "pending");
  closeAllDbs();

  await assert.rejects(
    () => adjustTax({ payload: { taxRecordId: assessed.taxRecordId, reason: "x", status: "paid" } }, { dataDir }),
    /TAX_PAID_ONLY_VIA_PAY/,
  );

  await payTax({
    operationId: randomUUID(),
    payload: {
      taxRecordId: assessed.taxRecordId,
      accountId: a.accountId,
      amount: "1000",
      currency: "IRR",
      businessDate: "2026-05-03",
    },
  }, { dataDir });

  db = openDb(dataDir);
  assert.equal(db.prepare(`SELECT status FROM tax_records WHERE id=?`).get(assessed.taxRecordId).status, "paid");
  closeAllDbs();
});

test("assets register/update/dispose", async () => {
  const dataDir = tmp();
  const a = await createAccount({
    operationId: randomUUID(),
    payload: { name: "Cash", currency: "IRR", accountKind: "cash" },
  }, { dataDir });
  const asset = await registerAsset({
    payload: { name: "Laptop", currency: "IRR", assetKind: "electronics", acquisitionCost: "2000" },
  }, { dataDir });
  await updateAsset({ payload: { assetId: asset.assetId, location: "office" } }, { dataDir });
  await disposeAsset({
    operationId: randomUUID(),
    payload: {
      assetId: asset.assetId,
      accountId: a.accountId,
      proceeds: "1500",
      currency: "IRR",
      businessDate: "2026-06-01",
    },
  }, { dataDir });
  const db = openDb(dataDir);
  assert.equal(db.prepare(`SELECT is_disposed FROM pa_assets WHERE id=?`).get(asset.assetId).is_disposed, 1);
  assert.ok(db.prepare(`SELECT COUNT(*) AS c FROM pa_transactions`).get().c >= 1);
  closeAllDbs();
});

test("planning budget/goal/bill never touch journal", async () => {
  const dataDir = tmp();
  await setBudget({
    payload: {
      periodKey: "2026-06",
      currency: "IRR",
      totalIncome: "10000",
      envelopes: [{ categoryId: "food", assigned: "3000" }],
    },
  }, { dataDir });
  await createGoal({
    payload: { name: "Emergency", currency: "IRR", targetAmount: "50000" },
  }, { dataDir });
  await scheduleBill({
    payload: { title: "Rent", amount: "8000", currency: "IRR", dueDate: "2026-07-01" },
  }, { dataDir });

  const db = openDb(dataDir);
  assert.equal(db.prepare(`SELECT COUNT(*) AS c FROM fin_operations`).get().c, 0);
  assert.equal(db.prepare(`SELECT COUNT(*) AS c FROM fin_journal_lines`).get().c, 0);
  assert.ok(db.prepare(`SELECT COUNT(*) AS c FROM bg_budgets`).get().c >= 1);
  assert.ok(db.prepare(`SELECT COUNT(*) AS c FROM fg_goals`).get().c >= 1);
  assert.ok(db.prepare(`SELECT COUNT(*) AS c FROM br_items`).get().c >= 1);
  closeAllDbs();
});

test("cross-module chain: income → expense → cheque → tax → budget", async () => {
  const dataDir = tmp();
  const a = await createAccount({
    operationId: randomUUID(),
    payload: { name: "Main", currency: "IRR", accountKind: "bank_account" },
  }, { dataDir });
  await createIncome({
    operationId: randomUUID(),
    payload: { accountId: a.accountId, amount: "10000", currency: "IRR", businessDate: "2026-08-01" },
  }, { dataDir });
  await createExpense({
    operationId: randomUUID(),
    payload: { accountId: a.accountId, amount: "2000", currency: "IRR", businessDate: "2026-08-02" },
  }, { dataDir });
  const ch = await registerCheque({
    payload: { accountId: a.accountId, direction: "receivable", amount: "500", currency: "IRR" },
  }, { dataDir });
  await depositCheque({ payload: { chequeId: ch.chequeId } }, { dataDir });
  await clearCheque({
    operationId: randomUUID(),
    payload: { chequeId: ch.chequeId, businessDate: "2026-08-05" },
  }, { dataDir });
  const tax = await assessTax({
    operationId: randomUUID(),
    payload: {
      amount: "500",
      currency: "IRR",
      businessDate: "2026-08-06",
      periodKey: "1405",
      jurisdiction: "IR",
    },
  }, { dataDir });
  await payTax({
    operationId: randomUUID(),
    payload: {
      taxRecordId: tax.taxRecordId,
      accountId: a.accountId,
      amount: "500",
      currency: "IRR",
      businessDate: "2026-08-07",
    },
  }, { dataDir });
  const budget = await setBudget({
    payload: { periodKey: "2026-08", currency: "IRR", envelopes: [{ assigned: "2000" }] },
  }, { dataDir });
  assert.equal(budget.journalTouched, false);

  const db = openDb(dataDir);
  assert.ok(db.prepare(`SELECT COUNT(*) AS c FROM fin_operations WHERE status='posted'`).get().c >= 5);
  assert.equal(db.prepare(`SELECT status FROM tax_records WHERE id=?`).get(tax.taxRecordId).status, "paid");
  closeAllDbs();
});

test("archive non-zero rejects", async () => {
  const dataDir = tmp();
  const a = await createAccount({
    operationId: randomUUID(),
    payload: { name: "Cash", currency: "IRR", accountKind: "cash" },
  }, { dataDir });
  await deposit({
    operationId: randomUUID(),
    payload: { accountId: a.accountId, amount: "100", currency: "IRR", businessDate: "2026-09-01" },
  }, { dataDir });
  await assert.rejects(
    () => archiveAccount({ payload: { accountId: a.accountId } }, { dataDir }),
    /ACCOUNT_ARCHIVE|nonzero|balance/i,
  );
  closeAllDbs();
});
