import test from "node:test";
import assert from "node:assert/strict";
import {
  applySingleFee,
  buildFeeEvents,
  normalizeFeeTreatment,
  CANONICAL_FEE_TREATMENTS,
} from "./feeEngine.js";

test("canonical treatments list locked", () => {
  assert.ok(CANONICAL_FEE_TREATMENTS.includes("capitalize_inventory"));
  assert.ok(CANONICAL_FEE_TREATMENTS.includes("reduce_received_quantity"));
});

test("aliases normalize to canonical", () => {
  assert.equal(normalizeFeeTreatment("capitalized_cost"), "capitalize_inventory");
  assert.equal(normalizeFeeTreatment("fee_from_received"), "reduce_received_quantity");
  assert.equal(normalizeFeeTreatment("from_cash"), "embedded_in_gross_cash");
});

test("missing treatment rejects", () => {
  assert.throws(() => normalizeFeeTreatment(null), /FEE_TREATMENT_REQUIRED/);
  assert.throws(
    () =>
      buildFeeEvents([{ feeAmount: "1", feeCurrency: "IRR" }], {
        baseCurrency: "IRR",
        transactionCurrency: "IRR",
      }),
    /FEE_TREATMENT_REQUIRED/,
  );
});

test("capitalize_inventory posts GL legs (alias capitalized_cost accepted)", () => {
  const r = applySingleFee(
    { feeAmount: "10", feeCurrency: "IRR", treatment: "capitalized_cost" },
    { baseCurrency: "IRR", transactionCurrency: "IRR", exchangeRateToBase: "1" },
  );
  assert.equal(r.carryingDeltaBase, "10");
  assert.equal(r.journalLines.length, 2);
  assert.equal(r.derivedFeeBases[0].treatment, "capitalize_inventory");
});

test("expense fee posts balanced journal", () => {
  const r = applySingleFee(
    { feeAmount: "5", feeCurrency: "IRR", treatment: "expense" },
    { baseCurrency: "IRR", transactionCurrency: "IRR", exchangeRateToBase: "1" },
  );
  assert.equal(r.carryingDeltaBase, "0");
  assert.equal(r.journalLines.length, 2);
});

test("reduce_received_quantity uses feeQuantity not feeAmount money", () => {
  const r = applySingleFee(
    {
      feeQuantity: "0.01",
      feeCurrency: "BTC",
      treatment: "reduce_received_quantity",
      feeInstrumentId: "asset-1",
    },
    {
      baseCurrency: "IRR",
      transactionCurrency: "IRR",
      exchangeRateToBase: "1",
      receivedInstrumentId: "asset-1",
      receivedQuantityUnit: "asset",
    },
  );
  assert.equal(r.quantityDelta, "-0.01");
  assert.equal(r.carryingDeltaBase, "0");
});

test("reduce_received_quantity rejects money-only feeAmount", () => {
  assert.throws(
    () =>
      applySingleFee(
        {
          feeAmount: "10",
          feeCurrency: "USDT",
          treatment: "fee_from_received",
          feeInstrumentId: "asset-1",
        },
        {
          baseCurrency: "USDT",
          transactionCurrency: "USDT",
          exchangeRateToBase: "1",
          receivedInstrumentId: "asset-1",
        },
      ),
    /FEE_QUANTITY_REQUIRED/,
  );
});

test("reduce_received_quantity without context rejects", () => {
  assert.throws(
    () =>
      applySingleFee(
        { feeQuantity: "0.01", feeCurrency: "IRR", treatment: "fee_from_received" },
        { baseCurrency: "IRR", transactionCurrency: "IRR", exchangeRateToBase: "1" },
      ),
    /FEE_FROM_RECEIVED_CONTEXT_REQUIRED/,
  );
});

test("equity_adjustment deferred without allowEquityAdjustment", () => {
  assert.throws(() => normalizeFeeTreatment("equity_adjustment"), /FEE_TREATMENT_DEFERRED/);
  assert.equal(normalizeFeeTreatment("equity_adjustment", { allowEquityAdjustment: true }), "equity_adjustment");
});

test("treatment required — no silent expense default", () => {
  assert.throws(() => normalizeFeeTreatment(null), /FEE_TREATMENT_REQUIRED/);
  assert.throws(() => normalizeFeeTreatment(""), /FEE_TREATMENT_REQUIRED/);
});
