import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { persistOperation, loadOperation } from "./worker.js";

test("BUG-003 temp then swap", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-w-"));
  const r = await persistOperation(
    { operationId: "op1", type: "t", journalLines: [] },
    { dataDir },
  );
  assert.equal(r.durability_state, "swapped");
  const loaded = await loadOperation("op1", { dataDir });
  assert.equal(loaded.operationId, "op1");
});
