import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import { openDb } from "../../../core/persistence/port.js";
import { latestSchedule } from "../ledger/scheduleRepository.js";
import { getLoanById } from "../ledger/loanRepository.js";
import { parseScheduleSnapshot } from "./scheduleSnapshot.js";
import { listFees } from "../ledger/feeRepository.js";

/**
 * LOAN-005 — component residuals reconstructable without paid boolean flags.
 * principalOutstanding, interestOutstanding, feeOutstanding, penaltyOutstanding
 */
export function computeRemaining(loanId, dataDir) {
  const loan = getLoanById(dataDir, loanId);
  if (!loan) throw new Error("LOAN_NOT_FOUND");
  const schedule = latestSchedule(dataDir, loanId);
  let schedPrin = toDecimal("0");
  let schedInt = toDecimal("0");
  if (schedule?.snapshot_json) {
    const parsed = parseScheduleSnapshot(schedule.snapshot_json);
    for (const row of parsed.rows) {
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
  let paidPenalty = toDecimal("0");
  for (const t of txs) {
    const sign = t.tx_type === "reversal" ? -1 : 1;
    paidPrin = paidPrin.plus(toDecimal(t.principal_portion || "0").times(sign));
    paidInt = paidInt.plus(toDecimal(t.interest_portion || "0").times(sign));
    paidFee = paidFee.plus(toDecimal(t.fee_portion || "0").times(sign));
    paidPenalty = paidPenalty.plus(toDecimal(t.penalty_portion || "0").times(sign));
  }

  let feeDue = toDecimal("0");
  try {
    for (const f of listFees(dataDir, loanId)) {
      feeDue = feeDue
        .plus(toDecimal(f.amount_due || "0"))
        .minus(toDecimal(f.amount_paid || "0"))
        .minus(toDecimal(f.amount_waived || "0"));
    }
  } catch {
    /* empty */
  }

  const principalOutstanding = schedPrin.minus(paidPrin);
  const interestOutstanding = schedInt.minus(paidInt);
  const feeOutstanding = feeDue.gt(0) ? feeDue : toDecimal("0").minus(paidFee).gt(0) ? toDecimal("0") : paidFee.neg();
  // Prefer fee ledger residual when present
  let feeOut = feeDue;
  if (feeOut.lt(0)) feeOut = toDecimal("0");
  const penaltyOutstanding = paidPenalty.lt(0) ? paidPenalty.abs() : toDecimal("0");
  // penalties: outstanding = accrued unpaid — v1 track via negative paid only if accrual txs exist
  // For v1: penaltyOutstanding = sum penalty due rows if any — else max(0, -net paid penalty)
  let penOut = toDecimal("0");
  for (const t of txs) {
    if (t.tx_type === "penalty") penOut = penOut.plus(toDecimal(t.penalty_portion || t.amount || "0"));
  }
  penOut = penOut.minus(paidPenalty);
  if (penOut.lt(0)) penOut = toDecimal("0");

  return {
    principalOutstanding: principalOutstanding.gt(0) ? principalOutstanding.toFixed() : "0",
    interestOutstanding: interestOutstanding.gt(0) ? interestOutstanding.toFixed() : "0",
    feeOutstanding: feeOut.toFixed(),
    penaltyOutstanding: penOut.toFixed(),
    // aliases
    remainingPrincipal: principalOutstanding.gt(0) ? principalOutstanding.toFixed() : "0",
    remainingInterest: interestOutstanding.gt(0) ? interestOutstanding.toFixed() : "0",
    remainingFee: feeOut.toFixed(),
    remainingPenalty: penOut.toFixed(),
    status: loan.status,
  };
}
