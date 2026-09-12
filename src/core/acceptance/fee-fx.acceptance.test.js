import test from "node:test";
import assert from "node:assert/strict";
import { toDecimal } from "../money/canonicalDecimal.js";

/** MATH-009: fee in foreign currency must carry rates — never re-infer live */
function feeInBase({ feeAmount, feeCurrency, legCurrency, feeToLegRate, feeToBaseRate, baseCurrency }) {
  if (feeCurrency === baseCurrency) return toDecimal(feeAmount);
  if (feeToBaseRate) return toDecimal(feeAmount).times(toDecimal(feeToBaseRate));
  if (feeCurrency === legCurrency && feeToLegRate) {
    throw new Error("FEE_TO_BASE_REQUIRED");
  }
  throw new Error("FEE_FX_CONTEXT_REQUIRED");
}

test("MATH-009 missing fee FX context rejected", () => {
  assert.throws(
    () =>
      feeInBase({
        feeAmount: "10",
        feeCurrency: "USD",
        legCurrency: "IRR",
        baseCurrency: "IRR",
      }),
    /FEE_FX_CONTEXT_REQUIRED/,
  );
});

test("MATH-009 feeToBaseRate applied", () => {
  const b = feeInBase({
    feeAmount: "10",
    feeCurrency: "USD",
    legCurrency: "IRR",
    feeToBaseRate: "50000",
    baseCurrency: "IRR",
  });
  assert.equal(b.toFixed(), "500000");
});
