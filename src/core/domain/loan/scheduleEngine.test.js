import test from "node:test";
import assert from "node:assert/strict";
import { buildSchedule } from "./scheduleEngine.js";

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
  assert.ok(Number(s.rows[0].fee) > 0);
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
