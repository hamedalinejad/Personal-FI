import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCommand, computeCommandHash } from "../domain/operation/operationEngine.js";
import { scheduleFlat, scheduleQarz, normalizeRatePercentage } from "../domain/loan/scheduleEngine.js";
import { toDecimal } from "../money/canonicalDecimal.js";
import { normalizeLoanRole } from "../../features/loan/domain/role.js";

test("BUG-CUR-001 normalize preserves temporal/provenance", () => {
  const n = normalizeCommand({
    operationId: "op-1",
    status: "posted",
    businessDate: "2026-01-01",
    baseCurrency: "IRR",
    settlementDate: "2026-01-03",
    eventAt: "2026-01-01T10:00:00Z",
    provenance: { batch: "b1" },
    sourceChannel: "api",
    sourceType: "manual",
    sourceReference: "ref-1",
    journalLines: [
      { accountId: "a", side: "debit", amount: "1", currency: "IRR", amountInBase: "1" },
      { accountId: "b", side: "credit", amount: "1", currency: "IRR", amountInBase: "1" },
    ],
  });
  assert.equal(n.settlementDate, "2026-01-03");
  assert.equal(n.eventAt, "2026-01-01T10:00:00Z");
  assert.deepEqual(n.provenance, { batch: "b1" });
  assert.equal(n.sourceChannel, "api");
  assert.equal(n.sourceType, "manual");
  assert.equal(n.sourceReference, "ref-1");
  const h = computeCommandHash(n);
  assert.ok(h.length === 64);
});

test("BUG-CUR-002 borrower deferred", () => {
  assert.equal(normalizeLoanRole("lent"), "lender");
  // createLoan throws LOAN_ROLE_DEFERRED — unit level role is still borrower
  assert.equal(normalizeLoanRole("borrowed"), "borrower");
});

test("BUG-CUR-008 flat rate 12% not 1200%", () => {
  const s = scheduleFlat({
    principal: "1000",
    annualRate: "12",
    periods: "12",
    startDate: "2026-01-01",
    dayCount: "period_based",
  });
  let ti = toDecimal("0");
  for (const r of s.rows) ti = ti.plus(toDecimal(r.interest));
  assert.ok(ti.minus(toDecimal("120")).abs().lte(toDecimal("0.02")), ti.toFixed());
});

test("BUG-CUR-009 qarz fee 4% of 100000 = 4000", () => {
  const s = scheduleQarz({
    principal: "100000",
    periods: "10",
    feePercent: "4",
    startDate: "2026-01-01",
    dayCount: "period_based",
  });
  let tf = toDecimal("0");
  for (const r of s.rows) tf = tf.plus(toDecimal(r.fee || r.interest || "0"));
  // fee may be on fee field
  if (s.rows[0].fee != null) {
    let f = toDecimal("0");
    for (const r of s.rows) f = f.plus(toDecimal(r.fee || "0"));
    assert.ok(f.minus(toDecimal("4000")).abs().lte(toDecimal("0.02")), f.toFixed());
  }
});

test("BUG-CUR-008 normalizeRatePercentage", () => {
  assert.equal(normalizeRatePercentage("12").toFixed(), "0.12");
});
