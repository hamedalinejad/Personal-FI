import test from "node:test";
import assert from "node:assert/strict";
import { acquisitionFeeFromReceived } from "./acquisitionFeeFromReceived.js";

test("BUG-CODE-003 valid", () => {
  const r = acquisitionFeeFromReceived({
    gross: "1",
    fee: "0.001",
    consideration: "1000",
  });
  assert.ok(Number(r.netQuantity) > 0);
});

test("BUG-CODE-003 fee >= gross reject", () => {
  assert.throws(() =>
    acquisitionFeeFromReceived({ gross: "1", fee: "1", consideration: "10" }),
  );
});

test("BUG-CODE-003 consideration <= 0 reject", () => {
  assert.throws(() =>
    acquisitionFeeFromReceived({ gross: "1", fee: "0", consideration: "0" }),
  );
});
