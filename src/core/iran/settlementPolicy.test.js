import test from "node:test";
import assert from "node:assert/strict";
import {
  addBusinessDays,
  computeEquitySettlementDate,
  SETTLEMENT_POLICY_VERSION,
} from "./settlementPolicy.js";

test("CURRENT policy skips Thu+Fri (Iran equity weekend)", () => {
  assert.equal(SETTLEMENT_POLICY_VERSION, "iran-equity-T2-v2");
  // 2026-01-01 is Thursday → next business day is Saturday 2026-01-03
  assert.equal(addBusinessDays("2025-12-31", 1), "2026-01-03"); // Wed +1 → Sat
  // T+2 from Wednesday 2025-12-31: Sat + Sun → 2026-01-04
  const r = computeEquitySettlementDate("2025-12-31", { tPlus: 2 });
  assert.equal(r.settlementDate, "2026-01-04");
  assert.equal(r.policyVersion, "iran-equity-T2-v2");
});

test("T+2 from Saturday lands on Monday", () => {
  // Sat 2026-01-03 +2 business = Sun, Mon → 2026-01-05
  assert.equal(addBusinessDays("2026-01-03", 2), "2026-01-05");
});

test("legacy v1 still deterministic Fri+Sat for historical replay", () => {
  // Wed 2025-12-31 +1 under v1 (skip Fri Sat only) → Thu
  assert.equal(addBusinessDays("2025-12-31", 1, "iran-equity-T2-v1"), "2026-01-01");
});

test("unknown policy throws", () => {
  assert.throws(() => computeEquitySettlementDate("2026-01-01", { policyVersion: "nope" }), /UNKNOWN/);
});

test("addBusinessDays 0 returns same day", () => {
  assert.equal(addBusinessDays("2026-01-01", 0), "2026-01-01");
});
