import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  persistOperation,
  loadOperation,
  backupDatabase,
  restoreDatabase,
  isDurableAcked,
  BROWSER_ADAPTER_STATUS,
} from "./sqlJsIndexedDbAdapter.js";
import { closeAllDbs } from "../worker.js";

test("P0-OFFLINE-001 atomic persist + durable ACK + backup/restore reopen", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-br-"));
  const opId = randomUUID();
  await persistOperation(
    {
      operationId: opId,
      type: "test.offline",
      status: "posted",
      businessDate: "2026-01-01",
      baseCurrency: "IRR",
      commandHash: "a".repeat(64),
      journalLines: [
        { accountId: "a", side: "debit", amount: "5", currency: "IRR" },
        { accountId: "b", side: "credit", amount: "5", currency: "IRR" },
      ],
      withinTransaction: (db) => {
        const now = new Date().toISOString();
        for (const [id, kind] of [
          ["a", "asset"],
          ["b", "equity"],
        ]) {
          db.prepare(
            `INSERT OR IGNORE INTO fin_accounts (id, code, name, account_kind, currency, created_at, updated_at, status)
             VALUES (?,?,?,?, 'IRR', ?, ?, 'active')`,
          ).run(id, id, id, kind, now, now);
        }
      },
    },
    { dataDir, mode: "sqlite" },
  );
  assert.ok(isDurableAcked(dataDir, opId));
  const bak = backupDatabase(dataDir, "t1");
  closeAllDbs();
  const dataDir2 = mkdtempSync(join(tmpdir(), "pf-br2-"));
  restoreDatabase(dataDir2, bak);
  const loaded = await loadOperation(opId, { dataDir: dataDir2, mode: "sqlite" });
  assert.equal(loaded.operationId, opId);
  assert.equal(loaded.status, "posted");
  assert.ok(BROWSER_ADAPTER_STATUS.includes("PROTOCOL"));
  closeAllDbs();
});
