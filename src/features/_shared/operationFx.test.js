import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveMoneyOperationFx, journalPair } from "./operationFx.js";

describe("resolveMoneyOperationFx", () => {
  it("same currency uses identity rate", () => {
    const r = resolveMoneyOperationFx({
      bookBaseCurrency: "IRR",
      transactionCurrency: "IRR",
      amount: "10000000",
    });
    assert.equal(r.isCross, false);
    assert.equal(r.fxRate, "1");
    assert.equal(r.amountInTxn, "10000000");
    assert.equal(r.amountInBase, "10000000");
  });

  it("cross currency requires explicit positive FX", () => {
    assert.throws(
      () =>
        resolveMoneyOperationFx({
          bookBaseCurrency: "IRR",
          transactionCurrency: "USD",
          amount: "100",
        }),
      /FX_REQUIRED/
    );
  });

  it("cross currency multiplies by fx", () => {
    const r = resolveMoneyOperationFx({
      bookBaseCurrency: "IRR",
      transactionCurrency: "USD",
      amount: "10",
      fxRate: "42000",
    });
    assert.equal(r.isCross, true);
    assert.equal(r.amountInBase, "420000");
  });

  it("rejects non-positive FX", () => {
    assert.throws(
      () =>
        resolveMoneyOperationFx({
          bookBaseCurrency: "IRR",
          transactionCurrency: "USD",
          amount: "10",
          fxRate: "0",
        }),
      /FX_MUST_BE_POSITIVE/
    );
  });
});

describe("journalPair", () => {
  it("builds balanced debit/credit", () => {
    const p = journalPair({
      debitAccountId: "a1",
      creditAccountId: "a2",
      amountInBase: "1000",
    });
    assert.equal(p.lines.length, 2);
    assert.equal(p.lines[0].side, "debit");
    assert.equal(p.lines[1].side, "credit");
    assert.equal(p.lines[0].amount, "1000");
  });
});
