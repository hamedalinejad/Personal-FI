import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeRatePercentage,
  buildSchedule,
  normalizeDayCount,
} from "../domain/loan/scheduleEngine.js";
import { toDecimal } from "../money/canonicalDecimal.js";

test("D.loan: 12% normalized once to 0.12", () => {
  const f = normalizeRatePercentage("12");
  assert.equal(f.toFixed(), "0.12");
});

test("D.loan: equal-principal 1200 @ 12% n=12 total interest 78", () => {
  const s = buildSchedule("declining_balance", {
    principal: "1200",
    annualRate: "12",
    periods: "12",
    startDate: "2026-01-01",
    dayCount: "period_based",
  });
  let ti = toDecimal("0");
  for (const row of s.rows) ti = ti.plus(toDecimal(row.interest));
  assert.ok(ti.eq(toDecimal("78")));
  assert.ok(toDecimal(s.rows[0].interest).eq(toDecimal("12")));
  assert.ok(toDecimal(s.rows[11].interest).eq(toDecimal("1")));
});

test("D.loan: flat 100000 @ 12% one-year interest 12000", () => {
  const s = buildSchedule("flat_rate", {
    principal: "100000",
    annualRate: "12",
    periods: "12",
    startDate: "2026-01-01",
    dayCount: "period_based",
  });
  let ti = toDecimal("0");
  for (const row of s.rows) ti = ti.plus(toDecimal(row.interest || "0"));
  assert.ok(ti.eq(toDecimal("12000")));
});

test("D.loan: qarz 4% fee on 100000 => total fee 4000", () => {
  const s = buildSchedule("qarz_al_hasaneh", {
    principal: "100000",
    periods: "10",
    feePercent: "4",
    startDate: "2026-01-01",
    dayCount: "period_based",
  });
  let fee = toDecimal("0");
  for (const row of s.rows) fee = fee.plus(toDecimal(row.fee || "0"));
  assert.ok(fee.eq(toDecimal("4000")));
});

test("D.loan: unsupported day-count rejected", () => {
  assert.throws(
    () =>
      normalizeDayCount("actual_365"),
    /DAY_COUNT|unsupported|period_based|LOAN/i,
  );
});

test("D.loan: annuity reference is NOT v1 equal-principal payment", () => {
  const s = buildSchedule("declining_balance", {
    principal: "100000000",
    annualRate: "18",
    periods: "52",
    startDate: "2026-01-01",
    dayCount: "period_based",
  });
  const pay0 = toDecimal(s.rows[0].payment);
  // annuity fixed-PMT ≈ 2104660.886 — must not equal equal-principal payment
  assert.ok(!pay0.eq(toDecimal("2104660.886")));
});
