/**
 * Phase 1 journal invariant matrix
 */
import test from "node:test";
import assert from "node:assert/strict";
import { assertJournalBalanced } from "./index.js";

const bal = (lines, opts) => assertJournalBalanced(lines, opts);

test("two line same currency balanced → PASS", () => {
  bal([
    { side: "debit", amount: "100", currency: "IRR", amountInBase: "100", exchangeRateToBase: "1" },
    { side: "credit", amount: "100", currency: "IRR", amountInBase: "100", exchangeRateToBase: "1" },
  ], { baseCurrency: "IRR" });
});

test("two line same currency unbalanced → FAIL", () => {
  assert.throws(
    () =>
      bal([
        { side: "debit", amount: "100", currency: "IRR", amountInBase: "100", exchangeRateToBase: "1" },
        { side: "credit", amount: "90", currency: "IRR", amountInBase: "90", exchangeRateToBase: "1" },
      ], { baseCurrency: "IRR" }),
    /INV_JOURNAL|BALANCE|UNBALANCED/i,
  );
});

test("multi-currency without base → FAIL", () => {
  assert.throws(
    () =>
      bal([
        { side: "debit", amount: "1", currency: "USD" },
        { side: "credit", amount: "42000", currency: "IRR" },
      ]),
    /INV_JOURNAL|CURRENCY|BASE/i,
  );
});

test("multi-currency with base → PASS", () => {
  bal([
    { side: "debit", amount: "1", currency: "USD", amountInBase: "42000", exchangeRateToBase: "42000" },
    { side: "credit", amount: "42000", currency: "IRR", amountInBase: "42000", exchangeRateToBase: "1" },
  ], { baseCurrency: "IRR" });
});

test("one line missing base amount → FAIL", () => {
  assert.throws(
    () =>
      bal([
        { side: "debit", amount: "1", currency: "USD", amountInBase: "42000", exchangeRateToBase: "42000" },
        { side: "credit", amount: "42000", currency: "IRR" },
      ], { baseCurrency: "IRR" }),
    /MISSING_AMOUNT_IN_BASE|INV_JOURNAL/i,
  );
});

test("one line bad FX → FAIL", () => {
  assert.throws(
    () =>
      bal([
        { side: "debit", amount: "1", currency: "USD", amountInBase: "42000", exchangeRateToBase: "999" },
        { side: "credit", amount: "42000", currency: "IRR", amountInBase: "42000", exchangeRateToBase: "1" },
      ], { baseCurrency: "IRR" }),
    /FX_MISMATCH|INV_JOURNAL/i,
  );
});

test("same currency with FX != 1 → FAIL", () => {
  assert.throws(
    () =>
      bal([
        { side: "debit", amount: "100", currency: "IRR", amountInBase: "200", exchangeRateToBase: "2" },
        { side: "credit", amount: "100", currency: "IRR", amountInBase: "200", exchangeRateToBase: "2" },
      ], { baseCurrency: "IRR" }),
    /SAME_CURRENCY_FX|INV_JOURNAL/i,
  );
});

test("missing currency → FAIL", () => {
  assert.throws(
    () =>
      bal([
        { side: "debit", amount: "1", amountInBase: "1", exchangeRateToBase: "1" },
        { side: "credit", amount: "1", currency: "IRR", amountInBase: "1", exchangeRateToBase: "1" },
      ], { baseCurrency: "IRR" }),
    /CURRENCY_REQUIRED|INV_JOURNAL/i,
  );
});

test("zero line → FAIL", () => {
  assert.throws(
    () =>
      bal([
        { side: "debit", amount: "0", currency: "IRR", amountInBase: "0", exchangeRateToBase: "1" },
        { side: "credit", amount: "0", currency: "IRR", amountInBase: "0", exchangeRateToBase: "1" },
      ], { baseCurrency: "IRR" }),
    /ZERO_AMOUNT|INV_JOURNAL/i,
  );
});

test("negative line → FAIL", () => {
  assert.throws(
    () =>
      bal([
        { side: "debit", amount: "-1", currency: "IRR", amountInBase: "-1", exchangeRateToBase: "1" },
        { side: "credit", amount: "-1", currency: "IRR", amountInBase: "-1", exchangeRateToBase: "1" },
      ], { baseCurrency: "IRR" }),
    /NEGATIVE|INV_JOURNAL|DECIMAL/i,
  );
});

test("missing side → FAIL", () => {
  assert.throws(
    () =>
      bal([
        { amount: "1", currency: "IRR", amountInBase: "1", exchangeRateToBase: "1" },
        { side: "credit", amount: "1", currency: "IRR", amountInBase: "1", exchangeRateToBase: "1" },
      ], { baseCurrency: "IRR" }),
    /SIDE_REQUIRED|INV_JOURNAL/i,
  );
});

test("posted multi-currency without base fields → FAIL at kernel", () => {
  assert.throws(
    () =>
      bal(
        [
          { side: "debit", amount: "1", currency: "USD" },
          { side: "credit", amount: "1", currency: "USD" },
        ],
        { baseCurrency: "IRR", posted: true },
      ),
    /MISSING_AMOUNT_IN_BASE|INV_JOURNAL/i,
  );
});

test("duplicate line_number → FAIL", () => {
  assert.throws(
    () =>
      assertJournalBalanced(
        [
          {
            accountId: "a",
            side: "debit",
            amount: "10",
            currency: "IRR",
            amountInBase: "10",
            exchangeRateToBase: "1",
            line_number: 1,
          },
          {
            accountId: "b",
            side: "credit",
            amount: "10",
            currency: "IRR",
            amountInBase: "10",
            exchangeRateToBase: "1",
            line_number: 1,
          },
        ],
        { baseCurrency: "IRR", posted: true },
      ),
    /INV_JOURNAL_LINE_NUMBER_DUPLICATE/,
  );
});
