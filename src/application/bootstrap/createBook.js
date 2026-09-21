/**
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
