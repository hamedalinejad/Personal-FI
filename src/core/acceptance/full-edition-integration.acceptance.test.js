/**
 * Full edition: multiple features compose via public-api only.
 * Shared journal = single accounting truth; no Accounts UI required for feature ops.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { openDb, closeAllDbs } from "../persistence/worker.js";
import { apisForEdition } from "../../api/publicRegistry.js";

test("full edition: loan + fund + metal via public APIs share one journal", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-full-"));
  const apis = apisForEdition("full");

  const loan = await apis.loan.createLoan(
    {
      operationId: randomUUID(),
      payload: {
        role: "lent",
        principal: "500",
        currency: "IRR",
        annualRate: "0",
        periods: "2",
        method: "declining_balance",
        startDate: "2026-01-01",
        businessDate: "2026-01-01",
        dayCount: "period_based",
        originationKind: "disburse_now",
      },
    },
    { dataDir },
  );
  assert.ok(loan.loanId);

  const fund = await apis.funds.subscribeFund(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "full-fund",
        symbol: "FF",
        quantity: "3",
        transactionPrice: "100",
        nav: "99",
        currency: "IRR",
        businessDate: "2026-01-02",
      },
    },
    { dataDir },
  );
  assert.ok(fund.operationId);

  const metal = await apis.metals.buyMetal(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "full-gold",
        symbol: "GOLD",
        quantityMg: "500",
        purityRatio: "1",
        metalPricePerMg: "10",
        premium: "0",
        fee: "0",
        currency: "IRR",
        businessDate: "2026-01-03",
        platformId: "plat-full",
      },
    },
    { dataDir },
  );
  assert.ok(metal.operationId);

  const db = openDb(dataDir);
  const ops = db.prepare(`SELECT COUNT(*) as n FROM fin_operations WHERE status = 'posted'`).get();
  assert.ok(ops.n >= 3, "all feature ops posted into same book");
  const lines = db.prepare(`SELECT COUNT(*) as n FROM fin_journal_lines`).get();
  assert.ok(lines.n >= 6, "shared journal has legs from multiple features");
  // feature domain rows coexist
  assert.ok(db.prepare(`SELECT id FROM ln_loans LIMIT 1`).get());
  assert.ok(db.prepare(`SELECT id FROM inv_fif_holdings WHERE instrument_id = ?`).get("full-fund"));
  assert.ok(db.prepare(`SELECT id FROM inv_metals_holdings WHERE instrument_id = ?`).get("full-gold"));
  closeAllDbs();
});

test("standalone loan-only API set has no funds/metals surface", () => {
  const apis = apisForEdition("loan-only");
  assert.equal(apis.funds, undefined);
  assert.equal(apis.metals, undefined);
  assert.ok(apis.loan);
});
