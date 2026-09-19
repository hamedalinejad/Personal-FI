import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  createLoan,
  recordPayment,
  reversePayment,
  getLoan,
  getStatement,
} from "../public-api/index.js";
import { closeAllDbs } from "../../../core/persistence/port.js";

function payload(extra = {}) {
  return {
    role: "lender",
    principal: "200",
    currency: "IRR",
    annualRate: "0",
    periods: "2",
    method: "declining_balance",
    startDate: "2026-01-01",
    businessDate: "2026-01-01",
    dayCount: "period_based",
    originationKind: "disburse_now",
    ...extra,
  };
}

test("loan outstanding as-of ignores future payment transactions", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-loan-asof-"));
  const created = await createLoan({ operationId: randomUUID(), payload: payload() }, { dataDir });

  // Future-dated payment consumes 150, leaving 50 as of that future date.
  await recordPayment(
    {
      operationId: randomUUID(),
      payload: {
        loanId: created.loanId,
        amount: "150",
        currency: "IRR",
        businessDate: "2026-04-01",
      },
    },
    { dataDir },
  );

  // Retroactive business-date payment must calculate against the March cutoff,
  // where the April payment does not yet exist economically.
  const earlier = await recordPayment(
    {
      operationId: randomUUID(),
      payload: {
        loanId: created.loanId,
        amount: "100",
        currency: "IRR",
        businessDate: "2026-03-01",
      },
    },
    { dataDir },
  );
  assert.equal(earlier.status, "posted");

  const statement = getStatement(created.loanId, { dataDir, asOf: "2026-03-31" });
  assert.equal(statement.transactions.length, 1);
  assert.equal(statement.transactions[0].business_date, "2026-03-01");
  assert.equal(statement.summary.paidPrincipal, "100");
  closeAllDbs();
});

test("fully settled loan closes, reversal reopens it", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-loan-close-"));
  const created = await createLoan({ operationId: randomUUID(), payload: payload() }, { dataDir });

  const payment = await recordPayment(
    {
      operationId: randomUUID(),
      payload: {
        loanId: created.loanId,
        amount: "200",
        currency: "IRR",
        businessDate: "2026-02-01",
      },
    },
    { dataDir },
  );
  assert.equal(getLoan(created.loanId, { dataDir }).status, "paid_off");

  const reversed = await reversePayment(
    {
      operationId: randomUUID(),
      payload: {
        originalOperationId: payment.operationId,
        currency: "IRR",
        businessDate: "2026-02-02",
      },
    },
    { dataDir },
  );
  assert.equal(reversed.status, "posted");
  assert.equal(getLoan(created.loanId, { dataDir }).status, "active");

  const statement = getStatement(created.loanId, { dataDir });
  assert.equal(statement.summary.reversalCount, 1);
  assert.equal(statement.summary.paidPrincipal, "0");
  closeAllDbs();
});
