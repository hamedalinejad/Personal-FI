/**
 * Browser adapter must implement the same surface as Node persistence port:
 * openDb, persistOperation, loadOperation, closeAllDbs
 * Durable ACK only after IndexedDB commit succeeds.
 */
export const BROWSER_ADAPTER_STATUS = "NOT_IMPLEMENTED";
