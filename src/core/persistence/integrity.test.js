import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../domain/operation/operationEngine.js";
import {
  openDb,
  closeAllDbs,
  markOperationPersisted,
  reconcileDurabilityState,
  validateOpenDatabase,
} from "./worker.js";
import { ensureAccount } from "../accounting/chartOfAccounts.js";

async function postOp(dataDir, amount = "50") {
  const opId = randomUUID();
  await runAtomicFinancialOperation({
    operationId: opId,
    type: "phase3.test",
    status: "posted",
    businessDate: "2026-06-01",
    baseCurrency: "IRR",
    dataDir,
    persistMode: "sqlite",
    engineVersions: { money: "1.0.0" },
    journalLines: [
      {
        accountId: "c_p3",
        side: "debit",
        amount,
        currency: "IRR",
        amountInBase: amount,
        exchangeRateToBase: "1",
      },
      {
        accountId: "i_p3",
        side: "credit",
        amount,
        currency: "IRR",
        amountInBase: amount,
        exchangeRateToBase: "1",
      },
    ],
    withinTransaction(db) {
      ensureAccount(db, {
        id: "c_p3",
        name: "Cash",
        accountKind: "asset",
        currency: "IRR",
        systemRole: "cash",
      });
      ensureAccount(db, {
        id: "i_p3",
        name: "Income",
        accountKind: "income",
        currency: "IRR",
        systemRole: null,
      });
    },
  });
  return opId;
}

test("clean DB passes validateOpenDatabase", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-int-"));
  await postOp(dataDir);
  const db = openDb(dataDir);
  const r = validateOpenDatabase(db);
  assert.equal(r.ok, true);
  closeAllDbs();
});

test("markOperationPersisted: sql_committed → persisted; idempotent", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-ack-"));
  const opId = await postOp(dataDir);
  const db = openDb(dataDir);
  const before = db.prepare(`SELECT durability_state FROM fin_operations WHERE id = ?`).get(opId);
  assert.equal(before.durability_state, "sql_committed");
  closeAllDbs();
  const a = markOperationPersisted(dataDir, opId);
  assert.equal(a.durability_state, "persisted");
  assert.equal(a.idempotent, false);
  const b = markOperationPersisted(dataDir, opId);
  assert.equal(b.idempotent, true);
  closeAllDbs();
});

test("reconcileDurabilityState promotes sql_committed after validate", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-rec-"));
  const opId = await postOp(dataDir);
  const r = reconcileDurabilityState(dataDir);
  assert.ok(r.promoted.includes(opId));
  const db = openDb(dataDir);
  const row = db.prepare(`SELECT durability_state FROM fin_operations WHERE id = ?`).get(opId);
  assert.equal(row.durability_state, "persisted");
  closeAllDbs();
});

test("corrupt journal blocks validateOpenDatabase", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-bad-"));
  const opId = await postOp(dataDir);
  const db = openDb(dataDir);
  // delete one journal line to unbalance
  const entry = db.prepare(`SELECT id FROM fin_journal_entries WHERE operation_id = ?`).get(opId);
  const one = db.prepare(`SELECT rowid FROM fin_journal_lines WHERE entry_id = ? LIMIT 1`).get(entry.id);
  db.prepare(`DELETE FROM fin_journal_lines WHERE rowid = ?`).run(one.rowid);
  assert.throws(() => validateOpenDatabase(db), /DB_POSTED_JOURNAL_MIN_LINES|DB_JOURNAL_UNBALANCED|INV_/);
  closeAllDbs();
});

test("reconcile fails closed when integrity broken", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-recbad-"));
  const opId = await postOp(dataDir);
  const db = openDb(dataDir);
  const entry = db.prepare(`SELECT id FROM fin_journal_entries WHERE operation_id = ?`).get(opId);
  db.prepare(`DELETE FROM fin_journal_lines WHERE entry_id = ?`).run(entry.id);
  closeAllDbs();
  assert.throws(() => reconcileDurabilityState(dataDir), /DB_/);
  closeAllDbs();
});
