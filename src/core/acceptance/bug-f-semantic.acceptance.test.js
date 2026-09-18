import test from "node:test";
import assert from "node:assert/strict";
import { assertJournalBalanced } from "../domain/invariants/index.js";
import { scheduleFlat } from "../domain/loan/scheduleEngine.js";
import { convertAmount } from "../domain/fx/crossRate.js";
import { rebuildProjection } from "../rebuild/rebuildProjection.js";

test("BUG-F02 same-currency FX=2 must fail when baseCurrency set", () => {
  assert.throws(
    () =>
      assertJournalBalanced(
        [
          { side: "debit", amount: "100", currency: "IRR", amountInBase: "200", exchangeRateToBase: "2" },
          { side: "credit", amount: "100", currency: "IRR", amountInBase: "200", exchangeRateToBase: "2" },
        ],
        { baseCurrency: "IRR" },
      ),
    /INV_JOURNAL_SAME_CURRENCY_FX_NOT_1/,
  );
});

test("BUG-F09 unknown frequency rejected in scheduleFlat", () => {
  assert.throws(
    () =>
      scheduleFlat({
        principal: "1000",
        annualRate: "12",
        periods: "12",
        startDate: "2026-01-01",
        dayCount: "period_based",
        frequency: "banana",
      }),
    /LOAN_FREQUENCY_UNSUPPORTED/,
  );
});

test("BUG-F08 zero FX rate rejected", () => {
  assert.throws(
    () => convertAmount({ amount: "10", from: "USD", to: "IRR", rates: { "USD/IRR": "0" } }),
    /FX_RATE_NONPOSITIVE/,
  );
});

test("BUG-F07 rebuild without operations fails", () => {
  assert.throws(
    () => rebuildProjection({ asOf: "2026-01-01", sourceLedger: { projections: {} } }),
    /REBUILD_REQUIRES_OPERATIONS/,
  );
});
