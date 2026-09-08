import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { persistOperation, loadOperation, closeAllDbs } from "./worker.js";

test("P0-001 sqlite uses balanced journal from lines SoT", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-sql-"));
  const operationId = randomUUID();
  const r = await persistOperation(
    {
      operationId,
      commandHash: "h1",
      type: "expense",
      status: "posted",
      journalLines: [
        { accountId: "cash", side: "credit", amount: "100" },
        { accountId: "exp", side: "debit", amount: "100" },
      ],
    },
    { dataDir, mode: "sqlite" },
  );
  assert.equal(r.durability_state, "sql_committed");
  assert.equal(r.status, "posted");
  const loaded = await loadOperation(operationId, { dataDir, mode: "sqlite" });
  assert.equal(loaded.journalLines.length, 2);
  assert.equal(loaded.status, "posted");
  closeAllDbs();
});

test("P0-003 rejects status reversed", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-sql-"));
  await assert.rejects(() =>
    persistOperation(
      {
        operationId: randomUUID(),
        status: "reversed",
        journalLines: [
          { accountId: "a", side: "debit", amount: "1" },
          { accountId: "b", side: "credit", amount: "1" },
        ],
      },
      { dataDir, mode: "sqlite" },
    ),
  );
  closeAllDbs();
});

test("P0-007 rejects unbalanced journal", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-sql-"));
  await assert.rejects(() =>
    persistOperation(
      {
        operationId: randomUUID(),
        journalLines: [
          { accountId: "a", side: "debit", amount: "10" },
          { accountId: "b", side: "credit", amount: "9" },
        ],
      },
      { dataDir, mode: "sqlite" },
    ),
  );
  closeAllDbs();
});

test("P0-007 json mode still works for fixtures", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-json-"));
  const operationId = randomUUID();
  const r = await persistOperation(
    {
      operationId,
      type: "expense",
      status: "posted",
      journalLines: [
        { accountId: "a", side: "debit", amount: "1" },
        { accountId: "b", side: "credit", amount: "1" },
      ],
    },
    { dataDir, mode: "json" },
  );
  assert.equal(r.durability_state, "sql_committed");
});
