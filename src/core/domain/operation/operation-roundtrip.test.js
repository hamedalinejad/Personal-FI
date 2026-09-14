import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "./operationEngine.js";
import { loadOperation } from "../../persistence/port.js";

test("P0-OP-001/007 Gate-H settlementDate eventAt round-trip on columns", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-op-"));
  const opId = randomUUID();
  await runAtomicFinancialOperation({
    operationId: opId,
    type: "test.roundtrip",
    status: "posted",
    businessDate: "2026-06-01",
    baseCurrency: "IRR",
    settlementDate: "2026-06-03",
    eventAt: "2026-06-01T12:00:00.000Z",
    provenance: { channel: "gate-h" },
    dataDir,
    persistMode: "sqlite",
    journalLines: [
      { accountId: "cash:IRR", side: "debit", amount: "50", currency: "IRR" },
      { accountId: "eq:IRR", side: "credit", amount: "50", currency: "IRR" },
    ],
    withinTransaction: (db) => {
      const now = new Date().toISOString();
      db.prepare(
        `INSERT OR IGNORE INTO fin_accounts (id, code, name, account_kind, currency, created_at, updated_at, status)
         VALUES ('cash:IRR', 'cash:IRR', 'Cash', 'asset', 'IRR', ?, ?, 'active')`,
      ).run(now, now);
      db.prepare(
        `INSERT OR IGNORE INTO fin_accounts (id, code, name, account_kind, currency, created_at, updated_at, status)
         VALUES ('eq:IRR', 'eq:IRR', 'Equity', 'equity', 'IRR', ?, ?, 'active')`,
      ).run(now, now);
    },
  });
  const loaded = await loadOperation(opId, { dataDir, mode: "sqlite" });
  assert.equal(loaded.settlementDate, "2026-06-03");
  assert.equal(loaded.eventAt, "2026-06-01T12:00:00.000Z");
  assert.equal(loaded.status, "posted");
  assert.equal(loaded.journalLines.length, 2);
  assert.ok(loaded.journalLines.every((l) => l.amountInBase != null));
});

test("P0-OP-010 posted cross-currency without rate fails", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-fx-"));
  await assert.rejects(
    () =>
      runAtomicFinancialOperation({
        operationId: randomUUID(),
        type: "test.fx",
        status: "posted",
        businessDate: "2026-06-01",
        baseCurrency: "IRR",
        dataDir,
        persistMode: "sqlite",
        journalLines: [
          { accountId: "usd:USD", side: "debit", amount: "1", currency: "USD" },
          {
            accountId: "irr:IRR",
            side: "credit",
            amount: "42000",
            currency: "IRR",
            amountInBase: "42000",
            exchangeRateToBase: "1",
          },
        ],
        withinTransaction: (db) => {
          const now = new Date().toISOString();
          db.prepare(
            `INSERT OR IGNORE INTO fin_accounts (id, code, name, account_kind, currency, created_at, updated_at, status)
             VALUES ('usd:USD','u','u','asset','USD',?,?, 'active')`,
          ).run(now, now);
          db.prepare(
            `INSERT OR IGNORE INTO fin_accounts (id, code, name, account_kind, currency, created_at, updated_at, status)
             VALUES ('irr:IRR','i','i','asset','IRR',?,?, 'active')`,
          ).run(now, now);
        },
      }),
    /INV_JOURNAL_MISSING_AMOUNT_IN_BASE|INV_JOURNAL_MISSING_EXCHANGE_RATE|INV_JOURNAL_UNBALANCED/,
  );
});
