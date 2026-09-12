import { getLoanById } from "../ledger/loanRepository.js";
import { latestSchedule } from "../ledger/scheduleRepository.js";
import { listLoanTransactions } from "../ledger/transactionRepository.js";
import { listFees } from "../ledger/feeRepository.js";
import { openDb } from "../../../core/persistence/port.js";

/**
 * Loan statement read-model: loan + schedule + txs + fees + linked operations.
 * Not a substitute for GL; accounting lines remain in journal.
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
    const op = db.prepare(`SELECT id, operation_type, status, business_date, base_currency, posted_at FROM fin_operations WHERE id = ?`).get(id);
    if (op) operations.push(op);
  }

  // Simple balance from loan + payment portions (domain; journal remains SoT)
  const paidPrincipal = transactions
    .filter((t) => t.tx_type === "payment")
    .reduce((s, t) => s + Number(t.principal_portion || 0), 0);
  // Use string decimal path in future — Number only for display summary warning
  // Prefer recompute via toDecimal in next iteration

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
    },
  };
}
