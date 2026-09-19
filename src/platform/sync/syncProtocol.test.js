import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSyncEnvelope,
  resolveSyncConflict,
  assertNotRowReplication,
  SYNC_STATUS,
} from "./syncProtocol.js";

test("Phase16 sync out of MVP", () => {
  assert.equal(SYNC_STATUS, "OUT_OF_MVP");
});

test("Phase16 conflict: same hash idempotent", () => {
  const a = buildSyncEnvelope({
    operationId: "op1",
    commandHash: "h1",
    originDeviceId: "d1",
  });
  const b = buildSyncEnvelope({
    operationId: "op1",
    commandHash: "h1",
    originDeviceId: "d2",
  });
  assert.equal(resolveSyncConflict(a, b).kind, "idempotent_duplicate");
});

test("Phase16 conflict: different hash hard conflict", () => {
  const a = buildSyncEnvelope({ operationId: "op1", commandHash: "h1", originDeviceId: "d1" });
  const b = buildSyncEnvelope({ operationId: "op1", commandHash: "h2", originDeviceId: "d2" });
  assert.equal(resolveSyncConflict(a, b).kind, "hard_conflict");
});

test("Phase16 forbids row-blind replication", () => {
  assert.throws(() => assertNotRowReplication({ mode: "row_blind_replication" }), /FORBIDDEN/);
});
