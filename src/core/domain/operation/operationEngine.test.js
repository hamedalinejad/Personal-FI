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
  assert.equal(r.durability_state, "swapped");
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
