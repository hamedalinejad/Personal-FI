import test from "node:test";
import assert from "node:assert/strict";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import { allocatePayment, allocationJournalLines } from "../domain/paymentAllocation.js";

test("waterfall penalty fee interest principal", () => {
  const a = allocatePayment({
    amount: "150",
    outstanding: { penalty: "10", fee: "20", interest: "30", principal: "100" },
  });
  assert.equal(a.penalty, "10");
  assert.equal(a.fee, "20");
  assert.equal(a.interest, "30");
  assert.equal(a.principal, "90");
  assert.equal(a.total, "150");
});

test("allocation journal balances", () => {
  const allocation = allocatePayment({
    amount: "100",
    outstanding: { penalty: "0", fee: "0", interest: "40", principal: "100" },
  });
  const lines = allocationJournalLines({
    allocation,
    currency: "IRR",
    cashAccountId: "cash",
    receivableAccountId: "rec",
    interestIncomeId: "int",
    feeIncomeId: "fee",
    penaltyIncomeId: "pen",
  });
  let d = toDecimal("0");
  let c = toDecimal("0");
  for (const l of lines) {
    if (l.side === "debit") d = d.plus(toDecimal(String(l.amount)));
    else c = c.plus(toDecimal(String(l.amount)));
  }
  assert.ok(d.eq(c));
});
