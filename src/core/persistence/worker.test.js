import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { persistOperation, loadOperation, closeAllDbs, openDb } from "./worker.js";
import { ensureAccount } from "../accounting/chartOfAccounts.js";

function seedAccounts(dataDir) {
  const db = openDb(dataDir);
  ensureAccount(db, { id: "cash", name: "Cash", accountKind: "asset", currency: "IRR" });
  ensureAccount(db, { id: "exp", name: "Expense", accountKind: "expense", currency: "IRR" });
  ensureAccount(db, { id: "a", name: "A", accountKind: "asset", currency: "IRR" });
  ensureAccount(db, { id: "b", name: "B", accountKind: "liability", currency: "IRR" });
}

test("P0 no invent accounts — ACCOUNT_NOT_FOUND", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-sql-"));
  await assert.rejects(
    () =>
      persistOperation(
        {
          operationId: randomUUID(),
          commandHash: "h1",
          type: "expense",
          status: "posted",
          businessDate: "2026-01-01",
          baseCurrency: "IRR",
          journalLines: [
            { accountId: "missing", side: "credit", amount: "100", currency: "IRR" },
            { accountId: "also", side: "debit", amount: "100", currency: "IRR" },
          ],
        },
        { dataDir, mode: "sqlite" },
      ),
    /ACCOUNT_NOT_FOUND/,
  );
  closeAllDbs();
});

test("P0-001 sqlite journal SoT + explicit date/currency", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-sql-"));
  seedAccounts(dataDir);
  const operationId = randomUUID();
  const r = await persistOperation(
    {
      operationId,
      commandHash: "h1",
      type: "expense",
      status: "posted",
      businessDate: "2026-01-01",
      baseCurrency: "IRR",
      journalLines: [
        { accountId: "cash", side: "credit", amount: "100", currency: "IRR" },
        { accountId: "exp", side: "debit", amount: "100", currency: "IRR" },
      ],
    },
    { dataDir, mode: "sqlite" },
  );
  assert.equal(r.durability_state, "sql_committed");
  assert.equal(r.status, "posted");
  const loaded = await loadOperation(operationId, { dataDir, mode: "sqlite" });
  assert.equal(loaded.journalLines.length, 2);
  assert.equal(loaded.businessDate, "2026-01-01");
  assert.equal(loaded.baseCurrency, "IRR");
  closeAllDbs();
});

test("P0 rejects implicit date", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-sql-"));
  seedAccounts(dataDir);
  await assert.rejects(
    () =>
      persistOperation(
        {
          operationId: randomUUID(),
          baseCurrency: "IRR",
          journalLines: [
            { accountId: "a", side: "debit", amount: "1", currency: "IRR" },
            { accountId: "b", side: "credit", amount: "1", currency: "IRR" },
          ],
        },
        { dataDir, mode: "sqlite" },
      ),
    /OP_BUSINESS_DATE_REQUIRED/,
  );
  closeAllDbs();
});

test("P0-003 rejects status reversed", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-sql-"));
  seedAccounts(dataDir);
  await assert.rejects(() =>
    persistOperation(
      {
        operationId: randomUUID(),
        status: "reversed",
        businessDate: "2026-01-01",
        baseCurrency: "IRR",
        journalLines: [
          { accountId: "a", side: "debit", amount: "1", currency: "IRR" },
          { accountId: "b", side: "credit", amount: "1", currency: "IRR" },
        ],
      },
      { dataDir, mode: "sqlite" },
    ),
  );
  closeAllDbs();
});

test("P0-007 rejects unbalanced journal", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-sql-"));
  seedAccounts(dataDir);
  await assert.rejects(() =>
    persistOperation(
      {
        operationId: randomUUID(),
        businessDate: "2026-01-01",
        baseCurrency: "IRR",
        journalLines: [
          { accountId: "a", side: "debit", amount: "10", currency: "IRR" },
          { accountId: "b", side: "credit", amount: "9", currency: "IRR" },
        ],
      },
      { dataDir, mode: "sqlite" },
    ),
  );
  closeAllDbs();
});

test("P0-007 json mode requires date/currency", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-json-"));
  const operationId = randomUUID();
  const r = await persistOperation(
    {
      operationId,
      type: "expense",
      status: "posted",
      businessDate: "2026-01-01",
      baseCurrency: "IRR",
      journalLines: [
        { accountId: "a", side: "debit", amount: "1", currency: "IRR" },
        { accountId: "b", side: "credit", amount: "1", currency: "IRR" },
      ],
    },
    { dataDir, mode: "json" },
  );
  assert.equal(r.durability_state, "persisted");
});
