/**
 * Browser SQL adapter: wraps a sql.js Database instance with
 * transactional helpers, export/import bytes, and schema init.
 * Does NOT import Node modules. Expects SQL.Database from sql.js.
 */

import { saveDbBytes, loadDbBytes } from "./idbByteStore.js";
import { acquireWriteLock } from "./singleWriter.js";

/**
 * @typedef {object} SqlJsDatabase
 * @property {(sql: string) => void} run
 * @property {(sql: string, params?: any[]) => any} exec
 * @property {(sql: string) => any} prepare
 * @property {() => Uint8Array} export
 * @property {(sql: string) => void} exec
 * @property {() => void} close
 */

/**
 * Apply canonical schema to an empty or existing db.
 * @param {SqlJsDatabase} db
 * @param {string} schemaSql
 */
export function applySchema(db, schemaSql) {
  db.run(schemaSql);
}

/**
 * @param {SqlJsDatabase} db
 * @param {string} key
 * @returns {string|null}
 */
export function getMeta(db, key) {
  const stmt = db.prepare("SELECT value FROM db_meta WHERE key = ?");
  stmt.bind([key]);
  let value = null;
  if (stmt.step()) {
    const row = stmt.getAsObject();
    value = row.value ?? null;
  }
  stmt.free();
  return value;
}

/**
 * @param {SqlJsDatabase} db
 * @param {string} key
 * @param {string} value
 */
export function setMeta(db, key, value) {
  db.run("INSERT OR REPLACE INTO db_meta(key, value) VALUES (?, ?)", [key, value]);
}

/**
 * Ensure book identity and base currency exist.
 * @param {SqlJsDatabase} db
 * @param {{ bookId?: string, baseCurrency?: string }} opts
 */
export function ensureBookMeta(db, opts = {}) {
  const existingId = getMeta(db, "book_id");
  const existingCcy = getMeta(db, "book_base_currency");
  if (!existingId) {
    const id =
      opts.bookId ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `book-${Date.now()}`);
    setMeta(db, "book_id", id);
  }
  if (!existingCcy) {
    const ccy = opts.baseCurrency || "IRR";
    if (typeof ccy !== "string" || !/^[A-Z]{3}$/.test(ccy)) {
      throw new Error("BOOK_BASE_CURRENCY_INVALID");
    }
    setMeta(db, "book_base_currency", ccy);
  }
  if (!getMeta(db, "schemaVersion")) {
    setMeta(db, "schemaVersion", "1");
  }
}

/**
 * Persist current db bytes to IndexedDB under write lock.
 * @param {SqlJsDatabase} db
 * @returns {Promise<{ durable: true, bookId: string|null }>}
 */
export async function durablePersist(db) {
  const release = await acquireWriteLock();
  try {
    const bytes = db.export();
    const bookId = getMeta(db, "book_id");
    const schemaVersion = getMeta(db, "schemaVersion") || "1";
    await saveDbBytes(bytes, { bookId, schemaVersion });
    return { durable: true, bookId };
  } finally {
    await release();
  }
}

/**
 * Load bytes from IDB and create a sql.js Database.
 * @param {{ SQL: any, schemaSql: string, createIfMissing?: boolean, baseCurrency?: string }} opts
 * @returns {Promise<{ db: SqlJsDatabase, created: boolean, bookId: string|null }>}
 */
export async function openOrCreateBrowserDb(opts) {
  const { SQL, schemaSql, createIfMissing = true, baseCurrency = "IRR" } = opts;
  if (!SQL || typeof SQL.Database !== "function") {
    throw new Error("SQLJS_RUNTIME_MISSING");
  }

  const { bytes, meta } = await loadDbBytes();
  let db;
  let created = false;

  if (bytes && bytes.byteLength > 0) {
    db = new SQL.Database(new Uint8Array(bytes));
  } else if (createIfMissing) {
    db = new SQL.Database();
    applySchema(db, schemaSql);
    ensureBookMeta(db, { baseCurrency });
    created = true;
    await durablePersist(db);
  } else {
    throw new Error("DB_NOT_FOUND");
  }

  // Re-ensure meta on existing DBs (migration-safe)
  ensureBookMeta(db, { baseCurrency: getMeta(db, "book_base_currency") || baseCurrency });
  const bookId = getMeta(db, "book_id");
  return { db, created, bookId, meta };
}

/**
 * Run a function inside an immediate SQLite transaction.
 * On success, optionally durable-persist.
 * @param {SqlJsDatabase} db
 * @param {(db: SqlJsDatabase) => any} fn
 * @param {{ persist?: boolean }} [opts]
 */
export async function withImmediateTransaction(db, fn, opts = {}) {
  db.run("BEGIN IMMEDIATE");
  try {
    const result = await fn(db);
    db.run("COMMIT");
    if (opts.persist !== false) {
      await durablePersist(db);
    }
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
 * Simple query helper returning array of row objects.
 * @param {SqlJsDatabase} db
 * @param {string} sql
 * @param {any[]} [params]
 */
export function queryAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/**
 * @param {SqlJsDatabase} db
 * @param {string} sql
 * @param {any[]} [params]
 */
export function queryOne(db, sql, params = []) {
  const rows = queryAll(db, sql, params);
  return rows[0] || null;
}
