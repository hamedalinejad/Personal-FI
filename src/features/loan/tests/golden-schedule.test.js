import test from "node:test";
import assert from "node:assert/strict";
import { buildSchedule } from "../../../core/domain/loan/scheduleEngine.js";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";

function sumField(rows, field) {
  return rows.reduce((a, r) => a.plus(toDecimal(r[field] || "0")), toDecimal("0"));
}

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
  assert.ok(sumField(s.rows, "principal").eq(toDecimal("1200")));
});

test("GOLDEN declining equal-principal 12% annual period_based", () => {
  const s = buildSchedule("declining_balance", {
    principal: "1200",
    annualRate: "12",
    periods: "12",
    startDate: "2026-01-01",
    dayCount: "period_based",
  });
  const interests = s.rows.map((r) => r.interest);
  assert.deepEqual(interests, [
    "12.00", "11.00", "10.00", "9.00", "8.00", "7.00", "6.00", "5.00", "4.00", "3.00", "2.00", "1.00",
  ]);
  assert.ok(sumField(s.rows, "interest").eq(toDecimal("78")));
  assert.equal(s.rows[11].balance, "0.00");
  assert.equal(s.dayCount, "period_based");
});

test("GOLDEN flat residual zero and total interest = P * 12% * 1y", () => {
  const s = buildSchedule("flat_rate", {
    principal: "1200",
    annualRate: "12",
    periods: "12",
    startDate: "2026-01-01",
  });
  assert.equal(s.rows[11].balance, "0.00");
  assert.ok(sumField(s.rows, "principal").eq(toDecimal("1200")));
  // P0-LOAN-003: annual * termYears (12/12=1) → 144
  assert.ok(sumField(s.rows, "interest").eq(toDecimal("144")));
  assert.equal(s.flatConvention, "annual_times_term_years");
});

test("GOLDEN flat 6 months is half year interest", () => {
  const s = buildSchedule("flat_rate", {
    principal: "1200",
    annualRate: "12",
    periods: "6",
    startDate: "2026-01-01",
  });
  assert.ok(sumField(s.rows, "interest").eq(toDecimal("72")));
});

test("GOLDEN bullet residual zero", () => {
  const s = buildSchedule("bullet", {
    principal: "1000",
    annualRate: "12",
    periods: "4",
    startDate: "2026-01-01",
  });
  assert.equal(s.rows[3].balance, "0.00");
  assert.ok(toDecimal(s.rows[0].principal).eq(0));
});

test("GOLDEN qarz zero fee", () => {
  const s = buildSchedule("qarz_al_hasaneh", {
    principal: "1000",
    periods: "10",
    startDate: "2026-01-01",
    feePercent: "0",
  });
  assert.equal(s.rows[0].interest, "0.00");
  assert.equal(s.rows[0].fee, "0.00");
});

test("GOLDEN qarz feePercent is percentage-points", () => {
  const s = buildSchedule("qarz_al_hasaneh", {
    principal: "1000",
    periods: "10",
    startDate: "2026-01-01",
    feePercentPoints: "2",
  });
  assert.ok(sumField(s.rows, "fee").eq(toDecimal("20")));
});

test("GOLDEN monthly alias normalizes to period_based", () => {
  const s = buildSchedule("declining_balance", {
    principal: "100",
    annualRate: "0",
    periods: "1",
    startDate: "2026-01-01",
    dayCount: "monthly",
  });
  assert.equal(s.dayCount, "period_based");
});

test("P0-LOAN-007 variable rate rejected", () => {
  assert.throws(
    () =>
      buildSchedule("declining_balance", {
        principal: "100",
        annualRate: "12",
        periods: "2",
        startDate: "2026-01-01",
        rateHistory: [{}],
      }),
    /LOAN_VARIABLE_RATE_UNSUPPORTED_V1/,
  );
});
