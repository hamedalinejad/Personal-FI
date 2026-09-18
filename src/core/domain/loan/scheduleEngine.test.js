import test from "node:test";
import assert from "node:assert/strict";
import Decimal from "decimal.js";
import { buildSchedule, assertScheduleConservation } from "./scheduleEngine.js";

test("BUG-006 declining", () => {
  const s = buildSchedule("declining_balance", {
    principal: "1200",
    annualRate: "0.12",
    periods: "12",
    startDate: "2026-01-01",
  });
  assert.equal(s.rows.length, 12);
  assert.ok(s.rows[11].balance === '0' || s.rows[11].balance === '0.00');
});

test("BUG-006 qarz", () => {
  const s = buildSchedule("qarz_al_hasaneh", {
    principal: "1000",
    periods: "10",
    startDate: "2026-01-01",
    feePercent: "0.04",
  });
  assert.ok(s.rows[0].interest === "0" || s.rows[0].interest === "0.00");
  assert.ok(new Decimal(s.rows[0].fee).gt(0));
});

test("P0-CODE-010 rejects fractional periods", () => {
  assert.throws(() =>
    buildSchedule("declining_balance", {
      principal: "1000",
      annualRate: "0.1",
      periods: "12.5",
      startDate: "2026-01-01",
    }),
  );
});
test("P0-CODE-010 rejects zero periods", () => {
  assert.throws(() =>
    buildSchedule("flat_rate", {
      principal: "1000",
      annualRate: "0.1",
      periods: "0",
      startDate: "2026-01-01",
    }),
  );
});
test("P0-CODE-011 rejects unsupported day count", () => {
  assert.throws(() =>
    buildSchedule("declining_balance", {
      principal: "1000",
      annualRate: "0.1",
      periods: "12",
      dayCount: "actual_365",
      startDate: "2026-01-01",
    }),
  );
});

test("startDate required", () => {
  assert.throws(() =>
    buildSchedule("declining_balance", {
      principal: "1000",
      annualRate: "0.1",
      periods: "12",
    }),
  );
});


test("P0-02 one-cent principal mismatch fails conservation", () => {
  assert.throws(
    () =>
      assertScheduleConservation(
        [
          { principal: "50.00", interest: "0" },
          { principal: "49.99", interest: "0" },
        ],
        { principal: "100.00" },
      ),
    /LOAN_SCHEDULE_PRINCIPAL_MISMATCH/,
  );
});

test("P0-02 exact conservation passes after residual absorb", () => {
  assertScheduleConservation(
    [
      { principal: "33.33", interest: "0" },
      { principal: "33.33", interest: "0" },
      { principal: "33.34", interest: "0" },
    ],
    { principal: "100.00" },
  );
});

test("P1-01 annual frequency declining conserves principal", () => {
  const s = buildSchedule("declining_balance", {
    principal: "1200.00",
    annualRate: "12",
    periods: "3",
    startDate: "2026-01-01",
    frequency: "annual",
  });
  assert.equal(s.rows.length, 3);
  assert.ok(s.rows[2].balance === "0.00" || s.rows[2].balance === "0");
  const sum = s.rows.reduce((a, r) => a.plus(new Decimal(r.principal)), new Decimal(0));
  assert.equal(sum.toFixed(2), "1200.00");
});

test("declining monthly residual conservation exact", () => {
  const s = buildSchedule("declining_balance", {
    principal: "1000.00",
    annualRate: "18",
    periods: "12",
    startDate: "2026-01-01",
    frequency: "monthly",
  });
  const sp = s.rows.reduce((a, r) => a.plus(new Decimal(r.principal)), new Decimal(0));
  assert.equal(sp.toFixed(2), "1000.00");
});
