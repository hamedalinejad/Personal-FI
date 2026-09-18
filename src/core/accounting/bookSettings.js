import { openDb } from "../persistence/port.js";

/** Product default for local-first Iran book when db_meta not yet set. */
export const DEFAULT_BOOK_BASE_CURRENCY = "IRR";

/** Book-level reporting base currency. */
export function getBookBaseCurrency(dataDir, fallback = DEFAULT_BOOK_BASE_CURRENCY) {
  if (!dataDir) return fallback;
  try {
    const db = openDb(dataDir);
    const row = db.prepare(`SELECT value FROM db_meta WHERE key = 'book_base_currency'`).get();
    return row?.value || fallback;
  } catch {
    return fallback;
  }
}

/**
 * C0-POLICY-03: mutable only before first posted financial operation.
 * Display/UI currency may change independently — never call it book base.
 */
export function setBookBaseCurrency(db, code) {
  if (!code) throw new Error("BOOK_BASE_REQUIRED");
  const cur = db.prepare(`SELECT code FROM cur_currencies WHERE code = ?`).get(code);
  // Allow set when currencies table empty (bootstrap); reject unknown once table populated
  const anyCur = db.prepare(`SELECT 1 FROM cur_currencies LIMIT 1`).get();
  if (anyCur && !cur) throw new Error(`BOOK_BASE_UNKNOWN_CURRENCY:${code}`);

  const posted = db
    .prepare(`SELECT 1 FROM fin_operations WHERE status = 'posted' LIMIT 1`)
    .get();
  if (posted) {
    const existing = db.prepare(`SELECT value FROM db_meta WHERE key = 'book_base_currency'`).get();
    if (existing?.value && existing.value !== code) {
      throw new Error("BOOK_BASE_LOCKED:posted_operations_exist");
    }
  }

  db.prepare(
    `INSERT INTO db_meta (key, value) VALUES ('book_base_currency', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(code);
  return code;
}

/**
 * Resolve operation book base. Never silently uses transaction currency as book base.
 */
export function resolveBookBaseCurrency({
  dataDir,
  explicitBaseCurrency = null,
  transactionCurrency = null,
} = {}) {
  const book = getBookBaseCurrency(dataDir, DEFAULT_BOOK_BASE_CURRENCY);
  const explicit = explicitBaseCurrency || null;
  if (explicit) {
    if (explicit !== book) {
      throw new Error(`BOOK_BASE_MISMATCH:${explicit}!=${book}`);
    }
    return explicit;
  }
  return book;
}

/**
 * When transactionCurrency !== bookBase, FX rate is mandatory.
 */
export function requireFxIfCrossCurrency({
  transactionCurrency,
  baseCurrency,
  exchangeRateToBase,
}) {
  if (!transactionCurrency || !baseCurrency) {
    throw new Error("VALIDATION_ERROR:currency");
  }
  if (transactionCurrency === baseCurrency) {
    return "1";
  }
  if (exchangeRateToBase == null || exchangeRateToBase === "") {
    throw new Error("VALIDATION_ERROR:exchangeRateToBase");
  }
  return String(exchangeRateToBase);
}
