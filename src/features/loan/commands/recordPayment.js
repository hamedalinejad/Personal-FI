import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { bootstrapLoanEditionAccounts } from "../../../core/accounting/chartOfAccounts.js";
import { getLoanById } from "../ledger/loanRepository.js";
import { assertLoanPayable } from "../domain/loanState.js";
import { allocatePayment, allocationJournalLines } from "../domain/paymentAllocation.js";
import { latestSchedule } from "../ledger/scheduleRepository.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";

export async function recordPayment(
  input,
  {
    dataDir,
    cashAccountId = "LOC-CASH",
    receivableAccountId = "LOAN-REC",
    interestIncomeId = "LOAN-INT-INC",
    feeIncomeId = "LOAN-FEE-INC",
    penaltyIncomeId = "LOAN-PEN-INC",
    baseCurrency = "IRR",
  } = {},
) {
  const operationId = input.operationId || randomUUID();
  const p = input.payload || input;
  if (!p.loanId || !p.amount) throw new Error("VALIDATION_ERROR");
  if (!p.businessDate) throw new Error("OP_BUSINESS_DATE_REQUIRED");
  const currency = p.currency || baseCurrency;

  bootstrapLoanEditionAccounts(dataDir, currency);
  const loan = getLoanById(dataDir, p.loanId);
  assertLoanPayable(loan, currency);

  const schedule = latestSchedule(dataDir, p.loanId);
  let outstanding = {
    principal: loan.principal,
    interest: "0",
    fee: "0",
    penalty: "0",
  };
  if (schedule?.snapshot_json) {
    const rows = JSON.parse(schedule.snapshot_json);
    let prin = toDecimal("0");
    let interest = toDecimal("0");
    for (const row of rows) {
      prin = prin.plus(toDecimal(row.principal || "0"));
      interest = interest.plus(toDecimal(row.interest || "0"));
    }
    outstanding = {
      principal: prin.toFixed(),
      interest: interest.toFixed(),
      fee: "0",
      penalty: "0",
    };
  }

  const allocation = allocatePayment({ amount: p.amount, outstanding });
  const journalLines = allocationJournalLines({
    allocation,
    currency,
    cashAccountId,
    receivableAccountId,
    interestIncomeId,
    feeIncomeId,
    penaltyIncomeId,
  });

  const txId = randomUUID();
  const now = new Date().toISOString();

  return runAtomicFinancialOperation({
    operationId,
    type: "loan.recordPayment",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency: currency,
    payload: p,
    journalLines,
    domainResult: { loanId: p.loanId, allocation, lnTransactionId: txId },
    engineVersions: { loanSchedule: "1.0.0-period_based-equal-principal", money: "1.0.0" },
    withinTransaction(db) {
      db.prepare(
        `INSERT INTO ln_transactions (
          id, loan_id, operation_id, tx_type, business_date, amount, currency, created_at, payment_date
        ) VALUES (?, ?, ?, 'payment', ?, ?, ?, ?, ?)`,
      ).run(
        txId,
        p.loanId,
        operationId,
        p.businessDate,
        allocation.total,
        currency,
        now,
        p.paymentDate || p.businessDate,
      );
    },
  });
}
