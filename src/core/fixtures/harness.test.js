import test from "node:test";
import assert from "node:assert/strict";
import { assertExpected, assertNoJsonNumbers } from "./harness.js";

test("BUG-CODE-006 ids not equal as decimals", () => {
  assert.throws(() =>
    assertExpected({ id: "001" }, { id: "1" }),
  );
  assertExpected({ id: "001" }, { id: "001" });
});

test("BUG-CODE-007 rejects JSON numbers in fixture tree", () => {
  assert.throws(() => assertNoJsonNumbers({ amount: 1.5 }));
  assertNoJsonNumbers({ amount: "1.5" });
});
