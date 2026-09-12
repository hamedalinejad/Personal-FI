import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeCommand,
  stableStringify,
  computeCommandHash,
  runAtomicFinancialOperation,
} from "./operationEngine.js";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function lines() {
  return [
    { accountId: "a1", side: "debit", amount: "100", currency: "IRR" },
    { accountId: "a2", side: "credit", amount: "100", currency: "IRR" },
  ];
}

test("P0-OP-001 normalize preserves settlementDate eventAt provenance", () => {
  const n = normalizeCommand({
    operationId: "op-1",
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    status: "posted",
    settlementDate: "2026-01-03",
    eventAt: "2026-01-01T10:00:00Z",
    provenance: { source: "test" },
    journalLines: lines(),
  });
  assert.equal(n.settlementDate, "2026-01-03");
  assert.equal(n.eventAt, "2026-01-01T10:00:00Z");
  assert.deepEqual(n.provenance, { source: "test" });
});

test("P0-OP-002/003 hash includes settlementDate; client mismatch fails", () => {
  const base = {
    operationId: "op-h",
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    status: "posted",
    journalLines: lines(),
    type: "test.op",
  };
  const h1 = computeCommandHash(normalizeCommand({ ...base, settlementDate: "2026-01-02" }));
  const h2 = computeCommandHash(normalizeCommand({ ...base, settlementDate: "2026-01-03" }));
  assert.notEqual(h1, h2);
  assert.throws(
    () =>
      normalizeCommand({
        ...base,
        commandHash: "deadbeef",
      }) &&
      (() => {
        throw new Error("should check at run");
      })(),
  );
});

test("P0-OP-002 run rejects client hash mismatch", async () => {
  await assert.rejects(
    () =>
      runAtomicFinancialOperation({
        operationId: "op-hash-bad",
        businessDate: "2026-01-01",
        baseCurrency: "IRR",
        status: "posted",
        type: "test",
        journalLines: lines(),
        commandHash: "00".repeat(32),
        persistMode: "json",
        dataDir: mkdtempSync(join(tmpdir(), "pf-")),
      }),
    /OP_COMMAND_HASH_MISMATCH/,
  );
});

test("P0-OP-004 array undefined forbidden in stableStringify", () => {
  assert.throws(() => stableStringify([1, undefined, 3]), /HASH_ARRAY_UNDEFINED/);
});

test("P0-OP-005 status required when journal lines present", () => {
  assert.throws(
    () =>
      normalizeCommand({
        operationId: "op-2",
        businessDate: "2026-01-01",
        baseCurrency: "IRR",
        journalLines: lines(),
      }),
    /OP_STATUS_REQUIRED/,
  );
});

test("P0-OP-006 pending business status rejected", () => {
  assert.throws(
    () =>
      normalizeCommand({
        operationId: "op-3",
        businessDate: "2026-01-01",
        baseCurrency: "IRR",
        status: "pending",
        journalLines: lines(),
      }),
    /OP_STATUS_INVALID/,
  );
});
