import test from "node:test";
import assert from "node:assert/strict";
import {
  applyAcquisition,
  applyDisposal,
  applyTransfer,
  applyFee,
} from "./engine.js";

test("BUG-005 acquisition and disposal", () => {
  let s = applyAcquisition(
    { quantity: "0", totalInvested: "0" },
    { quantity: "2", costTotal: "200" },
  );
  assert.ok(s.averageCost === '100' || s.averageCost.startsWith('100'));
  s = applyDisposal(s, { quantity: "1", proceeds: "150" });
  assert.ok(s.realizedPnl === '50' || s.realizedPnl.startsWith('50'));
  assert.ok(s.quantity === '1' || s.quantity.startsWith('1'));
});

test("BUG-005 transfer conserves", () => {
  const from0 = applyAcquisition(
    { quantity: "0", totalInvested: "0" },
    { quantity: "1", costTotal: "100" },
  );
  const { from, to, transfer } = applyTransfer(from0, null, {
    grossQuantity: "1",
    feeQuantity: "0.001",
    netQuantity: "0.999",
    sourceUnitCost: "100",
  });
  assert.equal(from.realizedPnl, "0");
  assert.ok(Number(to.quantity) > 0);
  assert.ok(Number(transfer.feeCarrying) > 0);
});
