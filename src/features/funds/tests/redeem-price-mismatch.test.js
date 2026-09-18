import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { subscribeFund, redeemFund } from "../public-api/index.js";
import { setBookBaseCurrency } from "../../../core/accounting/bookSettings.js";
import { closeAllDbs, openDb } from "../../../core/persistence/port.js";

test("funds.redeem rejects contradictory price and proceeds", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-rdm-"));
  setBookBaseCurrency(openDb(dataDir), "IRR");
  await subscribeFund(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "f1",
        symbol: "F1",
        units: "10",
        transactionPrice: "100",
        currency: "IRR",
        transactionCurrency: "IRR",
        businessDate: "2026-01-01",
      },
    },
    { dataDir },
  );
  await assert.rejects(
    () =>
      redeemFund(
        {
          operationId: randomUUID(),
          payload: {
            instrumentId: "f1",
            units: "10",
            transactionPrice: "100",
            proceedsTotal: "999",
            currency: "IRR",
            businessDate: "2026-01-02",
          },
        },
        { dataDir },
      ),
    /AMOUNT_PRICE_MISMATCH/,
  );
  closeAllDbs();
});
