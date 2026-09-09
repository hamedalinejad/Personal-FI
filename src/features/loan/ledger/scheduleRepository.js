import { randomUUID } from "node:crypto";
import { openDb } from "../../../core/persistence/port.js";

export function insertScheduleSnapshot(dataDir, { loanId, version, rows, effectiveFrom, operationId }) {
  const db = openDb(dataDir);
  db.prepare(
    `INSERT INTO ln_schedule_snapshots (id, loan_id, version, snapshot_json, effective_from, operation_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(randomUUID(), loanId, version, JSON.stringify(rows), effectiveFrom, operationId);
}

export function latestSchedule(dataDir, loanId) {
  const db = openDb(dataDir);
  return db
    .prepare(`SELECT * FROM ln_schedule_snapshots WHERE loan_id = ? ORDER BY version DESC LIMIT 1`)
    .get(loanId);
}
