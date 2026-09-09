import { openDb } from "../../../core/persistence/worker.js";

export function getSchedule(loanId, { dataDir }) {
  const db = openDb(dataDir);
  const snap = db
    .prepare(
      `SELECT * FROM ln_schedule_snapshots WHERE loan_id = ? ORDER BY version DESC LIMIT 1`,
    )
    .get(loanId);
  if (!snap) return null;
  return {
    version: snap.version,
    rows: snap.snapshot_json ? JSON.parse(snap.snapshot_json) : null,
  };
}
