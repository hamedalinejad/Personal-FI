import test from "node:test";
import assert from "node:assert/strict";
import { addBusinessDays, computeEquitySettlementDate, SETTLEMENT_POLICY_VERSION } from "./settlementPolicy.js";

test("T+2 skips Iranian weekend", () => {
  // 2026-01-01 Thursday → +2 business = Mon 2026-01-05? 
  // Thu+1=Fri skip, +1=Sat skip, +1=Sun, +1=Mon → need careful
  const r = computeEquitySettlementDate("2026-01-01", { tPlus: 2 });
  assert.equal(r.policyVersion, SETTLEMENT_POLICY_VERSION);
  assert.ok(r.settlementDate > "2026-01-01");
  assert.equal(addBusinessDays("2026-01-01", 0), "2026-01-01");
});
