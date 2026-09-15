import test from "node:test";
import assert from "node:assert/strict";
import { rebuildProjection } from "./rebuildProjection.js";

test("rebuildProjection requires asOf and ledger", () => {
  assert.throws(() => rebuildProjection({}), /REBUILD_ASOF/);
  assert.throws(() => rebuildProjection({ asOf: "2026-01-01" }), /REBUILD_LEDGER/);
});

test("rebuildProjection is deterministic for same inputs", () => {
  const args = {
    asOf: "2026-06-01",
    engineVersions: { costBasis: "wac-v1" },
    sourceLedger: { projections: { holdings: [{ id: "h1", qty: "1" }] } },
    policyVersions: { settlement: "iran-equity-T2-v2" },
  };
  const a = rebuildProjection(args);
  const b = rebuildProjection(args);
  assert.deepEqual(a, b);
  assert.equal(a.projections.holdings[0].qty, "1");
});
