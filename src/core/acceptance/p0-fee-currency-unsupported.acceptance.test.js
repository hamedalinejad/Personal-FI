import test from "node:test";
import assert from "node:assert/strict";
import { buyMetal } from "../../features/metals/public-api/index.js";
import { randomUUID } from "node:crypto";

test("P0-03 third currency fee rejected", async () => {
  await assert.rejects(
    () =>
      buyMetal({
        operationId: randomUUID(),
        payload: {
          instrumentId: "au-2",
          symbol: "XAU",
          platformId: "p1",
          quantityMg: "1000",
          purityRatio: "1",
          metalPricePerMg: "1",
          currency: "USD",
          baseCurrency: "IRR",
          exchangeRateToBase: "40000",
          feeAmount: "2",
          feeCurrency: "EUR",
          businessDate: "2026-01-01",
        },
      }),
    /FEE_CURRENCY_UNSUPPORTED/,
  );
});
