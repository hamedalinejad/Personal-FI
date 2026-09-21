import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  resolveBookBaseCurrency,
  requireFxIfCrossCurrency,
  setBookBaseCurrency,
  getBookBaseCurrency,
  DEFAULT_BOOK_BASE_CURRENCY,
} from "./bookSettings.js";
import { openDb, closeAllDbs } from "../persistence/port.js";

test("P0-01 default book base is IRR not transaction currency", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-book-"));
  const base = resolveBookBaseCurrency({
    dataDir,
    transactionCurrency: "USD",
  });
  assert.equal(base, "IRR");
  assert.equal(DEFAULT_BOOK_BASE_CURRENCY, "IRR");
  closeAllDbs();
});

test("P0-01 USD txn requires FX; amountInBase pattern", () => {
  const rate = requireFxIfCrossCurrency({
    transactionCurrency: "USD",
    baseCurrency: "IRR",
    exchangeRateToBase: "50000",
  });
  assert.equal(rate, "50000");
  // 100 * 50000 = 5_000_000
  assert.equal(String(100 * 50000), "5000000");
  assert.throws(
    () =>
      requireFxIfCrossCurrency({
        transactionCurrency: "USD",
        baseCurrency: "IRR",
        exchangeRateToBase: null,
      }),
    /exchangeRateToBase/,
  );
});

test("P0-01 explicit mismatch with stored book fails", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-book2-"));
  const db = openDb(dataDir);
  setBookBaseCurrency(db, "IRR");
  assert.throws(
    () =>
      resolveBookBaseCurrency({
        dataDir,
        explicitBaseCurrency: "USD",
        transactionCurrency: "USD",
      }),
    /BOOK_BASE_MISMATCH/,
  );
  closeAllDbs();
});
