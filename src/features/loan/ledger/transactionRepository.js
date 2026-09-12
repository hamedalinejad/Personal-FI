import { openDb } from "../../../core/persistence/port.js";

/**
 * ln_transactions is a **domain projection** of loan events.
 * Financial SoT remains fin_operations + fin_journal_*.
 * Writes happen only inside loan command withinTransaction — not via this module.
 */

export function listLoanTransactions(dataDir, loanId, { limit = 500, offset = 0 } = {}) {
  if (!dataDir) throw new Error("DATA_DIR_REQUIRED");
  if (!loanId) throw new Error("LOAN_ID_REQUIRED");
  const db = openDb(dataDir);
  return db
    .prepare(
      `SELECT * FROM ln_transactions
       WHERE loan_id = ?
       ORDER BY business_date ASC, created_at ASC, id ASC
       LIMIT ? OFFSET ?`,
    )
    .all(loanId, limit, offset);
}

export function getLoanTransactionById(dataDir, id) {
  if (!dataDir || !id) throw new Error("TX_LOOKUP_REQUIRED");
  const db = openDb(dataDir);
  return db.prepare(`SELECT * FROM ln_transactions WHERE id = ?`).get(id) || null;
}

export function listLoanTransactionsByOperation(dataDir, operationId) {
  if (!dataDir || !operationId) throw new Error("OP_LOOKUP_REQUIRED");
  const db = openDb(dataDir);
  return db
    .prepare(
      `SELECT * FROM ln_transactions WHERE operation_id = ? ORDER BY created_at ASC, id ASC`,
    )
    .all(operationId);
}

/** @deprecated Fake write removed — use loan commands. */
export function recordLoanTx() {
  throw new Error(
    "LOAN_TX_WRITE_VIA_COMMAND_ONLY: persist ln_transactions inside loan command withinTransaction",
  );
}
