
import test from "node:test";
import assert from "node:assert/strict";
import { redeemFund } from "../../features/funds/public-api/index.js";
import { sellStock } from "../../features/stocks/public-api/index.js";
import { sellMetal } from "../../features/metals/public-api/index.js";
import { deliverMetal } from "../../features/metals/public-api/index.js";

test("BUG-FINAL-011 fund redeem rejects non-positive units", async () => {
  await assert.rejects(
    () =>
      redeemFund({
        operationId: "x",
        payload: {
          instrumentId: "f",
          units: "0",
          transactionPrice: "1",
          currency: "IRR",
          businessDate: "2026-01-01",
        },
      }),
    /FUND_UNITS_NONPOSITIVE/,
  );
});

test("BUG-FINAL-012 stocks sell rejects non-positive qty", async () => {
  await assert.rejects(
    () =>
      sellStock({
        operationId: "x",
        payload: {
          instrumentId: "s",
          brokerageId: "b",
          quantity: "0",
          price: "10",
          currency: "IRR",
          tradeDate: "2026-01-01",
          businessDate: "2026-01-01",
        },
      }),
    /STOCK_QTY_NONPOSITIVE/,
  );
});

test("BUG-FINAL-013 metals sell rejects non-positive qty", async () => {
  await assert.rejects(
    () =>
      sellMetal({
        operationId: "x",
        payload: {
          instrumentId: "g",
          platformId: "p",
          quantityMg: "0",
          proceedsTotal: "10",
          currency: "IRR",
          businessDate: "2026-01-01",
        },
      }),
    /METAL_QTY_NONPOSITIVE/,
  );
});

test("BUG-FINAL-014 metals delivery rejects non-positive qty", async () => {
  await assert.rejects(
    () =>
      deliverMetal({
        operationId: "x",
        payload: {
          instrumentId: "g",
          platformId: "p",
          quantityMg: "0",
          currency: "IRR",
          businessDate: "2026-01-01",
        },
      }),
    /METAL_DELIVERY_QTY_NONPOSITIVE/,
  );
});
