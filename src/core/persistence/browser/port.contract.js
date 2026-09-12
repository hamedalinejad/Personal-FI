/**
 * Browser adapter must implement the same surface as Node persistence port:
 * openDb, persistOperation, loadOperation, closeAllDbs, backupDatabase, restoreDatabase
 * Durable ACK only after durable commit succeeds (IndexedDB or harness publish).
 *
 * Status:
 * - Node harness: sqlJsIndexedDbAdapter.js (atomic file publish + markers)
 * - Production browser: same API over sql.js bytes in IndexedDB key pf-db-v1
 */
export const BROWSER_ADAPTER_STATUS = "HARNESS_PROVEN";
export const REQUIRED_METHODS = [
  "openDb",
  "persistOperation",
  "loadOperation",
  "closeAllDbs",
  "backupDatabase",
  "restoreDatabase",
];

export function assertAdapterContract(adapter) {
  for (const m of REQUIRED_METHODS) {
    if (typeof adapter[m] !== "function") {
      throw new Error(`ADAPTER_MISSING_METHOD:${m}`);
    }
  }
  return true;
}
