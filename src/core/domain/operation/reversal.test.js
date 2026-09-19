import test from "node:test";
import assert from "node:assert/strict";
import { buildInverseJournalLines, assertReversalAllowed } from "./reversal.js";
import { assertJournalBalanced } from "../invariants/index.js";

test("inverse journal flips sides and balances", () => {
  const original = [
    {
      accountId: "cash",
      side: "debit",
      amount: "100",
      currency: "IRR",
      amountInBase: "100",
      exchangeRateToBase: "1",
    },
    {
      accountId: "income",
      side: "credit",
      amount: "100",
      currency: "IRR",
      amountInBase: "100",
      exchangeRateToBase: "1",
    },
  ];
  const inv = buildInverseJournalLines(original);
  assert.equal(inv[0].side, "credit");
  assert.equal(inv[1].side, "debit");
  assertJournalBalanced(inv, { baseCurrency: "IRR", posted: true });
});

test("assertReversalAllowed requires posted", () => {
  assert.throws(() => assertReversalAllowed({ status: "draft" }), /REVERSAL_ORIGINAL_NOT_POSTED/);
  assert.doesNotThrow(() => assertReversalAllowed({ status: "posted" }));
});
