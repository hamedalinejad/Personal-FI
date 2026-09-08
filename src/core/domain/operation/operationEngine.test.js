import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { runAtomicFinancialOperation } from "./operationEngine.js";

test("BUG-002 balanced journal persists", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-op-"));
  const r = await runAtomicFinancialOperation({
    type: "expense",
    operationId: randomUUID(),
    dataDir,
    journalLines: [
      { accountId: "cash", side: "credit", amount: "100" },
      { accountId: "expense", side: "debit", amount: "100" },
    ],
  });
  assert.equal(r.idempotentReplay, false);
  assert.ok(r.operationId);
  assert.ok(r.durability_state === "sql_committed" || r.durability_state === "swapped");
});

test("BUG-002 idempotent replay", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-op-"));
  const operationId = randomUUID();
  const cmd = {
    type: "expense",
    operationId,
    dataDir,
    journalLines: [
      { accountId: "a", side: "debit", amount: "10" },
      { accountId: "b", side: "credit", amount: "10" },
    ],
  };
  const a = await runAtomicFinancialOperation(cmd);
  const b = await runAtomicFinancialOperation(cmd);
  assert.equal(b.idempotentReplay, true);
  assert.equal(a.operationId, b.operationId);
});

test("BUG-002 rejects missing operationId", async () => {
  await assert.rejects(() =>
    runAtomicFinancialOperation({
      journalLines: [
        { accountId: "a", side: "debit", amount: "10" },
        { accountId: "b", side: "credit", amount: "10" },
      ],
    }),
  );
});

test("BUG-002 rejects unbalanced", async () => {
  await assert.rejects(() =>
    runAtomicFinancialOperation({
      operationId: randomUUID(),
      journalLines: [
        { accountId: "a", side: "debit", amount: "10" },
        { accountId: "b", side: "credit", amount: "9" },
      ],
    }),
  );
});

import { stableStringify, runAtomicFinancialOperation as runOp } from "./operationEngine.js";

test("P0-CODE-005 stableStringify ignores key order", () => {
  const a = stableStringify({ b: 1, a: 2 });
  const b = stableStringify({ a: 2, b: 1 });
  assert.equal(a, b);
});

test("P0-CODE-003 recovers from durable op file without idempotency map", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-op-"));
  const operationId = randomUUID();
  const cmd = {
    type: "expense",
    operationId,
    dataDir,
    journalLines: [
      { accountId: "a", side: "debit", amount: "10" },
      { accountId: "b", side: "credit", amount: "10" },
    ],
  };
  const first = await runOp(cmd);
  // simulate lost idempotency map
  const { writeFile } = await import("node:fs/promises");
  await writeFile(join(dataDir, "idempotency.json"), "{}", "utf8");
  const second = await runOp(cmd);
  assert.equal(second.idempotentReplay, true);
  assert.equal(second.operationId, first.operationId);
});
