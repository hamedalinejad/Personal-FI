import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { subscribeFund, capabilities } from "../public-api/index.js";
import { openDb, closeAllDbs } from "../../../core/persistence/worker.js";

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
