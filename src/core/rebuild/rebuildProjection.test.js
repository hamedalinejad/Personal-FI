import test from "node:test";
import assert from "node:assert/strict";
import { rebuildProjection } from "./rebuildProjection.js";

test("rebuildProjection requires asOf and ledger", () => {
  assert.throws(() => rebuildProjection({}), /REBUILD_ASOF/);
  assert.throws(() => rebuildProjection({ asOf: "2026-01-01" }), /REBUILD_LEDGER/);
});

test("rebuildProjection requires operations array", () => {
  assert.throws(
    () => rebuildProjection({ asOf: "2026-01-01", sourceLedger: { projections: {} } }),
    /REBUILD_REQUIRES_OPERATIONS/,
  );
});

test("rebuildProjection is deterministic for same inputs", () => {
  const args = {
    asOf: "2026-06-01",
    engineVersions: { costBasis: "wac-v1" },
    sourceLedger: {
      operations: [
        {
          operationId: "op1",
          status: "posted",
          businessDate: "2026-01-15",
          type: "funds.subscribe",
          domainResult: { holdingId: "h1", quantity: "1", instrumentId: "f1", cost: "100" },
        },
      ],
    },
    policyVersions: { settlement: "iran-equity-settlement-v2" },
  };
  const a = rebuildProjection(args);
  const b = rebuildProjection(args);
  assert.deepEqual(a, b);
  assert.equal(a.deterministic, true);
  assert.equal(a.method, "replay_operations");
  assert.equal(a.holdings[0].quantity, "1");
});
