import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { persistOperation, loadOperation } from "./worker.js";

test("P0-CODE-006 sqlite persists journal lines", async () => {
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
  assert.ok(!("_transportState" in r) || r._transportState === undefined);
  const loaded = await loadOperation(operationId, { dataDir, mode: "sqlite" });
  assert.equal(loaded.journalLines.length, 2);
  assert.equal(loaded.durability_state, "sql_committed");
});

test("P0-CODE-007 json mode exposes status not only transport", async () => {
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
  assert.equal(r.status, "posted");
  assert.equal(r.durability_state, "sql_committed");
});
