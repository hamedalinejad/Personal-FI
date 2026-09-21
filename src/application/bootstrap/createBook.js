/**
<<<<<<< HEAD
 * Create / open book identity — immutable metadata in db_meta (BUG-P1-14).
 * UI must never fabricate book_id or created_at.
 */

import {
  ensureBookMeta,
  getMeta,
  setMeta,
  durablePersist,
} from "../../core/persistence/browser/browserSqlAdapter.js";

/**
 * @param {any} db
 * @param {{ baseCurrency?: string, bookId?: string, name?: string }} opts
 */
export async function createOrOpenBook(db, opts = {}) {
  const baseCurrency = opts.baseCurrency || "IRR";
  if (!/^[A-Z]{3}$/.test(baseCurrency)) {
    throw new Error("BOOK_BASE_CURRENCY_INVALID");
  }

  ensureBookMeta(db, { baseCurrency, bookId: opts.bookId });

  if (!getMeta(db, "book_created_at")) {
    setMeta(db, "book_created_at", new Date().toISOString());
  }

  if (opts.name && typeof opts.name === "string" && opts.name.trim()) {
    setMeta(db, "book_name", opts.name.trim());
  } else if (!getMeta(db, "book_name")) {
    setMeta(db, "book_name", "Personal Book");
  }

  await durablePersist(db);
  return getBookMeta(db);
}

/**
 * Read persisted book metadata only — never fabricate.
 * @param {any} db
 */
export function getBookMeta(db) {
  const bookId = getMeta(db, "book_id");
  if (!bookId) return null;
  return {
    id: bookId,
    name: getMeta(db, "book_name") || "Personal Book",
    baseCurrency: getMeta(db, "book_base_currency") || "IRR",
    createdAt: getMeta(db, "book_created_at") || null,
    schemaVersion: getMeta(db, "schemaVersion") || "1",
  };
}

export { getMeta, setMeta, ensureBookMeta };
=======
 * Book bootstrap — sets book_base_currency; no silent change after posted ops.
 */
import { openDb } from "../../core/persistence/port.js";
import { setBookBaseCurrency, getBookBaseCurrency } from "../../core/accounting/bookSettings.js";

/**
 * @param {{ name: string, baseCurrency: string }} input
 * @param {{ dataDir: string }} ctx
 */
export function createBook(input, { dataDir } = {}) {
  if (!dataDir) throw new Error("DATA_DIR_REQUIRED");
  const name = String(input?.name || "").trim();
  const baseCurrency = String(input?.baseCurrency || "").trim().toUpperCase();
  if (!name) throw new Error("VALIDATION_ERROR:name");
  if (!baseCurrency || baseCurrency.length < 3) throw new Error("VALIDATION_ERROR:baseCurrency");

  const db = openDb(dataDir);
  setBookBaseCurrency(db, baseCurrency);
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO db_meta (key, value) VALUES ('book.name', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(name);
  db.prepare(
    `INSERT INTO db_meta (key, value) VALUES ('book.created_at', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(now);

  return {
    name,
    baseCurrency: getBookBaseCurrency(dataDir),
    createdAt: now,
  };
}

export function getBookInfo({ dataDir } = {}) {
  if (!dataDir) throw new Error("DATA_DIR_REQUIRED");
  const db = openDb(dataDir);
  const nameRow = db.prepare(`SELECT value FROM db_meta WHERE key = 'book.name'`).get();
  return {
    name: nameRow?.value || null,
    baseCurrency: getBookBaseCurrency(dataDir),
  };
}
>>>>>>> origin/main
