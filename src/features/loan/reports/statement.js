import { getLoanById } from "../ledger/loanRepository.js";
import { latestSchedule } from "../ledger/scheduleRepository.js";
import { listLoanTransactions } from "../ledger/transactionRepository.js";
import { listFees } from "../ledger/feeRepository.js";
import { openDb } from "../../../core/persistence/port.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";

/**
 * Loan statement read-model.
 * Contract: payment portions are non-negative; reversal portions are stored signed (negative).
 * paidPrincipal / paidInterest = sum(portions) — never flip sign again for tx_type=reversal.
 * Journal remains accounting SoT.
 */
export function getStatement(loanId, { dataDir, asOf = null, limit = 500 } = {}) {
  const loan = getLoanById(dataDir, loanId);
  if (!loan) throw new Error("LOAN_NOT_FOUND");

  const schedule = latestSchedule(dataDir, loanId);
  let transactions = listLoanTransactions(dataDir, loanId, { limit });
  if (asOf) {
    transactions = transactions.filter((t) => t.business_date <= asOf);
  }
  const fees = listFees(dataDir, loanId);

  const db = openDb(dataDir);
  const opIds = [...new Set(transactions.map((t) => t.operation_id).filter(Boolean))];
  const operations = [];
  for (const id of opIds) {
    const op = db
      .prepare(
        `SELECT id, operation_type, status, business_date, base_currency, posted_at, reverses_operation_id
         FROM fin_operations WHERE id = ?`,
      )
      .get(id);
    if (op) operations.push(op);
  }

  let paidPrincipal = toDecimal("0");
  let paidInterest = toDecimal("0");
  let paidFee = toDecimal("0");
  let paidPenalty = toDecimal("0");
  for (const t of transactions) {
    if (t.tx_type !== "payment" && t.tx_type !== "reversal") continue;
    // signed storage: add as stored (reversal already negative)
    paidPrincipal = paidPrincipal.plus(toDecimal(String(t.principal_portion || "0")));
    paidInterest = paidInterest.plus(toDecimal(String(t.interest_portion || "0")));
    paidFee = paidFee.plus(toDecimal(String(t.fee_portion || "0")));
    paidPenalty = paidPenalty.plus(toDecimal(String(t.penalty_portion || "0")));
  }

  return {
    asOf: asOf || null,
    loan,
    schedule: schedule
      ? { version: schedule.version, rows: JSON.parse(schedule.snapshot_json) }
      : null,
    transactions,
    fees,
    operations,
    summary: {
      transactionCount: transactions.length,
      feeCount: fees.length,
      paymentCount: transactions.filter((t) => t.tx_type === "payment").length,
      reversalCount: transactions.filter((t) => t.tx_type === "reversal").length,
      paidPrincipal: paidPrincipal.toFixed(),
      paidInterest: paidInterest.toFixed(),
      paidFee: paidFee.toFixed(),
      paidPenalty: paidPenalty.toFixed(),
    },
  };
}
