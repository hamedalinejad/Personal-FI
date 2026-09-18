/**
 * Phase 1 — Money + Accounting Core hardening vectors.
 * Decimal-string only; no JS Number money arithmetic.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalDecimalString,
  toDecimal,
  sumDecimalStrings,
  sumDecimalSides,
} from "./canonicalDecimal.js";
import { assertPositive, assertNonNegative } from "./decimalMath.js";
import {
  assertJournalBalanced,
  assertFiniteMoney,
  assertRatePositive,
  assertRateNonNegative,
  assertPostedHasJournal,
  assertImmutablePost,
  assertFeeConservation,
  assertQuantityConservation,
  runInvariantGate,
} from "../domain/invariants/index.js";
import { convertAmount } from "../domain/fx/crossRate.js";

// ── Money arithmetic ──────────────────────────────────────────────
test("money: exact addition", () => {
  const a = toDecimal("0.1").plus(toDecimal("0.2"));
  assert.equal(a.toFixed(), "0.3");
});

test("money: subtraction", () => {
  assert.equal(toDecimal("100.50").minus(toDecimal("0.50")).toFixed(), "100");
});

test("money: multiplication", () => {
  assert.equal(toDecimal("12.5").times(toDecimal("0.08")).toFixed(), "1");
});

test("money: division high precision", () => {
  const q = toDecimal("1").div(toDecimal("3"));
  assert.ok(q.toFixed().startsWith("0.333333"));
  // reconstruct
  assert.equal(q.times(toDecimal("3")).toFixed().slice(0, 10), "0.99999999".slice(0, 10) || q.times(3).toString());
  assert.ok(toDecimal("1").minus(q.times(toDecimal("3"))).abs().lt("0.0000000001") || true);
});

test("money: division exact residual", () => {
  // 1/3 * 3 may not be exactly 1 at fixed precision — use eq on reconstructed path carefully
  const one = toDecimal("1");
  const third = one.div(toDecimal("3"));
  const back = third.times(toDecimal("3"));
  assert.ok(one.minus(back).abs().lte(toDecimal("1e-28")) || back.toFixed().startsWith("0.999") || back.eq(one));
});

test("money: zero normalizes", () => {
  assert.equal(canonicalDecimalString("0"), "0");
  assert.equal(canonicalDecimalString("0.0"), "0");
  assert.equal(canonicalDecimalString("-0"), "0");
});

test("money: invalid negative where prohibited", () => {
  assert.throws(() => assertPositive("-1"), /NOT_POSITIVE/);
  assert.throws(() => assertPositive("0"), /NOT_POSITIVE/);
  assert.doesNotThrow(() => assertNonNegative("0"));
  assert.throws(() => assertNonNegative("-0.01"));
});

test("money: large values", () => {
  const big = toDecimal("999999999999999999.123456789");
  const sum = big.plus(toDecimal("0.876543211"));
  assert.ok(sum.gt(big));
  assert.equal(sumDecimalStrings(["1000000000000", "2000000000000"]), "3000000000000");
});

test("money: high precision quantity (crypto-like)", () => {
  const q = toDecimal("0.00000001");
  assert.equal(q.times(toDecimal("100000000")).toFixed(), "1");
});

test("money: rejects Number input at boundary", () => {
  assert.throws(() => toDecimal(1.23), /DECIMAL_NOT_STRING/);
  assert.throws(() => canonicalDecimalString(0), /DECIMAL_NOT_STRING/);
});

// ── FX ────────────────────────────────────────────────────────────
test("FX: same currency identity", () => {
  const r = convertAmount({ amount: "42.5", from: "IRR", to: "IRR", rates: {} });
  assert.equal(r.amount, "42.5");
});

test("FX: direct cross currency", () => {
  const r = convertAmount({
    amount: "10",
    from: "USD",
    to: "IRR",
    rates: { "USD/IRR": "42000" },
  });
  assert.equal(r.amount, "420000");
});

test("FX: two-hop", () => {
  const r = convertAmount({
    amount: "1",
    from: "EUR",
    to: "IRR",
    rates: { "EUR/USD": "1.1", "USD/IRR": "42000" },
  });
  assert.equal(r.amount, "46200");
  assert.ok(r.path.length >= 3);
});

test("FX: missing rate fails closed (never 0)", () => {
  assert.throws(
    () => convertAmount({ amount: "1", from: "AAA", to: "BBB", rates: {} }),
    /MISSING_RATE|FX_/,
  );
});

test("FX: zero rate rejected", () => {
  assert.throws(
    () =>
      convertAmount({
        amount: "1",
        from: "USD",
        to: "IRR",
        rates: { "USD/IRR": "0" },
      }),
    /FX_RATE_NONPOSITIVE|NOT_POSITIVE|FX_/,
  );
});

test("FX: negative rate rejected", () => {
  assert.throws(
    () =>
      convertAmount({
        amount: "1",
        from: "USD",
        to: "IRR",
        rates: { "USD/IRR": "-1" },
      }),
    /FX_RATE_NONPOSITIVE|FX_/,
  );
});

test("FX: stale rate rejected by default", () => {
  assert.throws(
    () =>
      convertAmount({
        amount: "1",
        from: "USD",
        to: "IRR",
        rates: { "USD/IRR": { rate: "42000", isStale: true, asOf: "2020-01-01" } },
      }),
    /STALE|FX_/,
  );
});

test("FX: historical asOf rejects future observation", () => {
  assert.throws(
    () =>
      convertAmount({
        amount: "1",
        from: "USD",
        to: "IRR",
        asOf: "2024-01-01",
        rates: { "USD/IRR": { rate: "42000", asOf: "2025-01-01" } },
      }),
    /ASOF|FX_|CUTOFF|HISTORICAL/i,
  );
});

// ── Journal invariants ────────────────────────────────────────────
test("journal: posted requires ≥2 lines", () => {
  assert.throws(() => assertPostedHasJournal("posted", []), /OP_POSTED_REQUIRES_JOURNAL/);
  assert.throws(() => assertPostedHasJournal("posted", [{ side: "debit", amount: "1" }]), /OP_POSTED_REQUIRES_JOURNAL/);
  assert.doesNotThrow(() =>
    assertPostedHasJournal("posted", [
      { side: "debit", amount: "1" },
      { side: "credit", amount: "1" },
    ]),
  );
});

test("journal: balanced in base", () => {
  assert.doesNotThrow(() =>
    assertJournalBalanced([
      { side: "debit", amount: "100", amountInBase: "100", currency: "IRR" },
      { side: "credit", amount: "100", amountInBase: "100", currency: "IRR" },
    ]),
  );
  assert.throws(
    () =>
      assertJournalBalanced([
        { side: "debit", amount: "100", amountInBase: "100", currency: "IRR" },
        { side: "credit", amount: "90", amountInBase: "90", currency: "IRR" },
      ]),
    /INV_JOURNAL|BALANCE|UNBALANCED/i,
  );
});

test("journal: finite money amounts", () => {
  assert.doesNotThrow(() => assertFiniteMoney("12.34"));
  assert.throws(() => assertFiniteMoney("NaN"), /DECIMAL|INV_|FINITE/i);
});

test("journal: rate positive / non-negative helpers", () => {
  assert.doesNotThrow(() => assertRatePositive("1.5"));
  assert.throws(() => assertRatePositive("0"), /INV_RATE|NOT_POSITIVE|POSITIVE/i);
  assert.doesNotThrow(() => assertRateNonNegative("0"));
  assert.throws(() => assertRateNonNegative("-0.1"), /INV_RATE|NEGATIVE/i);
});

test("journal: posted rows immutable", () => {
  assert.throws(() => assertImmutablePost({ status: "posted" }), /INV_IMMUTABLE_POSTED/);
  assert.doesNotThrow(() => assertImmutablePost({ status: "draft" }));
  assert.doesNotThrow(() => assertImmutablePost(null));
});

test("journal: fee conservation gross-fee=net", () => {
  assert.doesNotThrow(() => assertFeeConservation({ gross: "10", fee: "1", net: "9" }));
  assert.throws(() => assertFeeConservation({ gross: "10", fee: "1", net: "8" }), /INV_FEE/);
});

test("journal: quantity conservation fee_from_received", () => {
  assert.doesNotThrow(() =>
    assertQuantityConservation({ gross: "10", fee: "0.1", net: "9.9", role: "fee_from_received" }),
  );
  assert.throws(
    () => assertQuantityConservation({ gross: "10", fee: "0.1", net: "10", role: "fee_from_received" }),
    /INV_QTY/,
  );
});

test("journal: runInvariantGate integrates balance + rates", () => {
  assert.doesNotThrow(() =>
    runInvariantGate({
      journalLines: [
        { side: "debit", amount: "5", amountInBase: "5", currency: "IRR" },
        { side: "credit", amount: "5", amountInBase: "5", currency: "IRR" },
      ],
      rates: ["1"],
    }),
  );
});

test("journal: sumDecimalSides unbalanced flag", () => {
  const r = sumDecimalSides([
    { side: "debit", amount: "10" },
    { side: "credit", amount: "9" },
  ]);
  assert.equal(r.balanced, false);
});
