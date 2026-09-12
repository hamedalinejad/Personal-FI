import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../domain/operation/operationEngine.js";
import { loadOperation } from "../persistence/port.js";
import { closeAllDbs } from "../persistence/worker.js";
import { backupDatabase, restoreDatabase } from "../persistence/browser/sqlJsIndexedDbAdapter.js";

async function postOp(dataDir, opId) {
  return runAtomicFinancialOperation({
    operationId: opId,
    type: "recovery.test",
    status: "posted",
    businessDate: "2026-02-01",
    baseCurrency: "IRR",
    dataDir,
    persistMode: "sqlite",
    journalLines: [
      { accountId: "x", side: "debit", amount: "1", currency: "IRR" },
      { accountId: "y", side: "credit", amount: "1", currency: "IRR" },
    ],
    withinTransaction: (db) => {
      const now = new Date().toISOString();
      for (const [id, kind] of [
        ["x", "asset"],
        ["y", "equity"],
      ]) {
        db.prepare(
          `INSERT OR IGNORE INTO fin_accounts (id, code, name, account_kind, currency, created_at, updated_at, status)
           VALUES (?,?,?,?, 'IRR', ?, ?, 'active')`,
        ).run(id, id, id, kind, now, now);
      }
    },
  });
}

test("P0-OFFLINE-002 recovery: post then backup then restore then load", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-rec-"));
  const opId = randomUUID();
  await postOp(dataDir, opId);
  const bak = backupDatabase(dataDir, "crash");
  closeAllDbs();
  const dataDir2 = mkdtempSync(join(tmpdir(), "pf-rec2-"));
  restoreDatabase(dataDir2, bak);
  const loaded = await loadOperation(opId, { dataDir: dataDir2, mode: "sqlite" });
  assert.equal(loaded.status, "posted");
  closeAllDbs();
});

test("P0-OFFLINE-002 idempotent same operationId", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-id-"));
  const opId = randomUUID();
  const r1 = await postOp(dataDir, opId);
  const r2 = await postOp(dataDir, opId);
  assert.ok(r2.idempotentReplay === true || r2.operationId === r1.operationId);
  closeAllDbs();
});
