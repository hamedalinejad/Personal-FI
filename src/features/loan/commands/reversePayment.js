import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../../../core/domain/operation/operationEngine.js";
import { openDb } from "../../../core/persistence/worker.js";
import { bootstrapLoanEditionAccounts } from "../../../core/accounting/chartOfAccounts.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";

/**
 * Reverse a payment: new operation + reverses_operation_id + reversing journal + ln_transactions reversal.
 */
export async function reversePayment(
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
  const p = input.payload || input;
  if (!p.originalOperationId) throw new Error("VALIDATION_ERROR");
  if (!p.businessDate) throw new Error("OP_BUSINESS_DATE_REQUIRED");
  const operationId = input.operationId || randomUUID();
  const currency = p.currency || baseCurrency;

  bootstrapLoanEditionAccounts(dataDir, currency);
  const db = openDb(dataDir);
  const origOp = db.prepare(`SELECT * FROM fin_operations WHERE id = ?`).get(p.originalOperationId);
  if (!origOp) throw new Error("OP_NOT_FOUND");
  if (origOp.status !== "posted") throw new Error("REVERSAL_NOT_ALLOWED");

  const origTx = db
    .prepare(`SELECT * FROM ln_transactions WHERE operation_id = ? AND tx_type = 'payment'`)
    .get(p.originalOperationId);
  if (!origTx) throw new Error("LOAN_TX_NOT_FOUND");

  // Reverse journal: flip sides of original lines
  const lines = db
    .prepare(
      `SELECT jl.account_id as accountId, jl.side, jl.amount, jl.currency
       FROM fin_journal_lines jl
       JOIN fin_journal_entries je ON je.id = jl.entry_id
       WHERE je.operation_id = ?
       ORDER BY jl.line_number`,
    )
    .all(p.originalOperationId);

  const journalLines = lines.map((l, i) => ({
    accountId: l.accountId,
    side: l.side === "debit" ? "credit" : "debit",
    amount: l.amount,
    currency: l.currency || currency,
    line_number: i + 1,
  }));

  const txId = randomUUID();
  const now = new Date().toISOString();

  return runAtomicFinancialOperation({
    operationId,
    type: "loan.reversePayment",
    dataDir,
    businessDate: p.businessDate,
    baseCurrency: currency,
    payload: p,
    journalLines,
    domainResult: {
      reversesOperationId: p.originalOperationId,
      originalTxId: origTx.id,
      lnTransactionId: txId,
    },
    engineVersions: { loanSchedule: "1.0.0-period_based-equal-principal", money: "1.0.0" },
    withinTransaction(db2) {
      db2.prepare(
        `UPDATE fin_operations SET reverses_operation_id = ? WHERE id = ?`,
      ).run(p.originalOperationId, operationId);
      db2.prepare(
        `INSERT INTO ln_transactions (
          id, loan_id, operation_id, tx_type, business_date, amount, currency, created_at, payment_date,
          principal_portion, interest_portion, fee_portion, penalty_portion, reverses_transaction_id
        ) VALUES (?, ?, ?, 'reversal', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        txId,
        origTx.loan_id,
        operationId,
        p.businessDate,
        origTx.amount,
        currency,
        now,
        p.businessDate,
        toDecimal(origTx.principal_portion || "0").times("-1").toFixed(),
        toDecimal(origTx.interest_portion || "0").times("-1").toFixed(),
        toDecimal(origTx.fee_portion || "0").times("-1").toFixed(),
        toDecimal(origTx.penalty_portion || "0").times("-1").toFixed(),
        origTx.id,
      );
    },
  });
}
