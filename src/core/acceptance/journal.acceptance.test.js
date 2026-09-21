import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../domain/operation/operationEngine.js";
import { closeAllDbs } from "../persistence/worker.js";
import { toDecimal } from "../money/canonicalDecimal.js";

test("B.journal: unbalanced journal rejected", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-j-"));
  await assert.rejects(
    () =>
      runAtomicFinancialOperation({
        operationId: randomUUID(),
        type: "j.unbal",
        status: "posted",
        businessDate: "2026-03-01",
        baseCurrency: "IRR",
        dataDir,
        persistMode: "sqlite",
        source: "api",
        journalLines: [
          {
            accountId: "a1",
            side: "debit",
            amount: "100",
            currency: "IRR",
            amountInBase: "100",
          },
          {
            accountId: "a2",
            side: "credit",
            amount: "50",
            currency: "IRR",
            amountInBase: "50",
          },
        ],
        withinTransaction(db) {
          const now = new Date().toISOString();
          for (const id of ["a1", "a2"]) {
            db.prepare(
              `INSERT OR IGNORE INTO fin_accounts (id, name, account_kind, currency, is_archived, created_at, updated_at, status)
               VALUES (?,?, 'asset', 'IRR', 0, ?, ?, 'active')`,
            ).run(id, id, now, now);
          }
        },
      }),
    /balance|unbalanced|JOURNAL|INV_/i,
  );
  closeAllDbs();
});

test("B.journal: debitBase equals creditBase by Decimal", () => {
  const d = toDecimal("100.10");
  const c = toDecimal("50.05").plus(toDecimal("50.05"));
  assert.ok(d.eq(c));
});
