import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../domain/operation/operationEngine.js";
import { openDb, closeAllDbs } from "../persistence/worker.js";
import { assertNoPostedJournalCurrencyMismatch } from "./postedJournalCurrencyScan.js";
import { assertCanArchiveFinAccount } from "./archivedZeroBalance.js";

test("P0-OP-011 integrity scan clean after valid post", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-int-"));
  await runAtomicFinancialOperation({
    operationId: randomUUID(),
    type: "test",
    status: "posted",
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    dataDir,
    persistMode: "sqlite",
    journalLines: [
      { accountId: "a", side: "debit", amount: "10", currency: "IRR" },
      { accountId: "b", side: "credit", amount: "10", currency: "IRR" },
    ],
    withinTransaction: (db) => {
      const now = new Date().toISOString();
      for (const [id, kind] of [
        ["a", "asset"],
        ["b", "equity"],
      ]) {
        db.prepare(
          `INSERT OR IGNORE INTO fin_accounts (id, code, name, account_kind, currency, created_at, updated_at, status)
           VALUES (?,?,?,?, 'IRR', ?, ?, 'active')`,
        ).run(id, id, id, kind, now, now);
      }
    },
  });
  const db = openDb(dataDir);
  assertNoPostedJournalCurrencyMismatch(db);
  assert.throws(() => assertCanArchiveFinAccount(db, "a"), /ARCHIVE_NONZERO/);
  closeAllDbs();
});
