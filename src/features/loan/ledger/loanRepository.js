import { openDb } from "../../../core/persistence/worker.js";

export function insertLoan(dataDir, row) {
  const db = openDb(dataDir);
  db.prepare(
    `INSERT OR IGNORE INTO ln_loans (
      id, role, calculation_method, principal, currency, interest_rate, status, created_at, start_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.id,
    row.role || "borrowed",
    row.calculation_method,
    row.principal,
    row.currency,
    row.interest_rate || "0",
    row.status || "active",
    row.created_at,
    row.start_date,
  );
}

export function getLoanById(dataDir, id) {
  const db = openDb(dataDir);
  return db.prepare(`SELECT * FROM ln_loans WHERE id = ?`).get(id) || null;
}

export function listAllLoans(dataDir) {
  const db = openDb(dataDir);
  return db.prepare(`SELECT * FROM ln_loans ORDER BY created_at DESC`).all();
}
