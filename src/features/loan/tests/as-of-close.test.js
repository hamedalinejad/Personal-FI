/**
 * Phase 4 — as-of outstanding + paid_off lifecycle + statement sign contract.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createLoan } from "../commands/createLoan.js";
import { recordPayment } from "../commands/recordPayment.js";
import { reversePayment } from "../commands/reversePayment.js";
import { getStatement } from "../reports/statement.js";
import { closeAllDbs, openDb } from "../../../core/persistence/worker.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";

async function makeZeroRateLoan(dataDir) {
  const opId = randomUUID();
  const r = await createLoan(
    {
      operationId: opId,
      type: "loan.create",
      payload: {
        role: "lender",
        principal: "400",
        currency: "IRR",
        annualRate: "0",
        periods: "2",
        method: "declining_balance",
        startDate: "2026-01-01",
        businessDate: "2026-01-01",
        dayCount: "period_based",
        installmentFrequency: "monthly",
        originationKind: "disburse_now",
      },
    },
    { dataDir },
  );
  const loanId = r.loanId || r.domainResult?.loan?.id;
  assert.ok(loanId, "loanId");
  return { loanId, createOpId: opId };
}

test("as-of: future payment excluded from statement before cutoff", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-loan-asof-"));
  const { loanId } = await makeZeroRateLoan(dataDir);

  // Early payment on Feb 1 for first installment (~200)
  await recordPayment(
    {
      operationId: randomUUID(),
      type: "loan.recordPayment",
      payload: {
        loanId,
        amount: "200",
        currency: "IRR",
        businessDate: "2026-02-01",
        paymentDate: "2026-02-01",
      },
    },
    { dataDir },
  );

  // Future-dated payment (should not appear as-of Mar 31 if business_date is April)
  await recordPayment(
    {
      operationId: randomUUID(),
      type: "loan.recordPayment",
      payload: {
        loanId,
        amount: "200",
        currency: "IRR",
        businessDate: "2026-04-01",
        paymentDate: "2026-04-01",
      },
    },
    { dataDir },
  );

  const stmt = getStatement(loanId, { dataDir, asOf: "2026-03-31" });
  assert.equal(stmt.summary.paymentCount, 1);
  assert.ok(
    toDecimal(stmt.summary.paidPrincipal).eq(toDecimal("200")),
    `expected 200 paid principal as-of, got ${stmt.summary.paidPrincipal}`,
  );
  closeAllDbs();
});

test("fully settled loan closes; reversal reopens; paidPrincipal net zero", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-loan-close-"));
  const { loanId } = await makeZeroRateLoan(dataDir);

  const payOp = randomUUID();
  await recordPayment(
    {
      operationId: payOp,
      type: "loan.recordPayment",
      payload: {
        loanId,
        amount: "400",
        currency: "IRR",
        businessDate: "2026-02-01",
        paymentDate: "2026-02-01",
      },
    },
    { dataDir },
  );

  let db = openDb(dataDir);
  let loan = db.prepare(`SELECT status FROM ln_loans WHERE id = ?`).get(loanId);
  assert.equal(loan.status, "paid_off");
  closeAllDbs();

  await reversePayment(
    {
      operationId: randomUUID(),
      type: "loan.reversePayment",
      payload: {
        originalOperationId: payOp,
        businessDate: "2026-02-02",
        currency: "IRR",
      },
    },
    { dataDir },
  );

  db = openDb(dataDir);
  loan = db.prepare(`SELECT status FROM ln_loans WHERE id = ?`).get(loanId);
  assert.equal(loan.status, "active");
  closeAllDbs();

  const stmt = getStatement(loanId, { dataDir });
  assert.equal(stmt.summary.reversalCount, 1);
  assert.equal(stmt.summary.paymentCount, 1);
  // payment +200/+200 principal + reversal -400 principal → net 0
  assert.equal(stmt.summary.paidPrincipal, "0");
  closeAllDbs();
});

test("partial payment then full reverse → paidPrincipal zero; status active", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-loan-partial-rev-"));
  const { loanId } = await makeZeroRateLoan(dataDir);
  const payOp = randomUUID();
  await recordPayment(
    {
      operationId: payOp,
      type: "loan.recordPayment",
      payload: {
        loanId,
        amount: "200",
        currency: "IRR",
        businessDate: "2026-02-01",
        paymentDate: "2026-02-01",
      },
    },
    { dataDir },
  );
  let stmt = getStatement(loanId, { dataDir });
  assert.equal(stmt.summary.paidPrincipal, "200");
  await reversePayment(
    {
      operationId: randomUUID(),
      type: "loan.reversePayment",
      payload: {
        originalOperationId: payOp,
        businessDate: "2026-02-03",
        currency: "IRR",
      },
    },
    { dataDir },
  );
  stmt = getStatement(loanId, { dataDir });
  assert.equal(stmt.summary.paymentCount, 1);
  assert.equal(stmt.summary.reversalCount, 1);
  assert.equal(stmt.summary.paidPrincipal, "0");
  assert.equal(stmt.summary.paidInterest, "0");
  const db = openDb(dataDir);
  const loan = db.prepare(`SELECT status FROM ln_loans WHERE id = ?`).get(loanId);
  assert.equal(loan.status, "active");
  closeAllDbs();
});

test("two payments + reverse second only → paidPrincipal equals first payment", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-loan-multi-rev-"));
  const { loanId } = await makeZeroRateLoan(dataDir);
  const pay1 = randomUUID();
  await recordPayment(
    {
      operationId: pay1,
      type: "loan.recordPayment",
      payload: {
        loanId,
        amount: "150",
        currency: "IRR",
        businessDate: "2026-02-01",
        paymentDate: "2026-02-01",
      },
    },
    { dataDir },
  );
  const pay2 = randomUUID();
  await recordPayment(
    {
      operationId: pay2,
      type: "loan.recordPayment",
      payload: {
        loanId,
        amount: "100",
        currency: "IRR",
        businessDate: "2026-03-01",
        paymentDate: "2026-03-01",
      },
    },
    { dataDir },
  );
  await reversePayment(
    {
      operationId: randomUUID(),
      type: "loan.reversePayment",
      payload: {
        originalOperationId: pay2,
        businessDate: "2026-03-02",
        currency: "IRR",
      },
    },
    { dataDir },
  );
  const stmt = getStatement(loanId, { dataDir });
  assert.equal(stmt.summary.paymentCount, 2);
  assert.equal(stmt.summary.reversalCount, 1);
  assert.equal(stmt.summary.paidPrincipal, "150");
  closeAllDbs();
});

test("double reverse of same payment is rejected", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-loan-dbl-rev-"));
  const { loanId } = await makeZeroRateLoan(dataDir);
  const payOp = randomUUID();
  await recordPayment(
    {
      operationId: payOp,
      type: "loan.recordPayment",
      payload: {
        loanId,
        amount: "100",
        currency: "IRR",
        businessDate: "2026-02-01",
        paymentDate: "2026-02-01",
      },
    },
    { dataDir },
  );
  await reversePayment(
    {
      operationId: randomUUID(),
      type: "loan.reversePayment",
      payload: {
        originalOperationId: payOp,
        businessDate: "2026-02-02",
        currency: "IRR",
      },
    },
    { dataDir },
  );
  await assert.rejects(
    () =>
      reversePayment(
        {
          operationId: randomUUID(),
          type: "loan.reversePayment",
          payload: {
            originalOperationId: payOp,
            businessDate: "2026-02-03",
            currency: "IRR",
          },
        },
        { dataDir },
      ),
    /ALREADY_REVERSED/,
  );
  closeAllDbs();
});
