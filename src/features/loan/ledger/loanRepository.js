import { openDb } from "../../../core/persistence/worker.js";

export function getLoanById(dataDir, id) {
  const db = openDb(dataDir);
  return db.prepare(`SELECT * FROM ln_loans WHERE id = ?`).get(id) || null;
}

export function listAllLoans(dataDir) {
  const db = openDb(dataDir);
  return db.prepare(`SELECT * FROM ln_loans ORDER BY created_at DESC`).all();
}
