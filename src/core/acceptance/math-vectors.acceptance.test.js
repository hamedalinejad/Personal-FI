import test from "node:test";
import assert from "node:assert/strict";
import { toDecimal } from "../money/canonicalDecimal.js";
import { buildSchedule, assertDayCountSupported } from "../domain/loan/scheduleEngine.js";

/** MATH-001 reference: annuity PMT for documentation — NOT v1 schedule acceptance */
function annuityPmt(P, r, n) {
  // PMT = P * r * (1+r)^n / ((1+r)^n - 1)
  const one = toDecimal("1");
  const rr = toDecimal(r);
  const nn = toDecimal(n);
  let pow = one;
  for (let i = 0; i < Number(n); i++) pow = pow.times(one.plus(rr));
  return toDecimal(P).times(rr).times(pow).div(pow.minus(one));
}

test("MATH-001 weekly annuity reference ≈ 2104660.886 (not 2115000)", () => {
  const pmt = annuityPmt("100000000", (0.18 / 52).toFixed(18), "52");
  const expected = toDecimal("2104660.886");
  // within 0.01 of exact reference
  assert.ok(pmt.minus(expected).abs().lt(toDecimal("0.01")), pmt.toFixed(6));
  assert.ok(!pmt.minus(toDecimal("2115000")).abs().lt(toDecimal("1")));
});

test("MATH-002 45-day simple PMT reference ≈ 6890118.148", () => {
  const r = toDecimal("0.18").times("45").div("365");
  const pmt = annuityPmt("50000000", r.toFixed(18), "8");
  const expected = toDecimal("6890118.148");
  assert.ok(pmt.minus(expected).abs().lt(toDecimal("0.01")), pmt.toFixed(6));
  assert.ok(!pmt.minus(toDecimal("6956000")).abs().lt(toDecimal("1")));
});

test("MATH-003 actual_actual rejected in v1 engine", () => {
  assert.throws(() => assertDayCountSupported("actual_actual"), /LOAN_DAY_COUNT_UNSUPPORTED/);
});

test("MATH-001 v1 declining is NOT annuity payment", () => {
  const s = buildSchedule("declining_balance", {
    principal: "100000000",
    annualRate: "18",
    periods: "52",
    startDate: "2026-01-01",
    dayCount: "period_based",
    frequency: "weekly",
  });
  const pay0 = toDecimal(s.rows[0].payment);
  assert.ok(pay0.minus(toDecimal("2104660.886")).abs().gt(toDecimal("1")));
});
