import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertMoneyString,
  resolveFxRate,
  fineWeightMg,
  gramsToMg,
  cryptoNetFromGross,
  allocateLoanPayment,
  assertFundPricingMode,
} from "./financialRules.js";

describe("financial rules §24", () => {
  it("rejects Number at money boundary", () => {
    assert.throws(() => assertMoneyString(1000), /MONEY_MUST_BE_DECIMAL_STRING/);
  });

  it("accepts decimal string", () => {
    assert.equal(assertMoneyString("1000.50"), "1000.5");
  });

  it("FX identity when same currency", () => {
    assert.deepEqual(resolveFxRate("IRR", "IRR", null), { rate: "1", isCross: false });
  });

  it("FX requires positive explicit rate cross", () => {
    assert.throws(() => resolveFxRate("IRR", "USD", null), /FX_REQUIRED/);
    assert.throws(() => resolveFxRate("IRR", "USD", "0"), /FX_MUST_BE_POSITIVE/);
    assert.equal(resolveFxRate("IRR", "USD", "42000").rate, "42000");
  });

  it("metals fine weight and g→mg", () => {
    assert.equal(fineWeightMg("1000", "0.75"), "750");
    assert.equal(gramsToMg("1"), "1000");
  });

  it("crypto net conservation", () => {
    assert.equal(cryptoNetFromGross("1.5", "0.1"), "1.4");
    assert.throws(() => cryptoNetFromGross("1", "2"), /INV_QTY_CONSERVATION/);
  });

  it("loan allocation order penalty→fee→interest→principal", () => {
    const a = allocateLoanPayment("1000", {
      penalty: "100",
      fee: "50",
      interest: "200",
      principalDue: "10000",
    });
    assert.equal(a.penalty, "100");
    assert.equal(a.fee, "50");
    assert.equal(a.interest, "200");
    assert.equal(a.principal, "650");
    assert.equal(a.residual, "0");
  });

  it("funds NAV not used unless mode NAV", () => {
    assert.equal(assertFundPricingMode("explicit", "10", "12"), "12");
    assert.equal(assertFundPricingMode("NAV", "10", "12"), "10");
    assert.throws(() => assertFundPricingMode("explicit", "10", null), /TRANSACTION_PRICE/);
  });
});
