import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canonicalDecimalString, toDecimal } from "./canonicalDecimal.js";

describe("canonicalDecimalString CORE-01", () => {
  it("accepts canonical strings", () => {
    assert.equal(canonicalDecimalString("1"), "1");
    assert.equal(canonicalDecimalString("1.0"), "1");
    assert.equal(canonicalDecimalString("0.00000001"), "0.00000001");
  });
  it("rejects non-string", () => {
    assert.throws(() => canonicalDecimalString(1), /DECIMAL_NOT_STRING/);
  });
  it("rejects empty NaN Infinity", () => {
    assert.throws(() => canonicalDecimalString(""), /DECIMAL_EMPTY/);
    assert.throws(() => canonicalDecimalString("NaN"), /DECIMAL_NON_FINITE/);
    assert.throws(() => canonicalDecimalString("Infinity"), /DECIMAL_NON_FINITE/);
  });
  it("handles scientific notation without Number()", () => {
    const s = canonicalDecimalString("1e-8");
    assert.equal(toDecimal(s).eq(toDecimal("0.00000001")), true);
  });
  it("allows negative for domain that needs it", () => {
    assert.equal(canonicalDecimalString("-1"), "-1");
  });
});
