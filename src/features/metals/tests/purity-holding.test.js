import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyMetal } from "../public-api/index.js";
import { openDb, closeAllDbs } from "../../../core/persistence/port.js";

test("P0-08 different purity ratios do not merge holdings", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-pur-"));
  const base = {
    instrumentId: "gold-mix",
    symbol: "GOLD",
    grossWeight: "10000",
    metalPrice: "1",
    premium: "0",
    fee: "0",
    currency: "IRR",
    businessDate: "2026-01-01",
    platformId: "plat-1",
  };
  await buyMetal(
    { operationId: randomUUID(), payload: { ...base, purityRatio: "0.750", purityCode: "18k" } },
    { dataDir },
  );
  await buyMetal(
    { operationId: randomUUID(), payload: { ...base, purityRatio: "0.999", purityCode: "24k" } },
    { dataDir },
  );
  const db = openDb(dataDir);
  const rows = db
    .prepare(
      `SELECT purity_ratio, quantity_mg FROM inv_metals_holdings WHERE instrument_id = ? ORDER BY purity_ratio`,
    )
    .all("gold-mix");
  assert.equal(rows.length, 2);
  assert.equal(rows[0].purity_ratio, "0.750");
  assert.equal(rows[1].purity_ratio, "0.999");
  closeAllDbs();
});
