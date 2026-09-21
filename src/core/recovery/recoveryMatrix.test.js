import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RECOVERY_SCENARIOS,
  evaluateIdempotency,
  runCorruptBackupScenario,
  runBackupScenario,
  matrixReadiness,
} from "./recoveryMatrix.js";
import { checksumBytes } from "./backupPackage.js";

describe("recovery matrix PHASE 9", () => {
  it("defines exactly 12 scenarios", () => {
    assert.equal(RECOVERY_SCENARIOS.length, 12);
    const ids = RECOVERY_SCENARIOS.map((s) => s.id).sort((a, b) => a - b);
    assert.deepEqual(ids, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("scenario 3: identical replay is idempotent", () => {
    const r = evaluateIdempotency(
      { operationId: "A", hash: "H1" },
      { operationId: "A", hash: "H1" }
    );
    assert.equal(r.code, "IDEMPOTENT_REPLAY");
    assert.equal(r.ok, true);
  });

  it("scenario 4: same id changed economics conflicts", () => {
    const r = evaluateIdempotency(
      { operationId: "A", hash: "H1" },
      { operationId: "A", hash: "H2" }
    );
    assert.equal(r.code, "OP_IDEMPOTENCY_CONFLICT");
    assert.equal(r.ok, false);
  });

  it("scenario 6: backup package validates", async () => {
    const r = await runBackupScenario(null);
    assert.equal(r.pass, true);
  });

  it("scenario 8: corrupt backup rejected", () => {
    const header = new TextEncoder().encode("SQLite format 3\u0000");
    const buf = new Uint8Array(200);
    buf.set(header);
    for (let i = 16; i < 200; i++) buf[i] = i % 256;
    const pkg = {
      magic: "PFIB",
      formatVersion: "1",
      bytes: Array.from(buf),
      checksum: checksumBytes(buf),
    };
    const r = runCorruptBackupScenario(pkg);
    assert.equal(r.pass, true);
    assert.equal(r.rejected, true);
  });

  it("matrix readiness lists browser E2E blockers", () => {
    const m = matrixReadiness();
    assert.equal(m.total, 12);
    assert.ok(m.needsE2E >= 3);
    assert.equal(m.releaseReady, false);
    assert.ok(m.productionBlockers.includes("browser_reload"));
  });
});
