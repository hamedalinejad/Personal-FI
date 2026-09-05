import test from "node:test";
import assert from "node:assert/strict";
import { transferCost } from "./transferCost.js";

test("BUG-CODE-002 conserves cost", () => {
  const r = transferCost({
    grossQuantity: "1",
    feeQuantity: "0.001",
    netQuantity: "0.999",
    sourceUnitCost: "100",
  });
  assert.equal(r.sourceCostReleased, '100');
  assert.ok(Math.abs(Number(r.destinationCarrying) - 99.9) < 1e-9);
  assert.ok(Math.abs(Number(r.feeCarrying) - 0.1) < 1e-9);
  assert.ok(
    Math.abs(
      Number(r.feeCarrying) -
        (Number(r.sourceCostReleased) - Number(r.destinationCarrying)),
    ) < 1e-12,
  );
});

test("BUG-CODE-002 rejects negative gross", () => {
  assert.throws(() =>
    transferCost({
      grossQuantity: "-1",
      feeQuantity: "0",
      netQuantity: "-1",
      sourceUnitCost: "1",
    }),
  );
});

test("BUG-CODE-002 rejects gross≠net+fee", () => {
  assert.throws(() =>
    transferCost({
      grossQuantity: "1",
      feeQuantity: "0.1",
      netQuantity: "0.5",
      sourceUnitCost: "1",
    }),
  );
});
