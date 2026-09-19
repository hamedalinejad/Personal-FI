import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../domain/operation/operationEngine.js";
import {
  closeAllDbs,
  openDb,
  markOperationPersisted,
  reconcileDurabilityState,
} from "./worker.js";
import { loadOperation } from "./port.js";
import { validateOpenDatabase } from "./integrity.js";

function seed(db) {
  const now = new Date().toISOString();
  for (const [id, kind] of [["cash:p3", "asset"], ["equity:p3", "equity"]]) {
    db.prepare(
      `INSERT OR IGNORE INTO fin_accounts
       (id, name, account_kind, currency, is_archived, created_at, updated_at, status)
       VALUES (?,?,?,?,0,?,?, 'active')`,
    ).run(id, id, kind, "IRR", now, now);
  }
}

async function post(dataDir, amount = "100") {
  const operationId = randomUUID();
  await runAtomicFinancialOperation({
    operationId,
    type: "phase3.integrity",
    status: "posted",
    businessDate: "2026-08-01",
    baseCurrency: "IRR",
    dataDir,
    persistMode: "sqlite",
    journalLines: [
      { accountId: "cash:p3", side: "debit", amount, currency: "IRR", amountInBase: amount, exchangeRateToBase: "1" },
      { accountId: "equity:p3", side: "credit", amount, currency: "IRR", amountInBase: amount, exchangeRateToBase: "1" },
    ],
    withinTransaction: seed,
  });
  return operationId;
}

test("clean database passes full persistence integrity validation", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-integrity-"));
  await post(dataDir);
  const db = openDb(dataDir);
  const result = validateOpenDatabase(db);
  assert.equal(result.ok, true);
  assert.equal(result.postedOperations, 1);
  closeAllDbs();
});

test("sql_committed can be acknowledged as persisted", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-durable-"));
  const operationId = await post(dataDir);
  const before = await loadOperation(operationId, { dataDir, mode: "sqlite" });
  assert.equal(before.durability_state, "sql_committed");
  const marked = markOperationPersisted(dataDir, operationId);
  assert.equal(marked.durability_state, "persisted");
  const after = await loadOperation(operationId, { dataDir, mode: "sqlite" });
  assert.equal(after.durability_state, "persisted");
  closeAllDbs();
});

test("reconcile promotes surviving sql_committed operations after restart", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-reconcile-"));
  const operationId = await post(dataDir);
  const db = openDb(dataDir);
  db.prepare("UPDATE fin_operations SET durability_state='sql_committed' WHERE id=?").run(operationId);
  closeAllDbs();
  const result = reconcileDurabilityState(dataDir);
  assert.deepEqual(result.promoted, [operationId]);
  const loaded = await loadOperation(operationId, { dataDir, mode: "sqlite" });
  assert.equal(loaded.durability_state, "persisted");
  closeAllDbs();
});

test("reconcile refuses a database whose posted journal is corrupted", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-corrupt-journal-"));
  const operationId = await post(dataDir);
  const db = openDb(dataDir);
  db.prepare(
    `UPDATE fin_journal_lines
     SET amount_in_base='101'
     WHERE entry_id = (SELECT id FROM fin_journal_entries WHERE operation_id = ?)
       AND side='debit'`,
  ).run(operationId);
  db.prepare("UPDATE fin_operations SET durability_state='sql_committed' WHERE id=?").run(operationId);
  closeAllDbs();
  assert.throws(() => reconcileDurabilityState(dataDir), /\/DB_INTEGRITY|INV_JOURNAL|DB_/);
  closeAllDbs();
});
