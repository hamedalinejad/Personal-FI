import test from "node:test";
import assert from "node:assert/strict";
import { buildSchedule } from "../../../core/domain/loan/scheduleEngine.js";

test("GOLDEN zero interest equal principal", () => {
  const s = buildSchedule("declining_balance", {
    principal: "1200",
    annualRate: "0",
    periods: "12",
    startDate: "2026-01-01",
    dayCount: "period_based",
  });
  assert.equal(s.rows.length, 12);
  for (const row of s.rows) {
    assert.equal(row.principal, "100.00");
    assert.equal(row.interest, "0.00");
  }
  assert.equal(s.rows[11].balance, "0.00");
  const sumP = s.rows.reduce((a, r) => a + Number(r.principal), 0);
  assert.equal(sumP, 1200);
});

test("GOLDEN declining equal-principal 12% annual period_based", () => {
  // engineVersions: 1.0.0-period_based-equal-principal
  const s = buildSchedule("declining_balance", {
    principal: "1200",
    annualRate: "0.12",
    periods: "12",
    startDate: "2026-01-01",
    dayCount: "period_based",
  });
  const interests = s.rows.map((r) => Number(r.interest));
  assert.deepEqual(interests, [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  const payments = s.rows.map((r) => Number(r.payment));
  assert.deepEqual(payments, [112, 111, 110, 109, 108, 107, 106, 105, 104, 103, 102, 101]);
  const totalInt = interests.reduce((a, b) => a + b, 0);
  assert.equal(totalInt, 78);
  assert.equal(s.rows[11].balance, "0.00");
});
