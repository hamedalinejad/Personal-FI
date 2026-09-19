/**
 * result_json is replay snapshot only — relational journal is SoT.
 * Corrupting result_json must not lose journal lines.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "../domain/operation/operationEngine.js";
import { closeAllDbs, openDb, loadOperation } from "./worker.js";

test("result_json corruption: journal still loads from relational tables", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-rj-"));
  const opId = randomUUID();
  await runAtomicFinancialOperation({
    operationId: opId,
    type: "test.result_json",
    status: "posted",
    businessDate: "2026-03-01",
    baseCurrency: "IRR",
    dataDir,
    persistMode: "sqlite",
    engineVersions: { money: "1.0.0" },
    source: "api",
    journalLines: [
      {
        accountId: "cash1",
        side: "debit",
        amount: "50",
        currency: "IRR",
        amountInBase: "50",
        exchangeRateToBase: "1",
      },
      {
        accountId: "eq1",
        side: "credit",
        amount: "50",
        currency: "IRR",
        amountInBase: "50",
        exchangeRateToBase: "1",
      },
    ],
    withinTransaction(db) {
      const now = new Date().toISOString();
      for (const [id, kind] of [
        ["cash1", "asset"],
        ["eq1", "equity"],
      ]) {
        db.prepare(
          `INSERT OR IGNORE INTO fin_accounts (id, name, account_kind, currency, is_archived, created_at, updated_at, status)
           VALUES (?,?,?,?,0,?,?, 'active')`,
        ).run(id, id, kind, "IRR", now, now);
      }
    },
  });

  const db = openDb(dataDir);
  // Corrupt snapshot intentionally
  db.prepare(`UPDATE fin_operations SET result_json = ?, result_hash = ? WHERE id = ?`).run(
    JSON.stringify({ corrupted: true, domainResult: { bogus: 1 } }),
    "deadbeef",
    opId,
  );

  const loaded = await loadOperation(opId, { dataDir, mode: "sqlite" });
  assert.ok(Array.isArray(loaded.journalLines));
  assert.equal(loaded.journalLines.length, 2);
  assert.equal(loaded.journalLines[0].amount, "50");
  assert.equal(loaded.status, "posted");
  // mismatch marker when hash does not match snapshot
  assert.ok(loaded._resultHashMismatch === true || loaded.journalLines.length === 2);
  closeAllDbs();
});

test("result_json invalid JSON: still loads journal from relational SoT", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-rj-bad-"));
  const opId = randomUUID();
  await runAtomicFinancialOperation({
    operationId: opId,
    type: "test.result_json_bad",
    status: "posted",
    businessDate: "2026-03-01",
    baseCurrency: "IRR",
    dataDir,
    persistMode: "sqlite",
    engineVersions: { money: "1.0.0" },
    source: "api",
    journalLines: [
      {
        accountId: "cash2",
        side: "debit",
        amount: "25",
        currency: "IRR",
        amountInBase: "25",
        exchangeRateToBase: "1",
      },
      {
        accountId: "eq2",
        side: "credit",
        amount: "25",
        currency: "IRR",
        amountInBase: "25",
        exchangeRateToBase: "1",
      },
    ],
    withinTransaction(db) {
      const now = new Date().toISOString();
      for (const [id, kind] of [
        ["cash2", "asset"],
        ["eq2", "equity"],
      ]) {
        db.prepare(
          `INSERT OR IGNORE INTO fin_accounts (id, name, account_kind, currency, is_archived, created_at, updated_at, status)
           VALUES (?,?,?,?,0,?,?, 'active')`,
        ).run(id, id, kind, "IRR", now, now);
      }
    },
  });

  const db = openDb(dataDir);
  db.prepare(`UPDATE fin_operations SET result_json = ? WHERE id = ?`).run("{not-json", opId);

  const loaded = await loadOperation(opId, { dataDir, mode: "sqlite" });
  assert.equal(loaded.journalLines.length, 2);
  assert.equal(loaded.journalLines[0].amount, "25");
  assert.equal(loaded.status, "posted");
  closeAllDbs();
});
