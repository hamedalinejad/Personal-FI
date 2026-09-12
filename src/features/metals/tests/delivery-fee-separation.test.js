import test from "node:test";
import assert from "node:assert/strict";
import { toDecimal } from "../../../core/money/canonicalDecimal.js";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyMetal, deliverMetal } from "../public-api/index.js";
import { closeAllDbs, openDb } from "../../../core/persistence/port.js";

test("METAL-003 trade fee != delivery fee; delivery does not raise metal cost basis", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-mdel-"));
  await buyMetal(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "gold-fee-sep",
        symbol: "GOLD",
        platformId: "plat-fee",
        grossWeight: "10000",
        purityRatio: "1",
        metalPricePerMg: "1",
        premiumAmount: "0",
        feeAmount: "50",
        currency: "IRR",
        businessDate: "2026-01-01",
      },
    },
    { dataDir },
  );
  const db = openDb(dataDir);
  const before = db
    .prepare(`SELECT total_invested, quantity_mg FROM inv_metals_holdings WHERE instrument_id=?`)
    .get("gold-fee-sep");
  const costBefore = before.total_invested;
  await deliverMetal(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "gold-fee-sep",
        platformId: "plat-fee",
        quantityMg: "2000",
        currency: "IRR",
        businessDate: "2026-01-02",
        deliveryFee: "99",
      },
    },
    { dataDir },
  );
  const after = db
    .prepare(`SELECT total_invested, quantity_mg FROM inv_metals_holdings WHERE instrument_id=?`)
    .get("gold-fee-sep");
  // remaining qty 8000; cost basis should scale down proportionally, not increase by delivery fee
  assert.equal(after.quantity_mg, "8000");
  // delivery fee is expense, not capitalized into remaining holding
  const remainingCost = toDecimal(String(after.total_invested));
  const expectedScale = (Number(costBefore) * 8000) / 10000;
  assert.ok(Math.abs(remainingCost - expectedScale) < 0.02);
  // trade fee was on buy; delivery fee separate journal
  const feeLines = db
    .prepare(
      `SELECT jl.amount, jl.account_id FROM fin_journal_lines jl
       JOIN fin_journal_entries je ON je.id = jl.entry_id
       JOIN fin_operations fo ON fo.id = je.operation_id
       WHERE fo.operation_type = 'metals.delivery' AND jl.line_kind = 'fee'`,
    )
    .all();
  assert.ok(feeLines.some((l) => l.amount === "99"));
  closeAllDbs();
});
