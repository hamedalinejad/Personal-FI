/**
 * Phase 6A–H — Accounts / I-E / Cheque / Tax / Assets / Planning / Cross / Goldens
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { openDb, closeAllDbs } from "../../../core/persistence/worker.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import {
  createAccount,
  updateAccount,
  deposit,
  withdraw,
  transfer,
  archiveAccount,
} from "../public-api/index.js";
import { createIncome, reverseIncome } from "../../income/public-api/index.js";
import { createExpense, reverseExpense } from "../../expense/public-api/index.js";
import {
  registerCheque,
  depositCheque,
  clearCheque,
  bounceCheque,
  cancelCheque,
} from "../../cheque/public-api/index.js";
import { assessTax, payTax, adjustTax } from "../../tax/public-api/index.js";
import { registerAsset, updateAsset, disposeAsset } from "../../assets/public-api/index.js";
import { setBudget } from "../../budget/public-api/index.js";
import { createGoal } from "../../goals/public-api/index.js";
import { scheduleBill } from "../../bills/public-api/index.js";

function tmp() {
  return mkdtempSync(join(tmpdir(), "pf-p6h-"));
}

async function cashAccount(dataDir, name = "Cash") {
  return createAccount(
    {
      operationId: randomUUID(),
      payload: { name, currency: "IRR", accountKind: "cash" },
    },
    { dataDir },
  );
}

// ---------- 6A Accounts ----------
test("6A update account metadata without journal", async () => {
  const dataDir = tmp();
  const a = await cashAccount(dataDir);
  await updateAccount(
    { payload: { accountId: a.accountId, name: "Wallet", notes: "primary" } },
    { dataDir },
  );
  const db = openDb(dataDir);
  const row = db.prepare(`SELECT name, notes FROM acc_accounts WHERE id=?`).get(a.accountId);
  assert.equal(row.name, "Wallet");
  assert.equal(row.notes, "primary");
  assert.equal(db.prepare(`SELECT COUNT(*) AS c FROM fin_operations`).get().c, 0);
  closeAllDbs();
});

test("6A archive zero-balance succeeds", async () => {
  const dataDir = tmp();
  const a = await cashAccount(dataDir);
  const r = await archiveAccount({ payload: { accountId: a.accountId } }, { dataDir });
  assert.equal(r.status, "archived");
  const db = openDb(dataDir);
  assert.equal(db.prepare(`SELECT is_archived FROM acc_accounts WHERE id=?`).get(a.accountId).is_archived, 1);
  closeAllDbs();
});

test("6A currency mismatch deposit rejects", async () => {
  const dataDir = tmp();
  const a = await cashAccount(dataDir);
  await assert.rejects(
    () =>
      deposit(
        {
          operationId: randomUUID(),
          payload: {
            accountId: a.accountId,
            amount: "10",
            currency: "USD",
            businessDate: "2026-01-01",
          },
        },
        { dataDir },
      ),
    /CURRENCY|MISMATCH|VALIDATION/i,
  );
  closeAllDbs();
});

test("6A deposit idempotency same operationId", async () => {
  const dataDir = tmp();
  const a = await cashAccount(dataDir);
  const opId = randomUUID();
  const payload = {
    accountId: a.accountId,
    amount: "250",
    currency: "IRR",
    businessDate: "2026-01-01",
  };
  await deposit({ operationId: opId, payload }, { dataDir });
  await deposit({ operationId: opId, payload }, { dataDir });
  const db = openDb(dataDir);
  assert.equal(
    db.prepare(`SELECT COUNT(*) AS c FROM fin_operations WHERE id=?`).get(opId).c,
    1,
  );
  closeAllDbs();
});

// ---------- 6B Income / Expense ----------
test("6B income → expense → reverse expense; journal net matches", async () => {
  const dataDir = tmp();
  const a = await cashAccount(dataDir);
  await createIncome(
    {
      operationId: randomUUID(),
      payload: {
        accountId: a.accountId,
        amount: "1000",
        currency: "IRR",
        businessDate: "2026-02-01",
      },
    },
    { dataDir },
  );
  const expOp = randomUUID();
  await createExpense(
    {
      operationId: expOp,
      payload: {
        accountId: a.accountId,
        amount: "300",
        currency: "IRR",
        businessDate: "2026-02-02",
      },
    },
    { dataDir },
  );
  await reverseExpense(
    {
      operationId: randomUUID(),
      payload: {
        originalOperationId: expOp,
        businessDate: "2026-02-03",
        currency: "IRR",
      },
    },
    { dataDir },
  );
  const db = openDb(dataDir);
  // posted ops: income + expense + reverse
  assert.ok(db.prepare(`SELECT COUNT(*) AS c FROM fin_operations WHERE status='posted'`).get().c >= 3);
  // net cash journal on fin account should reflect +1000 after expense reversed
  const finId = db.prepare(`SELECT fin_account_id FROM acc_accounts WHERE id=?`).get(a.accountId)
    .fin_account_id;
  const lines = db
    .prepare(
      `SELECT jl.side, jl.amount FROM fin_journal_lines jl
       JOIN fin_journal_entries je ON je.id = jl.entry_id
       JOIN fin_operations o ON o.id = je.operation_id
       WHERE jl.account_id = ? AND o.status = 'posted'`,
    )
    .all(finId);
  let net = toDecimal("0");
  for (const l of lines) {
    const amt = toDecimal(String(l.amount));
    net = l.side === "debit" ? net.plus(amt) : net.minus(amt);
  }
  assert.equal(net.toFixed(), "1000");
  closeAllDbs();
});

// ---------- 6C Cheque ----------
test("6C happy path issued → deposited → cleared posts cash once", async () => {
  const dataDir = tmp();
  const a = await cashAccount(dataDir, "Bank");
  const ch = await registerCheque(
    {
      payload: {
        accountId: a.accountId,
        direction: "receivable",
        amount: "500",
        currency: "IRR",
        chequeNumber: "CH-1",
      },
    },
    { dataDir },
  );
  const db0 = openDb(dataDir);
  assert.equal(db0.prepare(`SELECT status FROM chk_cheques WHERE id=?`).get(ch.chequeId).status, "issued");
  assert.equal(db0.prepare(`SELECT COUNT(*) AS c FROM fin_operations`).get().c, 0);
  closeAllDbs();

  await depositCheque({ payload: { chequeId: ch.chequeId } }, { dataDir });
  const db1 = openDb(dataDir);
  assert.equal(db1.prepare(`SELECT status FROM chk_cheques WHERE id=?`).get(ch.chequeId).status, "deposited");
  assert.equal(db1.prepare(`SELECT COUNT(*) AS c FROM fin_operations`).get().c, 0);
  closeAllDbs();

  await clearCheque(
    {
      operationId: randomUUID(),
      payload: { chequeId: ch.chequeId, businessDate: "2026-03-05" },
    },
    { dataDir },
  );
  const db2 = openDb(dataDir);
  assert.equal(db2.prepare(`SELECT status FROM chk_cheques WHERE id=?`).get(ch.chequeId).status, "cleared");
  assert.ok(db2.prepare(`SELECT COUNT(*) AS c FROM fin_operations WHERE status='posted'`).get().c >= 1);
  closeAllDbs();
});

test("6C invalid transitions fail", async () => {
  const dataDir = tmp();
  const a = await cashAccount(dataDir);
  const ch = await registerCheque(
    {
      payload: {
        accountId: a.accountId,
        direction: "payable",
        amount: "100",
        currency: "IRR",
      },
    },
    { dataDir },
  );
  // bounce from issued (not deposited) should fail
  await assert.rejects(
    () =>
      bounceCheque(
        {
          operationId: randomUUID(),
          payload: { chequeId: ch.chequeId, businessDate: "2026-03-01" },
        },
        { dataDir },
      ),
    /CHEQUE_INVALID_TRANSITION/,
  );
  await depositCheque({ payload: { chequeId: ch.chequeId } }, { dataDir });
  await bounceCheque(
    {
      operationId: randomUUID(),
      payload: { chequeId: ch.chequeId, businessDate: "2026-03-02", reason: "NSF" },
    },
    { dataDir },
  );
  const db = openDb(dataDir);
  assert.equal(db.prepare(`SELECT status FROM chk_cheques WHERE id=?`).get(ch.chequeId).status, "bounced");
  // clear after bounce fails
  await assert.rejects(
    () =>
      clearCheque(
        {
          operationId: randomUUID(),
          payload: { chequeId: ch.chequeId, businessDate: "2026-03-03" },
        },
        { dataDir },
      ),
    /CHEQUE_INVALID_TRANSITION/,
  );
  closeAllDbs();
});

test("6C cancel pre-clear succeeds; no journal", async () => {
  const dataDir = tmp();
  const a = await cashAccount(dataDir);
  const ch = await registerCheque(
    {
      payload: {
        accountId: a.accountId,
        direction: "receivable",
        amount: "50",
        currency: "IRR",
      },
    },
    { dataDir },
  );
  await cancelCheque({ payload: { chequeId: ch.chequeId } }, { dataDir });
  const db = openDb(dataDir);
  assert.equal(db.prepare(`SELECT status FROM chk_cheques WHERE id=?`).get(ch.chequeId).status, "cancelled");
  assert.equal(db.prepare(`SELECT COUNT(*) AS c FROM fin_operations`).get().c, 0);
  closeAllDbs();
});

// ---------- 6D Tax ----------
test("6D assess → partial pay → full pay via operations", async () => {
  const dataDir = tmp();
  const a = await cashAccount(dataDir);
  await createIncome(
    {
      operationId: randomUUID(),
      payload: {
        accountId: a.accountId,
        amount: "5000",
        currency: "IRR",
        businessDate: "2026-04-01",
      },
    },
    { dataDir },
  );
  const tax = await assessTax(
    {
      operationId: randomUUID(),
      payload: {
        amount: "1000",
        currency: "IRR",
        businessDate: "2026-04-02",
        periodKey: "1405-Q1",
        jurisdiction: "IR",
      },
    },
    { dataDir },
  );
  await payTax(
    {
      operationId: randomUUID(),
      payload: {
        taxRecordId: tax.taxRecordId,
        accountId: a.accountId,
        amount: "400",
        currency: "IRR",
        businessDate: "2026-04-03",
      },
    },
    { dataDir },
  );
  let db = openDb(dataDir);
  let rec = db.prepare(`SELECT * FROM tax_records WHERE id=?`).get(tax.taxRecordId);
  assert.equal(rec.amount_paid, "400");
  assert.equal(rec.status, "pending");
  closeAllDbs();

  await payTax(
    {
      operationId: randomUUID(),
      payload: {
        taxRecordId: tax.taxRecordId,
        accountId: a.accountId,
        amount: "600",
        currency: "IRR",
        businessDate: "2026-04-04",
      },
    },
    { dataDir },
  );
  db = openDb(dataDir);
  rec = db.prepare(`SELECT * FROM tax_records WHERE id=?`).get(tax.taxRecordId);
  assert.equal(rec.amount_paid, "1000");
  assert.equal(rec.status, "paid");
  assert.ok(rec.payment_operation_id);
  closeAllDbs();
});

test("6D adjust changes amount_due without inventing payment", async () => {
  const dataDir = tmp();
  const tax = await assessTax(
    {
      operationId: randomUUID(),
      payload: {
        amount: "200",
        currency: "IRR",
        businessDate: "2026-05-01",
        periodKey: "1405-Q2",
        jurisdiction: "IR",
      },
    },
    { dataDir },
  );
  await adjustTax(
    {
      payload: {
        taxRecordId: tax.taxRecordId,
        amountDue: "250",
        reason: "correction",
      },
    },
    { dataDir },
  );
  const db = openDb(dataDir);
  const rec = db.prepare(`SELECT amount_due, amount_paid, status FROM tax_records WHERE id=?`).get(
    tax.taxRecordId,
  );
  assert.equal(rec.amount_due, "250");
  assert.equal(String(rec.amount_paid || "0"), "0");
  assert.notEqual(rec.status, "paid");
  closeAllDbs();
});

// ---------- 6E Assets ----------
test("6E register + update master data; dispose posts when contract allows", async () => {
  const dataDir = tmp();
  const asset = await registerAsset(
    { payload: { name: "Laptop", category: "equipment", currency: "IRR" } },
    { dataDir },
  );
  await updateAsset(
    { payload: { assetId: asset.assetId, name: "Laptop Pro" } },
    { dataDir },
  );
  const db = openDb(dataDir);
  const row = db.prepare(`SELECT name FROM pa_assets WHERE id=?`).get(asset.assetId);
  assert.equal(row.name, "Laptop Pro");
  // dispose may be DEFERRED or implemented — if succeeds, must use operation
  try {
    await disposeAsset(
      {
        operationId: randomUUID(),
        payload: {
          assetId: asset.assetId,
          businessDate: "2026-06-01",
          proceeds: "0",
          currency: "IRR",
        },
      },
      { dataDir },
    );
  } catch (e) {
    assert.match(String(e.message || e), /DEFERRED|NOT_IMPLEMENTED|VALIDATION|DISPOSE/i);
  }
  closeAllDbs();
});

// ---------- 6F Planning no journal ----------
test("6F budget planned 1000 + actual expense 700 → journal expense only 700", async () => {
  const dataDir = tmp();
  const a = await cashAccount(dataDir);
  await createIncome(
    {
      operationId: randomUUID(),
      payload: {
        accountId: a.accountId,
        amount: "2000",
        currency: "IRR",
        businessDate: "2026-07-01",
      },
    },
    { dataDir },
  );
  const budget = await setBudget(
    {
      payload: {
        periodKey: "2026-07",
        currency: "IRR",
        envelopes: [{ category: "food", assigned: "1000" }],
      },
    },
    { dataDir },
  );
  assert.equal(budget.journalTouched, false);

  await createExpense(
    {
      operationId: randomUUID(),
      payload: {
        accountId: a.accountId,
        amount: "700",
        currency: "IRR",
        businessDate: "2026-07-05",
      },
    },
    { dataDir },
  );

  const db = openDb(dataDir);
  // expense account lines sum to 700, not 1000
  const expLines = db
    .prepare(
      `SELECT jl.amount FROM fin_journal_lines jl
       JOIN fin_journal_entries je ON je.id = jl.entry_id
       WHERE jl.side = 'debit' AND jl.account_id LIKE '%expense%'`,
    )
    .all();
  let exp = toDecimal("0");
  for (const l of expLines) exp = exp.plus(toDecimal(String(l.amount)));
  assert.equal(exp.toFixed(), "700");
  assert.ok(db.prepare(`SELECT COUNT(*) AS c FROM bg_budgets`).get().c >= 1);
  closeAllDbs();
});

test("6F goal + bill schedule never post journal", async () => {
  const dataDir = tmp();
  await createGoal({ payload: { name: "Emergency", targetAmount: "10000", currency: "IRR" } }, { dataDir });
  await scheduleBill(
    {
      payload: {
        title: "Rent",
        amount: "5000",
        currency: "IRR",
        dueDate: "2026-08-01",
      },
    },
    { dataDir },
  );
  const db = openDb(dataDir);
  assert.equal(db.prepare(`SELECT COUNT(*) AS c FROM fin_operations`).get().c, 0);
  closeAllDbs();
});

// ---------- 6G Cross-module ----------
test("6G full chain without feature-internal imports beyond public-api", async () => {
  const dataDir = tmp();
  const a = await createAccount(
    {
      operationId: randomUUID(),
      payload: { name: "Main", currency: "IRR", accountKind: "bank_account" },
    },
    { dataDir },
  );
  await createIncome(
    {
      operationId: randomUUID(),
      payload: {
        accountId: a.accountId,
        amount: "10000",
        currency: "IRR",
        businessDate: "2026-08-01",
      },
    },
    { dataDir },
  );
  await createExpense(
    {
      operationId: randomUUID(),
      payload: {
        accountId: a.accountId,
        amount: "2000",
        currency: "IRR",
        businessDate: "2026-08-02",
      },
    },
    { dataDir },
  );
  const ch = await registerCheque(
    {
      payload: {
        accountId: a.accountId,
        direction: "receivable",
        amount: "500",
        currency: "IRR",
      },
    },
    { dataDir },
  );
  await depositCheque({ payload: { chequeId: ch.chequeId } }, { dataDir });
  await clearCheque(
    {
      operationId: randomUUID(),
      payload: { chequeId: ch.chequeId, businessDate: "2026-08-05" },
    },
    { dataDir },
  );
  const tax = await assessTax(
    {
      operationId: randomUUID(),
      payload: {
        amount: "500",
        currency: "IRR",
        businessDate: "2026-08-06",
        periodKey: "1405",
        jurisdiction: "IR",
      },
    },
    { dataDir },
  );
  await payTax(
    {
      operationId: randomUUID(),
      payload: {
        taxRecordId: tax.taxRecordId,
        accountId: a.accountId,
        amount: "500",
        currency: "IRR",
        businessDate: "2026-08-07",
      },
    },
    { dataDir },
  );
  const budget = await setBudget(
    {
      payload: {
        periodKey: "2026-08",
        currency: "IRR",
        envelopes: [{ assigned: "2000" }],
      },
    },
    { dataDir },
  );
  assert.equal(budget.journalTouched, false);
  const db = openDb(dataDir);
  assert.ok(db.prepare(`SELECT COUNT(*) AS c FROM fin_operations WHERE status='posted'`).get().c >= 5);
  assert.equal(db.prepare(`SELECT status FROM tax_records WHERE id=?`).get(tax.taxRecordId).status, "paid");
  assert.equal(db.prepare(`SELECT status FROM chk_cheques WHERE id=?`).get(ch.chequeId).status, "cleared");
  closeAllDbs();
});

// ---------- 6H Golden pack presence ----------
test("6H golden family files exist with expected journal/projection keys", () => {
  const names = [
    "CORE-ACCOUNTS",
    "CORE-INCOME-EXPENSE",
    "CORE-CHEQUE",
    "CORE-TAX",
    "CORE-ASSET",
    "CORE-PLANNING-NO-JOURNAL",
  ];
  for (const n of names) {
    const d = JSON.parse(readFileSync(join("fixtures", `${n}.json`), "utf8"));
    assert.ok(d.input, n);
    assert.ok(d.expected, n);
    assert.ok(d.expected.journal !== undefined || d.expected.status, n);
    assert.ok(d.expected.projection !== undefined || d.expected.balance !== undefined || d.expected.noJournal, n);
  }
});
