import test from "node:test";
import assert from "node:assert/strict";
import { buildSchedule } from "./scheduleEngine.js";

test("BUG-006 declining", () => {
  const s = buildSchedule("declining_balance", {
    principal: "1200",
    annualRate: "0.12",
    periods: "12",
  });
  assert.equal(s.rows.length, 12);
  assert.equal(Number(s.rows[11].balance), 0);
});

test("BUG-006 qarz", () => {
  const s = buildSchedule("qarz_al_hasaneh", {
    principal: "1000",
    periods: "10",
    feePercent: "0.04",
  });
  assert.equal(s.rows[0].interest, "0");
  assert.ok(Number(s.rows[0].fee) > 0);
});
