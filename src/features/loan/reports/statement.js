import { getLoanById } from "../ledger/loanRepository.js";
import { latestSchedule } from "../ledger/scheduleRepository.js";

export function getStatement(loanId, { dataDir }) {
  const loan = getLoanById(dataDir, loanId);
  if (!loan) throw new Error("LOAN_NOT_FOUND");
  const schedule = latestSchedule(dataDir, loanId);
  return {
    loan,
    schedule: schedule
      ? { version: schedule.version, rows: JSON.parse(schedule.snapshot_json) }
      : null,
  };
}
