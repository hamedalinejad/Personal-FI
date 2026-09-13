import test from "node:test";
import assert from "node:assert/strict";
import { applyFeeEvents, applySingleFee } from "../domain/fee/feeEngine.js";
import { buyCrypto } from "../../features/crypto/public-api/index.js";
import { sellCrypto } from "../../features/crypto/public-api/index.js";

test("BUG-FINAL-005 fee engine TX vs BASE dimensions", () => {
  const r = applyFeeEvents(
    [
      {
        feeAmount: "10",
        feeCurrency: "USD",
        treatment: "capitalized_cost",
        baseCurrency: "IRR",
        transactionCurrency: "USD",
        exchangeRateToBase: "42000",
        label: "fee",
      },
    ],
    { transactionCurrency: "USD" },
  );
  assert.equal(r.carryingDeltaTx.amount, "10");
  assert.equal(r.carryingDeltaTx.currency, "USD");
  assert.equal(r.carryingDeltaBase, "420000");
  assert.notEqual(r.carryingDeltaTx.amount, r.carryingDeltaBase);
});

test("BUG-FINAL-006 fee-from-received rejects different instrument", () => {
  assert.throws(
    () =>
      applySingleFee(
        {
          feeAmount: "1",
          feeInstrumentId: "usdt-trc20",
          treatment: "fee_from_received",
        },
        {
          receivedInstrumentId: "btc",
          receivedQuantityUnit: "asset",
          transactionCurrency: "BTC",
          baseCurrency: "IRR",
          exchangeRateToBase: "1",
        },
      ),
    /FEE_UNIT_MISMATCH/,
  );
});

test("BUG-FINAL-008 crypto buy rejects non-positive gross", async () => {
  await assert.rejects(
    () =>
      buyCrypto({
        operationId: "op-neg",
        payload: {
          instrumentId: "btc",
          exchangeId: "ex",
          grossQuantity: "0",
          netQuantity: "0",
          feeQuantity: "0",
          costTotal: "1",
          costCurrency: "IRR",
          currency: "IRR",
          price: "1",
          priceAsOf: "2026-01-01",
          businessDate: "2026-01-01",
          feeRole: "fee_from_received",
        },
      }),
    /CRYPTO_QTY_NONPOSITIVE/,
  );
});

test("BUG-FINAL-009 crypto sell rejects non-positive quantity", async () => {
  await assert.rejects(
    () =>
      sellCrypto({
        operationId: "op-neg2",
        payload: {
          instrumentId: "btc",
          exchangeId: "ex",
          quantity: "0",
          proceedsTotal: "100",
          proceedsCurrency: "IRR",
          businessDate: "2026-01-01",
        },
      }),
    /CRYPTO_QTY_NONPOSITIVE/,
  );
});
