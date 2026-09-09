import { getLoanById } from "../ledger/loanRepository.js";
import { latestSchedule } from "../ledger/scheduleRepository.js";
import { computeRemaining } from "../domain/remainingBalance.js";

export function getLoan(loanId, { dataDir }) {
  const row = getLoanById(dataDir, loanId);
  if (!row) throw new Error("LOAN_NOT_FOUND");
  const schedule = latestSchedule(dataDir, loanId);
  const remaining = computeRemaining(loanId, dataDir);
  return {
    ...row,
    scheduleVersion: schedule?.version ?? null,
    remaining,
  };
}
