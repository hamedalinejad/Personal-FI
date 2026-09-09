import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation, stableStringify } from "./operationEngine.js";
import { openDb, closeAllDbs } from "../../persistence/worker.js";
import { ensureAccount } from "../../accounting/chartOfAccounts.js";

function seed(dataDir) {
  const db = openDb(dataDir);
  ensureAccount(db, { id: "cash", name: "Cash", accountKind: "asset", currency: "IRR" });
  ensureAccount(db, { id: "expense", name: "Expense", accountKind: "expense", currency: "IRR" });
  ensureAccount(db, { id: "a", name: "A", accountKind: "asset", currency: "IRR" });
  ensureAccount(db, { id: "b", name: "B", accountKind: "liability", currency: "IRR" });
}

test("BUG-002 balanced journal persists", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-op-"));
  seed(dataDir);
  const r = await runAtomicFinancialOperation({
    type: "expense",
    operationId: randomUUID(),
    dataDir,
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    journalLines: [
      { accountId: "cash", side: "credit", amount: "100", currency: "IRR" },
      { accountId: "expense", side: "debit", amount: "100", currency: "IRR" },
    ],
  });
  assert.equal(r.idempotentReplay, false);
  assert.ok(r.operationId);
  assert.equal(r.durability_state, "sql_committed");
  closeAllDbs();
});

test("BUG-002 idempotent replay", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-op-"));
  seed(dataDir);
  const operationId = randomUUID();
  const cmd = {
    type: "expense",
    operationId,
    dataDir,
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    journalLines: [
      { accountId: "a", side: "debit", amount: "10", currency: "IRR" },
      { accountId: "b", side: "credit", amount: "10", currency: "IRR" },
    ],
  };
  const a = await runAtomicFinancialOperation(cmd);
  const b = await runAtomicFinancialOperation(cmd);
  assert.equal(b.idempotentReplay, true);
  assert.equal(a.operationId, b.operationId);
  closeAllDbs();
});

test("BUG-002 rejects missing operationId", async () => {
  await assert.rejects(() =>
    runAtomicFinancialOperation({
      businessDate: "2026-01-01",
      baseCurrency: "IRR",
      journalLines: [
        { accountId: "a", side: "debit", amount: "10", currency: "IRR" },
        { accountId: "b", side: "credit", amount: "10", currency: "IRR" },
      ],
    }),
  );
});

test("BUG-002 rejects unbalanced", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-op-"));
  seed(dataDir);
  await assert.rejects(() =>
    runAtomicFinancialOperation({
      operationId: randomUUID(),
      dataDir,
      businessDate: "2026-01-01",
      baseCurrency: "IRR",
      journalLines: [
        { accountId: "a", side: "debit", amount: "10", currency: "IRR" },
        { accountId: "b", side: "credit", amount: "9", currency: "IRR" },
      ],
    }),
  );
  closeAllDbs();
});

test("P0-CODE-005 stableStringify ignores key order", () => {
  const a = stableStringify({ b: 1, a: 2 });
  const b = stableStringify({ a: 2, b: 1 });
  assert.equal(a, b);
});

test("P0-CODE-003 recovers from durable op", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-op-"));
  seed(dataDir);
  const operationId = randomUUID();
  const cmd = {
    type: "expense",
    operationId,
    dataDir,
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    journalLines: [
      { accountId: "a", side: "debit", amount: "10", currency: "IRR" },
      { accountId: "b", side: "credit", amount: "10", currency: "IRR" },
    ],
  };
  const first = await runAtomicFinancialOperation(cmd);
  const { writeFile } = await import("node:fs/promises");
  await writeFile(join(dataDir, "idempotency.json"), "{}", "utf8");
  const second = await runAtomicFinancialOperation(cmd);
  assert.equal(second.idempotentReplay, true);
  assert.equal(second.operationId, first.operationId);
  assert.equal(second.domainResult ?? null, first.domainResult ?? null);
  closeAllDbs();
});
