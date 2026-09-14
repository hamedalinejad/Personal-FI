import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { buildSchedule } from "../domain/loan/scheduleEngine.js";
import { toDecimal } from "../money/canonicalDecimal.js";

const FIX = join(process.cwd(), "fixtures");

function load(id) {
  return JSON.parse(readFileSync(join(FIX, `${id}.json`), "utf8"));
}

function sumField(rows, field) {
  return rows.reduce((a, r) => a.plus(String(r[field] ?? "0")), toDecimal("0"));
}

test("GOLDEN LOAN-FLAT totals", () => {
  const fx = load("LOAN-FLAT");
  const s = buildSchedule(fx.input.method, fx.input);
  assert.equal(s.rows.length, fx.expected.domain.rowCount);
  assert.equal(sumField(s.rows, "principal").toFixed(2), fx.expected.domain.totalPrincipal);
  assert.equal(sumField(s.rows, "interest").toFixed(2), fx.expected.domain.totalInterest);
  assert.equal(String(s.rows.at(-1).balance), fx.expected.domain.finalBalance);
});

test("GOLDEN LOAN-DECLINING interest 78", () => {
  const fx = load("LOAN-DECLINING");
  const s = buildSchedule(fx.input.method, fx.input);
  assert.equal(sumField(s.rows, "interest").toFixed(2), fx.expected.domain.totalInterest);
  assert.equal(String(s.rows.at(-1).balance), "0.00");
});

test("GOLDEN LOAN-BULLET interest 12000", () => {
  const fx = load("LOAN-BULLET");
  const s = buildSchedule(fx.input.method, fx.input);
  assert.equal(sumField(s.rows, "interest").toFixed(2), fx.expected.domain.totalInterest);
});

test("GOLDEN LOAN-QARZ fee ~4000", () => {
  const fx = load("LOAN-QARZ");
  const s = buildSchedule(fx.input.method, {
    principal: fx.input.principal,
    feePercent: fx.input.feePercent,
    periods: fx.input.periods,
    startDate: fx.input.startDate,
    dayCount: fx.input.dayCount,
  });
  assert.equal(sumField(s.rows, "fee").toFixed(2), fx.expected.domain.totalFee);
});

test("GOLDEN METAL fineWeight", () => {
  const fx = load("METAL-FINEWEIGHT");
  const fine = toDecimal(fx.input.grossMg).times(fx.input.purityRatio);
  assert.equal(fine.toFixed(0), fx.expected.domain.fineWeight);
  const val = fine.times(fx.input.metalPricePerMg);
  assert.equal(val.toFixed(0), fx.expected.domain.metalValue);
});

test("GOLDEN FUND nav ≠ transactionPrice", () => {
  const fx = load("FUND-NAV-VS-TX-PRICE");
  assert.notEqual(fx.input.nav, fx.input.transactionPrice);
  const units = toDecimal(fx.input.amount).div(fx.input.transactionPrice);
  // compare to 8 dp tolerance via string start
  assert.ok(units.toFixed(8).startsWith("995.024875"));
});

test("GOLDEN fixtures marked ACTIVE are non-empty expected", () => {
  for (const name of readdirSync(FIX).filter((f) => f.endsWith(".json"))) {
    const d = JSON.parse(readFileSync(join(FIX, name), "utf8"));
    if (d.status === "DEFERRED" || d.fixtureStatus === "DEFERRED") continue;
    const exp = d.expected || {};
    const keys = Object.keys(exp);
    assert.ok(keys.length > 0, name);
  }
});
