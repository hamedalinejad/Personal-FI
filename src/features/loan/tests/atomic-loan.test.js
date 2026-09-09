import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createLoan, recordPayment, getLoan } from "../public-api/index.js";
import { openDb, closeAllDbs } from "../../../core/persistence/worker.js";

test("loan.create atomic: loan row + schedule + journal same op", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-loan-at-"));
  const operationId = randomUUID();
  const r = await createLoan(
    {
      operationId,
      payload: {
        principal: "1200",
        annualRate: "0",
        periods: "12",
        method: "declining_balance",
        startDate: "2026-01-01",
        currency: "IRR",
      },
    },
    { dataDir },
  );
  assert.equal(r.idempotentReplay, false);
  const loan = getLoan(r.loanId, { dataDir });
  assert.equal(loan.principal, "1200");
  assert.equal(loan.operation_id, operationId);
  const db = openDb(dataDir);
  const snaps = db.prepare(`SELECT * FROM ln_schedule_snapshots WHERE loan_id = ?`).all(r.loanId);
  assert.equal(snaps.length, 1);
  const ops = db.prepare(`SELECT id FROM fin_operations WHERE id = ?`).get(operationId);
  assert.ok(ops);
  closeAllDbs();
});

test("loan.payment writes ln_transactions", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-loan-pay-"));
  const created = await createLoan(
    {
      payload: {
        principal: "1200",
        annualRate: "0",
        periods: "12",
        method: "declining_balance",
        startDate: "2026-01-01",
        currency: "IRR",
      },
    },
    { dataDir },
  );
  const pay = await recordPayment(
    {
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
