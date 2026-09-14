import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { subscribeFund } from "../public-api/index.js";
import { loadOperation, closeAllDbs, openDb } from "../../../core/persistence/port.js";

test("Gate H funds.subscribe field survival", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-fh-"));
  const opId = randomUUID();
  await subscribeFund(
    {
      operationId: opId,
      payload: {
        instrumentId: "fund-h",
        symbol: "FH",
        units: "10",
        transactionPrice: "110",
        nav: "100",
        currency: "IRR",
        businessDate: "2026-01-01",
        note: "funds-gate-h",
      },
    },
    { dataDir },
  );
  const loaded = await loadOperation(opId, { dataDir });
  assert.equal(loaded.payload?.note, "funds-gate-h");
  assert.equal(loaded.domainResult?.transactionPrice, "110");
  assert.equal(loaded.domainResult?.nav, "100");
  const db = openDb(dataDir);
  const tx = db.prepare(`SELECT * FROM inv_fif_transactions WHERE operation_id=?`).get(opId);
  assert.ok(tx);
  assert.equal(tx.transaction_price, "110");
  closeAllDbs();
});
