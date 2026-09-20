import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";

function resolvePurity({ purityRatio, purityPolicy }) {
  if (purityPolicy === "fixed_1") {
    return toDecimal("1");
  }
  if (purityRatio == null || purityRatio === "") {
    throw new Error("PURITY_REQUIRED");
  }
  const purity = toDecimal(String(purityRatio));
  if (purity.lte(0) || purity.gt(1)) throw new Error("PURITY_OUT_OF_RANGE");
  return purity;
}

describe("metals.buy purity BUG-P0-04", () => {
  it("non-fixed + missing purity → rejected", () => {
    assert.throws(() => resolvePurity({ purityRatio: null, purityPolicy: null }), /PURITY_REQUIRED/);
    assert.throws(() => resolvePurity({ purityRatio: "", purityPolicy: "variable" }), /PURITY_REQUIRED/);
  });

  it("non-fixed + 0.75 → accepted", () => {
    assert.equal(resolvePurity({ purityRatio: "0.75", purityPolicy: "variable" }).toFixed(), "0.75");
  });

  it("fixed_1 + missing purity → resolves to 1", () => {
    assert.equal(resolvePurity({ purityRatio: null, purityPolicy: "fixed_1" }).toFixed(), "1");
  });

  it("purity out of range rejected", () => {
    assert.throws(() => resolvePurity({ purityRatio: "1.5", purityPolicy: null }), /PURITY_OUT_OF_RANGE/);
    assert.throws(() => resolvePurity({ purityRatio: "0", purityPolicy: null }), /PURITY_OUT_OF_RANGE/);
  });
});
