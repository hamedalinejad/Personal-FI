import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { subscribeFund, capabilities } from "../public-api/index.js";
import { openDb, closeAllDbs } from "../../../core/persistence/port.js";

test("fund.subscribe uses transactionPrice not NAV for cost", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-fund-"));
  const r = await subscribeFund(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "fund-1",
        symbol: "F1",
        units: "10",
        transactionPrice: "110",
        nav: "100",
        currency: "IRR",
        businessDate: "2026-01-01",
      },
    },
    { dataDir },
  );
  assert.equal(r.domainResult.cost, "1100");
  assert.equal(r.domainResult.nav, "100");
  assert.equal(r.domainResult.transactionPrice, "110");
  const db = openDb(dataDir);
  const h = db.prepare(`SELECT * FROM inv_fif_holdings WHERE instrument_id = ?`).get("fund-1");
  assert.equal(h.quantity, "10");
  assert.equal(h.total_invested, "1100");
  closeAllDbs();
});

test("fund capabilities", () => {
  assert.ok(capabilities().implements.includes("fund.subscribe"));
});

test("BUG-002 nav null with transactionPrice succeeds", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-fund-navnull-"));
  const r = await subscribeFund(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "fund-navnull",
        symbol: "FN",
        units: "10",
        transactionPrice: "100",
        nav: null,
        currency: "IRR",
        businessDate: "2026-01-01",
      },
    },
    { dataDir },
  );
  assert.equal(r.domainResult.transactionPrice, "100");
  assert.equal(r.domainResult.nav, null);
  closeAllDbs();
});

test("BUG-004 amount mismatch rejects", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-fund-amt-"));
  await assert.rejects(
    () =>
      subscribeFund(
        {
          operationId: randomUUID(),
          payload: {
            instrumentId: "fund-amt",
            symbol: "FA",
            units: "10",
            transactionPrice: "100",
            amount: "999",
            currency: "IRR",
            businessDate: "2026-01-01",
          },
        },
        { dataDir },
      ),
    (e) => /AMOUNT_PRICE_MISMATCH/.test(String(e && e.message)),
  );
  closeAllDbs();
});
