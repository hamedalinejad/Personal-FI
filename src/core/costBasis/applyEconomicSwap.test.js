import test from "node:test";
import assert from "node:assert/strict";
import { applyEconomicSwap } from "./applyEconomicSwap.js";

test("BUG-CODE-004 uses consideration not market", () => {
  const r = applyEconomicSwap({
    sourceQty: "1",
    sourceCarryingCost: "80",
    consideration: "100",
    fee: "1",
  });
  assert.equal(Number(r.destinationCostBasis), 101);
  assert.equal(Number(r.realizedPnl), 20);
});

test("BUG-CODE-004 rejects non-positive consideration", () => {
  assert.throws(() =>
    applyEconomicSwap({
      sourceQty: "1",
      sourceCarryingCost: "1",
      consideration: "0",
    }),
  );
});
