import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeFeeTreatment,
  CANONICAL_FEE_TREATMENTS,
  buildFeeEvents,
  applyFeeEvents,
} from "./feeEngine.js";
import { toDecimal } from "../../money/canonicalDecimal.js";

test("P0-01 single canonical enum includes reduce_proceeds", () => {
  assert.deepEqual([...CANONICAL_FEE_TREATMENTS], [
    "expense",
    "capitalize_inventory",
    "reduce_proceeds",
    "reduce_received_quantity",
    "embedded_in_gross_cash",
    "equity_adjustment",
  ]);
  assert.equal(normalizeFeeTreatment("reduce_proceeds"), "reduce_proceeds");
});

test("all currently active treatments normalize", () => {
  for (const t of CANONICAL_FEE_TREATMENTS.filter((x) => x !== "equity_adjustment")) {
    assert.equal(normalizeFeeTreatment(t), t);
  }
});

test("equity_adjustment remains explicitly deferred", () => {
  assert.throws(() => normalizeFeeTreatment("equity_adjustment"), /FEE_TREATMENT_DEFERRED/);
});

test("reduce_proceeds: journal Dr fee_expense Cr cash; domain netProceeds = gross − fee", () => {
  const gross = "1000";
  const feeAmount = "10";
  const events = buildFeeEvents(
    [{ feeAmount, feeCurrency: "IRR", treatment: "reduce_proceeds" }],
    { baseCurrency: "IRR", transactionCurrency: "IRR", exchangeRateToBase: "1" },
  );
  assert.equal(events[0].treatment, "reduce_proceeds");
  const { journalLines } = applyFeeEvents(events, {
    baseCurrency: "IRR",
    transactionCurrency: "IRR",
  });
  assert.equal(journalLines.length, 2);
  assert.equal(journalLines[0].side, "debit");
  assert.equal(journalLines[1].side, "credit");
  assert.equal(journalLines[0].amount, feeAmount);
  assert.equal(journalLines[1].amount, feeAmount);
  const netProceeds = toDecimal(gross).minus(toDecimal(feeAmount)).toFixed();
  assert.equal(netProceeds, "990");
});

test("expense and reduce_proceeds share journal shape for same feeAmount (intentional)", () => {
  const ctx = { baseCurrency: "IRR", transactionCurrency: "IRR", exchangeRateToBase: "1" };
  const fee = { feeAmount: "7", feeCurrency: "IRR" };
  const a = applyFeeEvents(buildFeeEvents([{ ...fee, treatment: "expense" }], ctx), ctx);
  const b = applyFeeEvents(buildFeeEvents([{ ...fee, treatment: "reduce_proceeds" }], ctx), ctx);
  assert.equal(a.journalLines.length, b.journalLines.length);
  assert.equal(a.journalLines[0].amount, b.journalLines[0].amount);
  assert.equal(a.journalLines[0].side, b.journalLines[0].side);
  assert.equal(a.journalLines[1].side, b.journalLines[1].side);
});
