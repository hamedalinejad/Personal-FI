import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { subscribeFund, redeemFund } from "../public-api/index.js";
import { closeAllDbs, openDb } from "../../../core/persistence/port.js";

test("fund subscribe then redeem", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-fr-"));
  await subscribeFund(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "fund-r",
        symbol: "FR",
        units: "10",
        transactionPrice: "100",
        nav: "99",
        currency: "IRR",
        businessDate: "2026-01-01",
      },
    },
    { dataDir },
  );
  const red = await redeemFund(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "fund-r",
        units: "5",
        transactionPrice: "110",
        currency: "IRR",
        businessDate: "2026-01-02",
      },
    },
    { dataDir },
  );
  assert.equal(red.domainResult.proceeds, "550");
  const db = openDb(dataDir);
  const h = db.prepare(`SELECT quantity FROM inv_fif_holdings WHERE instrument_id=?`).get("fund-r");
  assert.equal(h.quantity, "5");
  closeAllDbs();
});
