import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  runAtomicFinancialOperation,
  _resetIdempotencyForTests,
} from "./operationEngine.js";

test("BUG-002 balanced journal persists", async () => {
  _resetIdempotencyForTests();
  const dataDir = await mkdtemp(join(tmpdir(), "pf-op-"));
  // inject dataDir via env-less: patch by passing through command apply only
  const r = await runAtomicFinancialOperation({
    type: "expense",
    commandHash: "h1",
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
  _resetIdempotencyForTests();
  const cmd = {
    type: "expense",
    commandHash: "same",
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

test("BUG-002 rejects unbalanced", async () => {
  _resetIdempotencyForTests();
  await assert.rejects(() =>
    runAtomicFinancialOperation({
      commandHash: "bad",
      journalLines: [
        { accountId: "a", side: "debit", amount: "10" },
        { accountId: "b", side: "credit", amount: "9" },
      ],
    }),
  );
});
