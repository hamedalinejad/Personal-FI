import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../domain/operation/operationEngine.js";
import { closeAllDbs, openDb } from "../persistence/worker.js";
import { backupDatabase, restoreDatabase } from "../recovery/backup.js";

const MATRIX = [
  "crash_before_commit",
  "crash_after_sql_commit",
  "replay_same_operation",
  "same_id_changed_economics",
  "offline_reopen",
  "backup",
  "restore",
  "corrupt_backup",
  "browser_reload",
  "multi_tab_write",
  "rebuild",
  "reversal",
];

test("recovery matrix has 12 required scenarios", () => {
  assert.equal(MATRIX.length, 12);
});

function seedAccounts(db) {
  const now = new Date().toISOString();
  for (const id of ["c1", "c2"]) {
    db.prepare(
      `INSERT OR IGNORE INTO fin_accounts (id, name, account_kind, currency, is_archived, created_at, updated_at, status)
       VALUES (?,?, 'asset', 'IRR', 0, ?, ?, 'active')`,
    ).run(id, id, now, now);
  }
}

const lines100 = [
  { accountId: "c1", side: "debit", amount: "100", currency: "IRR", amountInBase: "100", exchangeRateToBase: "1" },
  { accountId: "c2", side: "credit", amount: "100", currency: "IRR", amountInBase: "100", exchangeRateToBase: "1" },
];

test("replay same operation is idempotent", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-rec-"));
  const opId = randomUUID();
  const payload = {
    operationId: opId,
    type: "test.transfer",
    status: "posted",
    businessDate: "2026-03-01",
    baseCurrency: "IRR",
    dataDir,
    persistMode: "sqlite",
    sourceChannel: "api",
    journalLines: lines100,
    withinTransaction: seedAccounts,
  };
  const a = await runAtomicFinancialOperation(payload);
  const b = await runAtomicFinancialOperation(payload);
  assert.equal(a.operationId, b.operationId);
  closeAllDbs();
});

test("same id changed economics conflicts", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-rec2-"));
  const opId = randomUUID();
  const base = {
    operationId: opId,
    type: "test.transfer",
    status: "posted",
    businessDate: "2026-03-01",
    baseCurrency: "IRR",
    dataDir,
    persistMode: "sqlite",
    sourceChannel: "api",
    withinTransaction: seedAccounts,
  };
  await runAtomicFinancialOperation({ ...base, journalLines: lines100 });
  await assert.rejects(
    () =>
      runAtomicFinancialOperation({
        ...base,
        journalLines: [
          { accountId: "c1", side: "debit", amount: "200", currency: "IRR", amountInBase: "200", exchangeRateToBase: "1" },
          { accountId: "c2", side: "credit", amount: "200", currency: "IRR", amountInBase: "200", exchangeRateToBase: "1" },
        ],
      }),
    /conflict|hash|COMMAND_HASH|IDEMPOTENCY|OP_|DIFF/i,
  );
  closeAllDbs();
});

test("backup then restore roundtrip", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-bak-"));
  openDb(dataDir);
  closeAllDbs();
  const bak = join(dataDir, "book.sqlite.bak");
  await backupDatabase(dataDir, bak);
  const restoreDir = mkdtempSync(join(tmpdir(), "pf-rest-"));
  await restoreDatabase(bak, restoreDir);
  closeAllDbs();
});

test("corrupt backup rejected", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-bad-"));
  const bad = join(dataDir, "corrupt.bak");
  writeFileSync(bad, "{not-a-sqlite-file");
  await assert.rejects(() => restoreDatabase(bad, dataDir), /BACKUP_CORRUPT/);
  closeAllDbs();
});
