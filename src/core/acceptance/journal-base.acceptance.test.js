import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../domain/operation/operationEngine.js";
import { closeAllDbs } from "../persistence/worker.js";
import { assertJournalBalanced } from "../domain/invariants/index.js";

test("P0-009: multi-currency without amountInBase rejected", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-base-"));
  await assert.rejects(
    () =>
      runAtomicFinancialOperation({
        operationId: randomUUID(),
        type: "fx.missing",
        status: "posted",
        businessDate: "2026-03-01",
        baseCurrency: "IRR",
        dataDir,
        persistMode: "sqlite",
        source: "api",
        journalLines: [
          { accountId: "a1", side: "debit", amount: "10", currency: "USD" },
          { accountId: "a2", side: "credit", amount: "10", currency: "EUR" },
        ],
        withinTransaction(db) {
          const now = new Date().toISOString();
          for (const [id, c] of [
            ["a1", "USD"],
            ["a2", "EUR"],
          ]) {
            db.prepare(
              `INSERT OR IGNORE INTO fin_accounts (id, name, account_kind, currency, is_archived, created_at, updated_at, status)
               VALUES (?,?, 'asset', ?, 0, ?, ?, 'active')`,
            ).run(id, id, c, now, now);
          }
        },
      }),
    /INV_JOURNAL_MULTI_CURRENCY_REQUIRES_BASE|AMOUNT_IN_BASE|amountInBase/i,
  );
  closeAllDbs();
});

test("P0-009: amountInBase balance required when present", () => {
  assert.throws(
    () =>
      assertJournalBalanced([
        { side: "debit", amount: "10", currency: "USD", amountInBase: "100" },
        { side: "credit", amount: "10", currency: "USD", amountInBase: "90" },
      ]),
    /INV_JOURNAL_UNBALANCED/,
  );
});
