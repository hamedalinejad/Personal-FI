import test from "node:test";
import assert from "node:assert/strict";
import { settle } from "./settlementAdapter.js";
import { assertJournalBalanced } from "../invariants/index.js";

test("BUG-007 settle journal only", () => {
  const r = settle({
    finAccountId: "cash1",
    counterAccountId: "expense1",
    amount: "50",
    operationId: "op1",
  });
  assert.equal(r.journalLines.length, 2);
  assertJournalBalanced(r.journalLines);
  assert.equal(r.balance, undefined);
});
