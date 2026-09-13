import test from "node:test";
import assert from "node:assert/strict";
import { subscribeFund } from "../../features/funds/public-api/index.js";

test("BUG-FINAL-029 fund subscribe rejects non-positive price", async () => {
  await assert.rejects(
    () =>
      subscribeFund({
        operationId: "x",
        payload: {
          instrumentId: "f",
          units: "10",
          transactionPrice: "0",
          currency: "IRR",
          businessDate: "2026-01-01",
        },
      }),
    /FUND_PRICE_NONPOSITIVE/,
  );
});
