import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildSchedule } from "../domain/loan/scheduleEngine.js";
import { toDecimal } from "../money/canonicalDecimal.js";

test("P0-LOAN-010 LOAN-FLAT.json is non-empty proof vector", () => {
  const fx = JSON.parse(readFileSync("fixtures/LOAN-FLAT.json", "utf8"));
  assert.ok(fx.input?.principal);
  assert.ok(fx.expected?.domain?.totalInterest);
  const s = buildSchedule(fx.input.method, {
    principal: fx.input.principal,
    annualRate: fx.input.annualRate,
    periods: fx.input.periods,
    startDate: fx.input.startDate,
    dayCount: fx.input.dayCount,
  });
  let ti = toDecimal("0");
  let tp = toDecimal("0");
  for (const r of s.rows) {
    ti = ti.plus(toDecimal(r.interest));
    tp = tp.plus(toDecimal(r.principal));
  }
  assert.equal(s.rows.length, fx.expected.domain.rowCount);
  assert.ok(ti.eq(toDecimal(fx.expected.domain.totalInterest)));
  assert.ok(tp.eq(toDecimal(fx.expected.domain.totalPrincipal)));
});
