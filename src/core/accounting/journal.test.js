import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildJournal, debit, credit, assertJournalBalanced } from "./journal.js";

describe("journal builder", () => {
  it("balances equal base legs", () => {
    const lines = [
      debit({ accountId: "a1", amount: "100", currency: "IRR" }),
      credit({ accountId: "a2", amount: "100", currency: "IRR" }),
    ];
    assertJournalBalanced(lines);
    const j = buildJournal({
      operationId: "op1",
      businessDate: "2026-09-21",
      lines,
    });
    assert.equal(j.lines.length, 2);
  });

  it("rejects unbalanced", () => {
    assert.throws(() =>
      assertJournalBalanced([
        debit({ accountId: "a1", amount: "100", currency: "IRR" }),
        credit({ accountId: "a2", amount: "90", currency: "IRR" }),
      ])
    );
  });
});
