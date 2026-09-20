/**
 * Atomic DB helpers for feature commands.
 * Ensures only one transaction is open; features receive the already-open db.
 * Wave-2: no nested/open-second-DB write inside Core transaction callbacks.
 */

/**
 * @param {import("../../core/persistence/browser/browserSqlAdapter.js").SqlJsDatabase} db
 * @param {(db: any) => any} fn
 */
export function withImmediateTransaction(db, fn) {
  if (!db || typeof db.run !== "function") {
    throw new Error("DB_REQUIRED");
  }
  db.run("BEGIN IMMEDIATE");
  try {
    const result = fn(db);
    db.run("COMMIT");
    return result;
  } catch (err) {
    try {
      db.run("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw err;
  }
}

/**
 * Ensure a table/row helper that must only operate on the passed db.
 * Features must call ensure* on the transaction db, never open a new connection.
 */
export function assertDbPassed(db, context = "command") {
  if (!db || typeof db.run !== "function") {
    throw new Error(`DB_MUST_BE_PASSED:${context}`);
  }
}
