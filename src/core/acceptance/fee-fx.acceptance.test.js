/** Fee / FX acceptance (includes former p0 fee/metals rate cases). */
import assert from "node:assert/strict";
import test from "node:test";
import { buyMetal } from "../../features/metals/public-api/index.js";
import { buyStock } from "../../features/stocks/public-api/index.js";
import { toDecimal } from "../money/canonicalDecimal.js";
import { closeAllDbs, openDb } from "../persistence/port.js";
import { randomUUID } from "node:crypto";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** MATH-009: fee in foreign currency must carry rates — never re-infer live */
function feeInBase({ feeAmount, feeCurrency, legCurrency, feeToLegRate, feeToBaseRate, baseCurrency }) {
  if (feeCurrency === baseCurrency) return toDecimal(feeAmount);
  if (feeToBaseRate) return toDecimal(feeAmount).times(toDecimal(feeToBaseRate));
  if (feeCurrency === legCurrency && feeToLegRate) {
    throw new Error("FEE_TO_BASE_REQUIRED");
  }
  throw new Error("FEE_FX_CONTEXT_REQUIRED");
}

test("MATH-009 missing fee FX context rejected", () => {
  assert.throws(
    () =>
      feeInBase({
        feeAmount: "10",
        feeCurrency: "USD",
        legCurrency: "IRR",
        baseCurrency: "IRR",
      }),
    /FEE_FX_CONTEXT_REQUIRED/,
  );
});

test("MATH-009 feeToBaseRate applied", () => {
  const b = feeInBase({
    feeAmount: "10",
    feeCurrency: "USD",
    legCurrency: "IRR",
    feeToBaseRate: "50000",
    baseCurrency: "IRR",
  });
  assert.equal(b.toFixed(), "500000");
});

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

test("P0-01 USD trade IRR base fee expense account matches USD line", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-fee-ccy-"));
  const r = await buyStock(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "stk-usd",
        symbol: "STKUSD",
        quantity: "1",
        price: "10",
        commission: "1",
        currency: "USD",
        baseCurrency: "IRR",
        exchangeRateToBase: "50000",
        tradeDate: "2026-01-01",
        businessDate: "2026-01-01",
        settlementDate: "2026-01-03",
        brokerageId: "br-fx",
      },
    },
    { dataDir },
  );
  assert.equal(r.status, "posted");
  const feeLines = (r.journalLines || []).filter((l) => l.lineKind === "fee");
  for (const line of feeLines) {
    assert.equal(line.currency, "USD");
  }
  closeAllDbs();
});

test("P0-02 metals stores real exchange_rate_to_base", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-metal-fx-"));
  await buyMetal(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "au-1",
        symbol: "XAU",
        platformId: "plat-1",
        quantityMg: "1000",
        purityRatio: "0.999",
        metalPricePerMg: "5",
        currency: "USD",
        baseCurrency: "IRR",
        exchangeRateToBase: "42000",
        businessDate: "2026-01-01",
        feeAmount: "0",
      },
    },
    { dataDir },
  );
  const db = openDb(dataDir);
  const row = db.prepare(`SELECT exchange_rate_to_base FROM inv_metals_transactions`).get();
  assert.equal(row.exchange_rate_to_base, "42000");
  closeAllDbs();
});
