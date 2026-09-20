/**
 * Create / open book identity.
 * Durable book_id in db_meta (P1-27).
 */

import { ensureBookMeta, getMeta, setMeta, durablePersist } from "../../core/persistence/browser/browserSqlAdapter.js";

/**
 * @param {any} db
 * @param {{ baseCurrency?: string, bookId?: string }} opts
 */
export async function createOrOpenBook(db, opts = {}) {
  const baseCurrency = opts.baseCurrency || "IRR";
  if (!/^[A-Z]{3}$/.test(baseCurrency)) {
    throw new Error("BOOK_BASE_CURRENCY_INVALID");
  }
  ensureBookMeta(db, { baseCurrency, bookId: opts.bookId });
  const bookId = getMeta(db, "book_id");
  const ccy = getMeta(db, "book_base_currency");
  await durablePersist(db);
  return { bookId, baseCurrency: ccy };
}

export { getMeta, setMeta };
