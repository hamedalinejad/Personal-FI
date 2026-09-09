import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import { openDb } from "../../../core/persistence/worker.js";
import { latestSchedule } from "../ledger/scheduleRepository.js";
import { getLoanById } from "../ledger/loanRepository.js";

/**
 * Derived remaining — not a second SoT.
 * principal remaining = schedule principal sum - Σ payment principal + Σ reversal principal
 */
export function computeRemaining(loanId, dataDir) {
  const loan = getLoanById(dataDir, loanId);
  if (!loan) throw new Error("LOAN_NOT_FOUND");
  const schedule = latestSchedule(dataDir, loanId);
  let schedPrin = toDecimal("0");
  let schedInt = toDecimal("0");
  if (schedule?.snapshot_json) {
    for (const row of JSON.parse(schedule.snapshot_json)) {
      schedPrin = schedPrin.plus(toDecimal(row.principal || "0"));
      schedInt = schedInt.plus(toDecimal(row.interest || "0"));
    }
  } else {
    schedPrin = toDecimal(loan.principal);
  }

  const db = openDb(dataDir);
  const txs = db
    .prepare(
      `SELECT tx_type, principal_portion, interest_portion, fee_portion, penalty_portion
       FROM ln_transactions WHERE loan_id = ?`,
    )
    .all(loanId);

  let paidPrin = toDecimal("0");
  let paidInt = toDecimal("0");
  let paidFee = toDecimal("0");
  let paidPen = toDecimal("0");
  for (const t of txs) {
    // portions already signed: payments positive, reversals negative
    paidPrin = paidPrin.plus(toDecimal(t.principal_portion || "0"));
    paidInt = paidInt.plus(toDecimal(t.interest_portion || "0"));
    paidFee = paidFee.plus(toDecimal(t.fee_portion || "0"));
    paidPen = paidPen.plus(toDecimal(t.penalty_portion || "0"));
  }

  const remainingPrincipal = schedPrin.minus(paidPrin);
  const remainingInterest = schedInt.minus(paidInt);
  return {
    remainingPrincipal: remainingPrincipal.gt(0) ? remainingPrincipal.toFixed() : "0",
    remainingInterest: remainingInterest.gt(0) ? remainingInterest.toFixed() : "0",
    remainingFee: paidFee.lt(0) ? paidFee.abs().toFixed() : "0",
    remainingPenalty: paidPen.lt(0) ? paidPen.abs().toFixed() : "0",
    status: loan.status,
  };
}
