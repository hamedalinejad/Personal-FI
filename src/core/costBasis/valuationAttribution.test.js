import test from "node:test";
import assert from "node:assert/strict";
import { valuationAttribution } from "./valuationAttribution.js";

test("BUG-CODE-005 golden-style attribution", () => {
  const r = valuationAttribution({
    quantity: "0.2",
    price0: "50000",
    price1: "45000",
    fx0: "100000",
    fx1: "150000",
  });
  assert.equal(Number(r.total), 350000000);
});

test("BUG-CODE-005 rejects zero price", () => {
  assert.throws(() =>
    valuationAttribution({
      quantity: "1",
      price0: "0",
      price1: "1",
      fx0: "1",
      fx1: "1",
    }),
  );
});
