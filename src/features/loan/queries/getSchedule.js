import { latestSchedule } from "../ledger/scheduleRepository.js";

export function getSchedule(loanId, { dataDir }) {
  const snap = latestSchedule(dataDir, loanId);
  if (!snap) return null;
  return { version: snap.version, rows: JSON.parse(snap.snapshot_json) };
}
