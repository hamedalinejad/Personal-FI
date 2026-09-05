import test from "node:test";
import assert from "node:assert/strict";
import { applyCorporateAction } from "./corporateAction.js";

test("BUG-013 bonus", () => {
  const h = applyCorporateAction(
    { quantity: "100", totalInvested: "1000" },
    { type: "bonus", ratio: "1.2" },
  );
  assert.equal(Number(h.quantity), 120);
  assert.equal(Number(h.totalInvested), 1000);
});
