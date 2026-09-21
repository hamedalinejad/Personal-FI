import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyCorporateAction } from "./corporateAction.js";

describe("corporateAction Decimal", () => {
  it("split doubles qty, preserves cost", () => {
    const r = applyCorporateAction(
      { quantity: "10", totalInvested: "1000" },
      { type: "split", ratio: "2" }
    );
    assert.equal(r.quantity, "20");
    assert.equal(r.totalInvested, "1000");
    assert.equal(r.averageCost, "50");
  });
});
