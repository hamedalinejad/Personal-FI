import test from "node:test";
import assert from "node:assert/strict";
import { detectDrift, buildRepairPlan } from "./engine.js";

test("P0-017 detect and approved repair", () => {
  const r = detectDrift({ expected: { qty: "1" }, actual: { qty: "2" } });
  assert.equal(r.hasDrift, true);
  assert.throws(() => buildRepairPlan(r, {}));
  const plan = buildRepairPlan(r, { approvedBy: "user" });
  assert.equal(plan.actions.length, 1);
});
