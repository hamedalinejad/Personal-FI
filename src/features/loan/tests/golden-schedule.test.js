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
  const s = buildSchedule("declining_balance", {
    principal: "1200",
    annualRate: "12",
    periods: "12",
    startDate: "2026-01-01",
    dayCount: "period_based",
  });
  const interests = s.rows.map((r) => Number(r.interest));
  assert.deepEqual(interests, [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  const payments = s.rows.map((r) => Number(r.payment));
  assert.deepEqual(payments, [112, 111, 110, 109, 108, 107, 106, 105, 104, 103, 102, 101]);
  assert.equal(interests.reduce((a, b) => a + b, 0), 78);
  assert.equal(s.rows[11].balance, "0.00");
});

test("GOLDEN flat residual zero and total interest = principal * 12%", () => {
  const s = buildSchedule("flat_rate", {
    principal: "1200",
    annualRate: "12",
    periods: "12",
    startDate: "2026-01-01",
  });
  assert.equal(s.rows[11].balance, "0.00");
  const sumP = s.rows.reduce((a, r) => a + Number(r.principal), 0);
  const sumI = s.rows.reduce((a, r) => a + Number(r.interest), 0);
  assert.ok(Math.abs(sumP - 1200) < 0.02, `sumP=${sumP}`);
  // 12% of 1200 = 144 (not 14400)
  assert.ok(Math.abs(sumI - 144) < 0.05, `sumI=${sumI} expected ~144`);
  assert.ok(sumI < 200, "rate must be percentage-points not fraction*100 error");
});

test("GOLDEN bullet residual zero", () => {
  const s = buildSchedule("bullet", {
    principal: "1000",
    annualRate: "12",
    periods: "4",
    startDate: "2026-01-01",
  });
  assert.equal(s.rows[3].balance, "0.00");
  assert.ok(Number(s.rows[0].principal) === 0);
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
    feePercent: "2", // 2% of principal total fee = 20
  });
  const sumFee = s.rows.reduce((a, r) => a + Number(r.fee), 0);
  assert.ok(Math.abs(sumFee - 20) < 0.05, `sumFee=${sumFee}`);
});
