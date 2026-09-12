import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCommand, stableStringify } from "./operationEngine.js";

test("normalize preserves settlementDate eventAt provenance", () => {
  const n = normalizeCommand({
    operationId: "op-1",
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    settlementDate: "2026-01-03",
    eventAt: "2026-01-01T10:00:00Z",
    provenance: { source: "test" },
    journalLines: [
      { accountId: "a1", side: "debit", amount: "100", currency: "IRR" },
      { accountId: "a2", side: "credit", amount: "100", currency: "IRR" },
    ],
  });
  assert.equal(n.settlementDate, "2026-01-03");
  assert.equal(n.eventAt, "2026-01-01T10:00:00Z");
  assert.deepEqual(n.provenance, { source: "test" });
  assert.equal(n.status, "posted");
});

test("normalize rejects pending business status", () => {
  assert.throws(
    () =>
      normalizeCommand({
        operationId: "op-2",
        businessDate: "2026-01-01",
        baseCurrency: "IRR",
        status: "pending",
        journalLines: [
          { accountId: "a1", side: "debit", amount: "1", currency: "IRR" },
          { accountId: "a2", side: "credit", amount: "1", currency: "IRR" },
        ],
      }),
    /OP_STATUS_INVALID/,
  );
});

test("stableStringify omits undefined", () => {
  assert.equal(stableStringify({ a: 1, b: undefined }), '{"a":1}');
});
