import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createLoan } from "../public-api/index.js";
import { listFees } from "../ledger/feeRepository.js";
import { openDb, closeAllDbs } from "../../../core/persistence/port.js";
import { recordLoanTx } from "../ledger/transactionRepository.js";
import { getStatement } from "../reports/statement.js";

test("listFees returns [] only when table empty for loan", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-fee-"));
  const r = await createLoan(
    {
      operationId: randomUUID(),
      payload: {
        role: "lent",
        principal: "1000000",
        currency: "IRR",
        annualRate: "0",
        periods: "2",
        method: "declining_balance",
        startDate: "2026-01-01",
        businessDate: "2026-01-01",
        dayCount: "period_based",
      },
    },
    { dataDir },
  );
  const loanId = r.loanId || r.domainResult?.loanId || r.domainResult?.loan?.id;
  assert.ok(loanId);
  assert.deepEqual(listFees(dataDir, loanId), []);
  // insert fee row
  const db = openDb(dataDir);
  db.prepare(
    `INSERT INTO ln_loan_fees (id, loan_id, fee_kind, amount_due, amount_paid, amount_waived, currency, fee_timing)
     VALUES (?, ?, 'origination', '100', '0', '0', 'IRR', 'upfront')`,
  ).run(randomUUID(), loanId);
  const fees = listFees(dataDir, loanId);
  assert.equal(fees.length, 1);
  assert.equal(fees[0].fee_kind, "origination");
  assert.equal(fees[0].amount_due, "100");
  closeAllDbs();
});

test("recordLoanTx fake write is rejected", () => {
  assert.throws(() => recordLoanTx(), /LOAN_TX_WRITE_VIA_COMMAND_ONLY/);
});

test("getStatement includes transactions after payment", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-st-"));
  const { createLoan, recordPayment } = await import("../public-api/index.js");
  const create = await createLoan(
    {
      operationId: randomUUID(),
      payload: {
        role: "lent",
        principal: "1000000",
        currency: "IRR",
        annualRate: "0",
        periods: "2",
        method: "declining_balance",
        startDate: "2026-01-01",
        businessDate: "2026-01-01",
        dayCount: "period_based",
      },
    },
    { dataDir },
  );
  const loanId = create.loanId || create.domainResult?.loanId || create.domainResult?.loan?.id;
  await recordPayment(
    {
      operationId: randomUUID(),
      payload: {
        loanId,
        amount: "100000",
        currency: "IRR",
        businessDate: "2026-02-01",
      },
    },
    { dataDir },
  );
  const stmt = getStatement(loanId, { dataDir });
  assert.ok(stmt.transactions.length >= 1);
  assert.ok(stmt.summary.paymentCount >= 1);
  closeAllDbs();
});
