/**
 * book.create — durable book metadata (immutable id + created_at).
 */
import { assertDbPassed } from "../../_shared/atomicDb.js";
import { createOrOpenBook, getBookMeta } from "../../../application/bootstrap/createBook.js";

export async function createBook({ db, payload }) {
  assertDbPassed(db, "book.create");
  const body = payload?.payload || payload || {};
  const name = body.name || body.bookName || "Personal Book";
  const baseCurrency = body.baseCurrency || "IRR";
  const meta = await createOrOpenBook(db, {
    name,
    baseCurrency,
    bookId: body.bookId,
  });
  return {
    success: true,
    data: meta,
    invalidated: ["meta.book", "book.get", "accounts.list"],
  };
}

export async function getBook({ db }) {
  assertDbPassed(db, "book.get");
  const meta = getBookMeta(db);
  return { success: true, data: meta };
}
