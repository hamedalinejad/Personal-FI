import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "./operationEngine.js";
import { closeAllDbs } from "../../persistence/worker.js";

function baseOp(dataDir, extra = {}) {
  return {
    operationId: extra.operationId || randomUUID(),
    type: "idem.test",
    status: "posted",
    businessDate: "2026-03-01",
    baseCurrency: "IRR",
    dataDir,
    persistMode: "sqlite",
    engineVersions: { money: "1.0.0" },
    source: "api",
    journalLines: extra.journalLines || [
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
        amount: "100",
        currency: "IRR",
        amountInBase: "100",
        exchangeRateToBase: "1",
      },
    ],
    withinTransaction(db) {
      const now = new Date().toISOString();
      for (const id of ["a1", "a2"]) {
        db.prepare(
          `INSERT OR IGNORE INTO fin_accounts (id, name, account_kind, currency, is_archived, created_at, updated_at, status)
           VALUES (?,?,?,?,0,?,?, 'active')`,
        ).run(id, id, id === "a1" ? "asset" : "equity", "IRR", now, now);
      }
    },
    ...extra,
  };
}

test("same operationId + same economics → idempotent replay", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-idem-"));
  const opId = randomUUID();
  const r1 = await runAtomicFinancialOperation(baseOp(dataDir, { operationId: opId }));
  const r2 = await runAtomicFinancialOperation(baseOp(dataDir, { operationId: opId }));
  assert.equal(r2.idempotentReplay, true);
  assert.equal(r1.commandHash, r2.commandHash);
  closeAllDbs();
});

test("same operationId + different economics → conflict", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-idemc-"));
  const opId = randomUUID();
  await runAtomicFinancialOperation(baseOp(dataDir, { operationId: opId }));
  await assert.rejects(
    () =>
      runAtomicFinancialOperation(
        baseOp(dataDir, {
          operationId: opId,
          journalLines: [
            {
              accountId: "a1",
              side: "debit",
              amount: "200",
              currency: "IRR",
              amountInBase: "200",
              exchangeRateToBase: "1",
            },
            {
              accountId: "a2",
              side: "credit",
              amount: "200",
              currency: "IRR",
              amountInBase: "200",
              exchangeRateToBase: "1",
            },
          ],
        }),
      ),
    /OP_IDEMPOTENCY_CONFLICT/,
  );
  closeAllDbs();
});
