import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { assertJournalBalanced } from "../domain/invariants/index.js";
import { buildInverseJournalLines } from "../domain/operation/reversal.js";

const pack = JSON.parse(readFileSync("fixtures/CORE-ACCOUNTING-KERNEL-V1.json", "utf8"));

for (const c of pack.cases) {
  test(`golden ${c.id}`, () => {
    if (c.id === "reversal-inverse") {
      const inv = buildInverseJournalLines(c.input.journal);
      assert.equal(inv[0].side, c.expected.inverse[0].side);
      assert.equal(inv[1].side, c.expected.inverse[1].side);
      assertJournalBalanced(inv, { baseCurrency: c.input.baseCurrency, posted: true });
      return;
    }
    if (c.expected.status === "pass") {
      assert.doesNotThrow(() =>
        assertJournalBalanced(c.input.journal, {
          baseCurrency: c.input.baseCurrency,
          posted: c.input.posted === true,
        }),
      );
    } else {
      assert.throws(
        () =>
          assertJournalBalanced(c.input.journal, {
            baseCurrency: c.input.baseCurrency,
            posted: c.input.posted === true,
          }),
        new RegExp(c.expected.errors[0]),
      );
    }
  });
}
