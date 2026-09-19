import test from "node:test";
import assert from "node:assert/strict";
import { buildInverseJournalLines, assertReversalAllowed } from "./reversal.js";
import { reverseOperation, runAtomicFinancialOperation } from "./operationEngine.js";
import { openDb, closeAllDbs, loadOperation } from "../../persistence/port.js";
import { ensureAccount } from "../../accounting/chartOfAccounts.js";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { assertJournalBalanced } from "../invariants/index.js";

test("inverse journal flips sides and balances", () => {
  const original = [
    {
      accountId: "cash",
      side: "debit",
      amount: "100",
      currency: "IRR",
      amountInBase: "100",
      exchangeRateToBase: "1",
    },
    {
      accountId: "income",
      side: "credit",
      amount: "100",
      currency: "IRR",
      amountInBase: "100",
      exchangeRateToBase: "1",
    },
  ];
  const inv = buildInverseJournalLines(original);
  assert.equal(inv[0].side, "credit");
  assert.equal(inv[1].side, "debit");
  assertJournalBalanced(inv, { baseCurrency: "IRR", posted: true });
});

test("assertReversalAllowed requires posted", () => {
  assert.throws(() => assertReversalAllowed({ status: "draft" }), /REVERSAL_ORIGINAL_NOT_POSTED/);
  assert.doesNotThrow(() => assertReversalAllowed({ status: "posted" }));
});


test("full reversal persists as a new operation with inverse journal and linkage", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-reversal-"));
  const originalId = randomUUID();
  const reversalId = randomUUID();
  const ensure = (db) => {
    ensureAccount(db, { id: "cash:r", name: "Cash", accountKind: "asset", currency: "IRR", systemRole: "cash" });
    ensureAccount(db, { id: "income:r", name: "Income", accountKind: "income", currency: "IRR" });
  };
  await runAtomicFinancialOperation({
    operationId: originalId,
    type: "test.original",
    status: "posted",
    businessDate: "2026-07-01",
    baseCurrency: "IRR",
    dataDir,
    persistMode: "sqlite",
    journalLines: [
      { accountId: "cash:r", side: "debit", amount: "100", currency: "IRR", lineKind: "other" },
      { accountId: "income:r", side: "credit", amount: "100", currency: "IRR", lineKind: "other" },
    ],
    withinTransaction: ensure,
  });
  const reversed = await reverseOperation({
    originalOperationId: originalId,
    reversalOperationId: reversalId,
    dataDir,
    businessDate: "2026-07-02",
  });
  assert.equal(reversed.status, "posted");
  assert.equal(reversed.journalLines[0].side, "credit");
  assert.equal(reversed.journalLines[1].side, "debit");
  const loaded = await loadOperation(reversalId, { dataDir, mode: "sqlite" });
  assert.equal(loaded.reversesOperationId, originalId);
  assert.equal(loaded.status, "posted");
  assert.equal(loaded.journalLines[0].amount, "100");
  const db = openDb(dataDir);
  const links = db.prepare("SELECT reverses_operation_id FROM fin_operations WHERE id = ?").all(reversalId);
  assert.equal(links.length, 1);
  assert.equal(links[0].reverses_operation_id, originalId);
  const original = db.prepare("SELECT status FROM fin_operations WHERE id = ?").get(originalId);
  assert.equal(original.status, "posted");
  closeAllDbs();
});

test("second reversal of same original is rejected unless it replays same operation id", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-reversal-dup-"));
  const originalId = randomUUID();
  const reversalId = randomUUID();
  await runAtomicFinancialOperation({
    operationId: originalId,
    type: "test.original",
    status: "posted",
    businessDate: "2026-07-01",
    baseCurrency: "IRR",
    dataDir,
    persistMode: "sqlite",
    journalLines: [
      { accountId: "cash:dup", side: "debit", amount: "20", currency: "IRR" },
      { accountId: "income:dup", side: "credit", amount: "20", currency: "IRR" },
    ],
    withinTransaction(db) {
      ensureAccount(db, { id: "cash:dup", name: "Cash", accountKind: "asset", currency: "IRR", systemRole: "cash" });
      ensureAccount(db, { id: "income:dup", name: "Income", accountKind: "income", currency: "IRR" });
    },
  });
  await reverseOperation({ originalOperationId: originalId, reversalOperationId: reversalId, dataDir });
  await assert.rejects(
    () => reverseOperation({ originalOperationId: originalId, reversalOperationId: randomUUID(), dataDir }),
    /REVERSAL_ALREADY_EXISTS/,
  );
  const replay = await reverseOperation({ originalOperationId: originalId, reversalOperationId: reversalId, dataDir });
  assert.equal(replay.idempotentReplay, true);
  closeAllDbs();
});
