import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { buyCrypto, capabilities } from "../public-api/index.js";
import { openDb, closeAllDbs } from "../../../core/persistence/worker.js";

test("P0-MOD-001 crypto-only standalone buy without Accounts UI", async () => {
  assert.ok(capabilities().edition === "crypto-only" || capabilities().implements);
  const dataDir = mkdtempSync(join(tmpdir(), "pf-csa-"));
  const r = await buyCrypto(
    {
      operationId: randomUUID(),
      payload: {
        instrumentId: "inst-btc",
        symbol: "BTC",
        exchangeId: "ex-1",
        grossQuantity: "1",
        feeQuantity: "0",
        netQuantity: "1",
        feeRole: "fee_from_received",
        costTotal: "100",
        costCurrency: "USDT",
        currency: "USDT",
        price: "100",
        priceAsOf: "2026-01-01",
        businessDate: "2026-01-01",
      },
    },
    { dataDir },
  );
  assert.equal(r.idempotentReplay, false);
  const db = openDb(dataDir);
  const lines = db
    .prepare(
      `SELECT jl.* FROM fin_journal_lines jl
       JOIN fin_journal_entries je ON je.id = jl.entry_id
       WHERE je.operation_id = ?`,
    )
    .all(r.operationId);
  assert.ok(lines.length >= 2);
  closeAllDbs();
});
