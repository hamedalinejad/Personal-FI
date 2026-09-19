import test from "node:test";
import assert from "node:assert/strict";
import {
  listEditions,
  isCommandAllowed,
  assertCommandAllowed,
  downgradeEdition,
} from "./capabilityGate.js";

test("Phase17 editions include verticals + full", () => {
  const eds = listEditions();
  for (const e of ["full", "loan-only", "crypto-only", "stocks-only", "funds-only", "metals-only"]) {
    assert.ok(eds.includes(e), e);
  }
});

test("Phase17 loan-only allows loan.create blocks crypto.buy", () => {
  assert.equal(isCommandAllowed("loan.create", "loan-only"), true);
  assert.equal(isCommandAllowed("crypto.buy", "loan-only"), false);
  assert.throws(() => assertCommandAllowed("crypto.buy", "loan-only"), /LICENSE_REQUIRED/);
});

test("Phase17 full allows any", () => {
  assert.equal(isCommandAllowed("tax.pay", "full"), true);
});

test("Phase17 downgrade retains history", () => {
  const d = downgradeEdition([{ id: "a" }, { id: "b" }], "full", "loan-only");
  assert.equal(d.historyDeleted, false);
  assert.equal(d.retainedCount, 2);
});
