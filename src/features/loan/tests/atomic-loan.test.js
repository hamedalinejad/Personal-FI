import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createLoan, recordPayment, getLoan } from "../public-api/index.js";
import { openDb, closeAllDbs } from "../../../core/persistence/port.js";

function createInput(extra = {}) {
  return {
    operationId: extra.operationId || randomUUID(),
    payload: {
      role: "lent",
      principal: "1200",
      currency: "IRR",
      annualRate: "0",
      periods: "12",
      method: "declining_balance",
      startDate: "2026-01-01",
      businessDate: "2026-01-01",
      dayCount: "period_based",
      ...extra.payload,
    },
  };
}

test("loan.create atomic: loan row + schedule + journal same op", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-loan-at-"));
  const operationId = randomUUID();
  const r = await createLoan(createInput({ operationId }), { dataDir });
  assert.equal(r.idempotentReplay, false);
  const loan = getLoan(r.loanId, { dataDir });
  assert.equal(loan.principal, "1200");
  assert.equal(loan.operation_id, operationId);
  const db = openDb(dataDir);
  const snaps = db.prepare(`SELECT * FROM ln_schedule_snapshots WHERE loan_id = ?`).all(r.loanId);
  assert.equal(snaps.length, 1);
  const snap = JSON.parse(snaps[0].snapshot_json);
  assert.equal(snap.engineVersion, "1.0.0-period_based-equal-principal");
  assert.ok(Array.isArray(snap.installments));
  closeAllDbs();
});

test("loan.payment writes ln_transactions", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-loan-pay-"));
  const created = await createLoan(createInput(), { dataDir });
  const pay = await recordPayment(
    {
      operationId: randomUUID(),
      payload: {
        loanId: created.loanId,
        amount: "100",
        currency: "IRR",
        businessDate: "2026-02-01",
      },
    },
    { dataDir },
  );
  assert.equal(pay.idempotentReplay, false);
  const db = openDb(dataDir);
  const txs = db.prepare(`SELECT * FROM ln_transactions WHERE loan_id = ?`).all(created.loanId);
  assert.equal(txs.length, 1);
  assert.equal(txs[0].amount, "100");
  closeAllDbs();
});

test("loan.reversePayment creates reversal tx linked to original", async () => {
  const { reversePayment } = await import("../public-api/index.js");
  const dataDir = await mkdtemp(join(tmpdir(), "pf-loan-rev-"));
  const created = await createLoan(createInput(), { dataDir });
  const pay = await recordPayment(
    {
      operationId: randomUUID(),
      payload: {
        loanId: created.loanId,
        amount: "100",
        currency: "IRR",
        businessDate: "2026-02-01",
      },
    },
    { dataDir },
  );
  const rev = await reversePayment(
    {
      operationId: randomUUID(),
      payload: {
        originalOperationId: pay.operationId,
        businessDate: "2026-02-02",
        currency: "IRR",
      },
    },
    { dataDir },
  );
  assert.equal(rev.idempotentReplay, false);
  const db = openDb(dataDir);
  const op = db.prepare(`SELECT reverses_operation_id FROM fin_operations WHERE id = ?`).get(rev.operationId);
  assert.equal(op.reverses_operation_id, pay.operationId);
  closeAllDbs();
});

test("rejects overpayment", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-loan-ov-"));
  const created = await createLoan(createInput(), { dataDir });
  await assert.rejects(
    () =>
      recordPayment(
        {
          operationId: randomUUID(),
          payload: {
            loanId: created.loanId,
            amount: "999999",
            currency: "IRR",
            businessDate: "2026-02-01",
          },
        },
        { dataDir },
      ),
    /OVERPAYMENT_NOT_SUPPORTED/,
  );
  closeAllDbs();
});
