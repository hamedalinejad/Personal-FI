import { latestSchedule } from "../ledger/scheduleRepository.js";

export function getSchedule(loanId, { dataDir }) {
  const snap = latestSchedule(dataDir, loanId);
  if (!snap) return null;
  const parsed = JSON.parse(snap.snapshot_json);
  // Support both legacy rows array and v1 envelope
  if (Array.isArray(parsed)) {
    return { version: snap.version, installments: parsed, rows: parsed };
  }
  return {
    version: snap.version,
    ...parsed,
    rows: parsed.installments || parsed.rows || [],
  };
}
