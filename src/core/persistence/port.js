/**
 * Persistence port — product target may be SQLite-WASM + IDB in PWA.
 * Current Node runtime: node:sqlite via worker.js
 * Application code must depend on this port, not a concrete engine.
 */
export { persistOperation, loadOperation, openDb, closeAllDbs } from "./worker.js";
