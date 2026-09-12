import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { bootstrapLoanEditionAccounts, scopedAccountId } from "../../../core/accounting/chartOfAccounts.js";
import { openDb } from "../../../core/persistence/port.js";
import { allocatePayment, allocationJournalLines } from "../domain/paymentAllocation.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";

function max0(d) {
  return d.gt(0) ? d.toFixed() : "0";
}

/** Decimal-only outstanding from schedule + payment/reversal history. No CAST REAL. */
function computeOutstanding(db, loanId, loan) {
  const snap = db
    .prepare(`SELECT * FROM ln_schedule_snapshots WHERE loan_id = ? ORDER BY version DESC LIMIT 1`)
    .get(loanId);

  let schedPrin = toDecimal("0");
  let schedInt = toDecimal("0");
  if (snap?.snapshot_json) {
    const parsed = JSON.parse(snap.snapshot_json);
    const rows = parsed.installments || parsed.rows || (Array.isArray(parsed) ? parsed : []);
    for (const row of rows) {
      schedPrin = schedPrin.plus(toDecimal(row.principal || "0"));
      schedInt = schedInt.plus(toDecimal(row.interest || "0"));
    }
  } else {
    schedPrin = toDecimal(loan.principal);
  }

  const priorTx = db
    .prepare(
      `SELECT principal_portion, interest_portion, fee_portion, penalty_portion
       FROM ln_transactions WHERE loan_id = ? AND tx_type IN ('payment','reversal')`,
    )
    .all(loanId);

  let paidPrin = toDecimal("0");
  let paidInt = toDecimal("0");
  for (const t of priorTx) {
    paidPrin = paidPrin.plus(toDecimal(t.principal_portion || "0"));
    paidInt = paidInt.plus(toDecimal(t.interest_portion || "0"));
  }

  return {
    principal: max0(schedPrin.minus(paidPrin)),
    interest: max0(schedInt.minus(paidInt)),
    fee: "0",
    penalty: "0",
  };
}

export async function recordPayment(
  input,
  {
    dataDir,
    cashAccountId = null,
    receivableAccountId = null,
    interestIncomeId = null,
    feeIncomeId = null,
    penaltyIncomeId = null,
  } = {},
) {
  if (!input?.operationId) throw new Error("OP_OPERATION_ID_REQUIRED");
  const operationId = input.operationId;
  const p = input.payload || input;
  if (!p.loanId || !p.amount) throw new Error("VALIDATION_ERROR");
  if (!p.businessDate) throw new Error("OP_BUSINESS_DATE_REQUIRED");
  if (!p.currency) throw new Error("LOAN_CURRENCY_REQUIRED");

  const currency = p.currency;
  bootstrapLoanEditionAccounts(dataDir, currency);
  if (!cashAccountId) cashAccountId = scopedAccountId("local_settlement_cash", currency);
  if (!receivableAccountId) receivableAccountId = scopedAccountId("loan_receivable", currency);
  if (!interestIncomeId) interestIncomeId = scopedAccountId("loan_interest_income", currency);
  if (!feeIncomeId) feeIncomeId = scopedAccountId("loan_fee_income", currency);
  if (!penaltyIncomeId) penaltyIncomeId = scopedAccountId("loan_penalty_income", currency);
  if (typeof interestIncomeId !== "undefined" && !interestIncomeId) interestIncomeId = scopedAccountId("loan_interest_income", currency);


  const db = openDb(dataDir);
  const loan = db.prepare(`SELECT * FROM ln_loans WHERE id = ?`).get(p.loanId);
  if (!loan) throw new Error("LOAN_NOT_FOUND");
  if (loan.status !== "active") throw new Error("LOAN_NOT_ACTIVE");
  if (loan.currency !== currency) throw new Error("LOAN_CURRENCY_MISMATCH");

  const outstanding = computeOutstanding(db, p.loanId, loan);
  const totalOut = toDecimal(outstanding.principal)
    .plus(outstanding.interest)
    .plus(outstanding.fee)
    .plus(outstanding.penalty);
  if (toDecimal(p.amount).gt(totalOut)) {
    throw new Error("OVERPAYMENT_NOT_SUPPORTED");
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
  for (const line of journalLines) {
    line.amountInBase = line.amount;
    line.exchangeRateToBase = "1";
  }

  const txId = randomUUID();
  const now = new Date().toISOString();

  return runAtomicFinancialOperation({
    
    status: "posted",operationId,
    type: "loan.recordPayment",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency: currency,
    payload: p,
    journalLines,
    domainResult: { loanId: p.loanId, allocation, lnTransactionId: txId },
    engineVersions: { loanSchedule: "1.0.0-period_based-equal-principal", money: "1.0.0" },
    withinTransaction(db2) {
      // Authoritative re-check inside the same COMMIT boundary
      const loan2 = db2.prepare(`SELECT * FROM ln_loans WHERE id = ?`).get(p.loanId);
      const fresh = computeOutstanding(db2, p.loanId, loan2);
      const total2 = toDecimal(fresh.principal)
        .plus(fresh.interest)
        .plus(fresh.fee)
        .plus(fresh.penalty);
      if (toDecimal(p.amount).gt(total2)) {
        throw new Error("OVERPAYMENT_NOT_SUPPORTED");
      }

      db2.prepare(
        `INSERT INTO ln_transactions (
          id, loan_id, operation_id, tx_type, business_date, amount, currency, created_at, payment_date,
          principal_portion, interest_portion, fee_portion, penalty_portion
        ) VALUES (?, ?, ?, 'payment', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        txId,
        p.loanId,
        operationId,
        p.businessDate,
        allocation.total,
        currency,
        now,
        p.paymentDate || p.businessDate,
        allocation.principal,
        allocation.interest,
        allocation.fee,
        allocation.penalty,
      );
    },
  });
}
