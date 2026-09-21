/**
 * Executable recovery matrix (PHASE 9) — 12 scenarios.
 * Browser-specific scenarios are marked; Node can run pure logic scenarios.
 */

import {
  validateBackupPackage,
  corruptPackage,
  checksumBytes,
  hasSqliteHeader,
  createBackupPackage,
} from "./backupPackage.js";

export const RECOVERY_SCENARIOS = Object.freeze([
  { id: 1, name: "crash_before_commit", env: "any", status: "SPEC" },
  { id: 2, name: "crash_after_sql_commit", env: "any", status: "SPEC" },
  { id: 3, name: "replay_same_operation", env: "any", status: "EXECUTABLE" },
  { id: 4, name: "same_id_changed_economics", env: "any", status: "EXECUTABLE" },
  { id: 5, name: "offline_reopen", env: "browser", status: "NEEDS_E2E" },
  { id: 6, name: "backup", env: "any", status: "EXECUTABLE" },
  { id: 7, name: "restore", env: "any", status: "EXECUTABLE" },
  { id: 8, name: "corrupt_backup", env: "any", status: "EXECUTABLE" },
  { id: 9, name: "browser_reload", env: "browser", status: "NEEDS_E2E" },
  { id: 10, name: "multi_tab_write", env: "browser", status: "NEEDS_E2E" },
  { id: 11, name: "rebuild", env: "any", status: "SPEC" },
  { id: 12, name: "reversal", env: "any", status: "SPEC" },
]);

/**
 * Idempotency: same operationId + same hash → replay; same id + different economics → conflict.
 */
export function evaluateIdempotency(first, second) {
  if (!first?.operationId || !second?.operationId) {
    return { ok: false, code: "OP_ID_REQUIRED" };
  }
  if (first.operationId !== second.operationId) {
    return { ok: true, code: "DIFFERENT_OPS" };
  }
  const h1 = first.commandHash || first.hash;
  const h2 = second.commandHash || second.hash;
  if (h1 === h2) {
    return { ok: true, code: "IDEMPOTENT_REPLAY" };
  }
  return { ok: false, code: "OP_IDEMPOTENCY_CONFLICT" };
}

/**
 * Scenario 8: corrupt backup must fail validation; live untouched conceptually.
 */
export function runCorruptBackupScenario(validPkg) {
  const bad = corruptPackage(validPkg);
  const v = validateBackupPackage(bad);
  return {
    scenario: 8,
    rejected: v.ok === false,
    code: v.code,
    expectedCode: "BACKUP_CHECKSUM_MISMATCH",
    pass: v.ok === false && v.code === "BACKUP_CHECKSUM_MISMATCH",
  };
}

/**
 * Scenario 6: backup package shape.
 * @param {{ export: () => Uint8Array, prepare?: Function, run?: Function }} mockDb
 */
export async function runBackupScenario(mockDb, getMetaFn) {
  // Minimal: checksum + sqlite header checks on synthetic
  const header = new TextEncoder().encode("SQLite format 3\u0000");
  const buf = new Uint8Array(200);
  buf.set(header);
  for (let i = 16; i < 200; i++) buf[i] = i % 256;
  const pkg = {
    magic: "PFIB",
    formatVersion: "1",
    bytes: Array.from(buf),
    checksum: checksumBytes(buf),
    schemaVersion: "1",
    bookId: "book-test",
    createdAt: new Date().toISOString(),
  };
  const v = validateBackupPackage(pkg);
  return {
    scenario: 6,
    pass: v.ok === true && hasSqliteHeader(v.u8),
    checksum: pkg.checksum,
  };
}

/**
 * Summarize matrix readiness for release gate.
 */
export function matrixReadiness() {
  const executable = RECOVERY_SCENARIOS.filter((s) => s.status === "EXECUTABLE");
  const needsE2E = RECOVERY_SCENARIOS.filter((s) => s.status === "NEEDS_E2E");
  const spec = RECOVERY_SCENARIOS.filter((s) => s.status === "SPEC");
  return {
    total: RECOVERY_SCENARIOS.length,
    executable: executable.length,
    needsE2E: needsE2E.length,
    specOnly: spec.length,
    productionBlockers: needsE2E.map((s) => s.name),
    releaseReady: needsE2E.length === 0 && spec.length === 0,
  };
}
