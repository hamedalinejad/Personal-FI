import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "./operationEngine.js";
import { closeAllDbs } from "../../persistence/worker.js";

test("unbalanced journal rejected before post", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-bal-"));
  await assert.rejects(
    () =>
      runAtomicFinancialOperation({
        operationId: randomUUID(),
        type: "bal.test",
        status: "posted",
        businessDate: "2026-01-01",
        baseCurrency: "IRR",
        dataDir,
        persistMode: "sqlite",
        journalLines: [
          {
            accountId: "a1",
            side: "debit",
            amount: "100",
            currency: "IRR",
            amountInBase: "100",
            exchangeRateToBase: "1",
          },
          {
            accountId: "a2",
            side: "credit",
            amount: "90",
            currency: "IRR",
            amountInBase: "90",
            exchangeRateToBase: "1",
          },
        ],
        withinTransaction(db) {
          const now = new Date().toISOString();
          for (const id of ["a1", "a2"]) {
            db.prepare(
              `INSERT OR IGNORE INTO fin_accounts (id, name, account_kind, currency, is_archived, created_at, updated_at, status)
               VALUES (?,?,?,?,0,?,?, 'active')`,
            ).run(id, id, "asset", "IRR", now, now);
          }
        },
      }),
    /BALANCE|UNBALANCED|JOURNAL/i,
  );
  closeAllDbs();
});
