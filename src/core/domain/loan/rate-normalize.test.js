import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRatePercentage, periodRateFromAnnual, buildSchedule } from "./scheduleEngine.js";

test("18 percentage points → 0.18 fractional", () => {
  assert.equal(normalizeRatePercentage("18").toFixed(), "0.18");
});

test("period monthly from 12% → 0.01", () => {
  assert.equal(periodRateFromAnnual("12", "monthly").toFixed(), "0.01");
});

test("golden equal-principal uses percentage points 12", () => {
  const s = buildSchedule("declining_balance", {
    principal: "1200",
    annualRate: "12",
    periods: "12",
    startDate: "2026-01-01",
  });
  assert.equal(s.rows[0].interest, "12.00");
});
