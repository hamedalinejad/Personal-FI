import { openDb } from "../../../core/persistence/port.js";

/**
 * Canonical read of ln_loan_fees — never silently invent emptiness when rows exist.
 * Ordering: business-relevant fee_kind, then id for determinism.
 */
export function listFees(dataDir, loanId) {
  if (!dataDir) throw new Error("DATA_DIR_REQUIRED");
  if (!loanId) throw new Error("LOAN_ID_REQUIRED");
  const db = openDb(dataDir);
  return db
    .prepare(
      `SELECT id, loan_id, fee_kind, amount_due, amount_paid, amount_waived, currency, fee_timing
       FROM ln_loan_fees
       WHERE loan_id = ?
       ORDER BY fee_kind ASC, id ASC`,
    )
    .all(loanId);
}

export function getFeeById(dataDir, feeId) {
  if (!dataDir || !feeId) throw new Error("FEE_LOOKUP_REQUIRED");
  const db = openDb(dataDir);
  return db.prepare(`SELECT * FROM ln_loan_fees WHERE id = ?`).get(feeId) || null;
}
