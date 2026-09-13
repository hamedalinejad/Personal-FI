import { openDb } from "../persistence/port.js";

/** Book-level reporting base currency (GAP-029 partial). */
export function getBookBaseCurrency(dataDir, fallback = null) {
  const db = openDb(dataDir);
  try {
    const row = db.prepare(`SELECT value FROM db_meta WHERE key = 'book_base_currency'`).get();
    return row?.value || fallback;
  } catch {
    return fallback;
  }
}

export function setBookBaseCurrency(db, code) {
  if (!code) throw new Error("BOOK_BASE_REQUIRED");
  db.prepare(
    `INSERT INTO db_meta (key, value) VALUES ('book_base_currency', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(code);
  return code;
}
