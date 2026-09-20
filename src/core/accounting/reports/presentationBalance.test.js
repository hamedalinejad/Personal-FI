import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { presentationBalance, normalSide } from "./presentationBalance.js";

describe("presentationBalance", () => {
  it("asset normal debit", () => {
    assert.equal(normalSide("asset.bank"), "debit");
    const bal = presentationBalance(
      [
        { side: "debit", amount_in_base: "10000000" },
        { side: "credit", amount_in_base: "500000" },
      ],
      "asset.bank"
    );
    assert.equal(bal, "9500000");
  });

  it("liability normal credit", () => {
    assert.equal(normalSide("liability.loan"), "credit");
    const bal = presentationBalance(
      [
        { side: "credit", amount_in_base: "1000" },
        { side: "debit", amount_in_base: "200" },
      ],
      "liability.loan"
    );
    assert.equal(bal, "800");
  });

  it("empty lines zero", () => {
    assert.equal(presentationBalance([], "asset.cash"), "0");
  });
});
