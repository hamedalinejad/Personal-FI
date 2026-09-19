/**
 * Phase 16 — Optional sync (after local-first release).
 * Command/event level — never blind row replication of journal lines.
 */
export const SYNC_STATUS = "OUT_OF_MVP";

export function buildSyncEnvelope({
  operationId,
  commandHash,
  originDeviceId,
  businessDate,
  engineVersion,
  payloadDigest,
} = {}) {
  if (!operationId || !commandHash || !originDeviceId) {
    throw new Error("SYNC_ENVELOPE_INCOMPLETE");
  }
  return {
    operationId,
    commandHash,
    originDeviceId,
    businessDate: businessDate || null,
    engineVersion: engineVersion || null,
    payloadDigest: payloadDigest || null,
    syncState: "pending",
  };
}

/**
 * same operationId + same hash → idempotent
 * same operationId + different hash → hard conflict
 */
export function resolveSyncConflict(local, remote) {
  if (!local || !remote) throw new Error("SYNC_CONFLICT_INPUT");
  if (local.operationId !== remote.operationId) {
    return { kind: "distinct", action: "accept_both" };
  }
  if (local.commandHash === remote.commandHash) {
    return { kind: "idempotent_duplicate", action: "keep_local" };
  }
  return {
    kind: "hard_conflict",
    action: "manual_review",
    localHash: local.commandHash,
    remoteHash: remote.commandHash,
  };
}

export function assertNotRowReplication(plan) {
  if (plan?.mode === "row_blind_replication") {
    throw new Error("SYNC_ROW_REPLICATION_FORBIDDEN");
  }
  return true;
}
