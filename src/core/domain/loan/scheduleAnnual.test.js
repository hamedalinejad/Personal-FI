import test from "node:test";
import assert from "node:assert/strict";
import { scheduleDeclining, assertScheduleConservation } from "./scheduleEngine.js";

test("P1 annual frequency schedule conserves principal exactly", () => {
  const result = scheduleDeclining({
    principal: "1200.00",
    annualRate: "12",
    periods: "2",
    startDate: "2026-01-01",
    frequency: "annual",
  });
  assert.ok(result.rows.length >= 2);
  assertScheduleConservation(result.rows, { principal: "1200.00" });
});
