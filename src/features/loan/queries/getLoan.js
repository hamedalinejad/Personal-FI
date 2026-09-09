import { openDb } from "../../../core/persistence/worker.js";

export function getLoan(loanId, { dataDir }) {
  const db = openDb(dataDir);
  const row = db.prepare(`SELECT * FROM ln_loans WHERE id = ?`).get(loanId);
  if (!row) throw new Error("LOAN_NOT_FOUND");
  return row;
}

export function listLoans({ dataDir }) {
  const db = openDb(dataDir);
  return db.prepare(`SELECT * FROM ln_loans ORDER BY created_at DESC`).all();
}
