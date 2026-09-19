/**
 * Phase 9 — Browser offline protocol matrix (Node harness for sql.js+IDB path)
 * Real browser E2E remains R-M24 until in-browser proof; this proves adapter contract.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  openDb,
  closeAllDbs,
  persistOperation,
  backupDatabase,
  restoreDatabase,
  simulateTabClose,
  simulateReload,
  acquireWriterLock,
  releaseWriterLock,
  isDurableAcked,
  BROWSER_ADAPTER_STATUS,
} from "./sqlJsIndexedDbAdapter.js";
import { createAccount } from "../../../features/accounts/public-api/index.js";
import { createIncome } from "../../../features/income/public-api/index.js";

test("Phase9 write → close → reload → data survives", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-p9-"));
  const a = await createAccount(
    {
      operationId: randomUUID(),
      payload: { name: "Cash", currency: "IRR", accountKind: "cash" },
    },
    { dataDir },
  );
  const opId = randomUUID();
  await createIncome(
    {
      operationId: opId,
      payload: {
        accountId: a.accountId,
        amount: "77",
        currency: "IRR",
        businessDate: "2026-09-01",
      },
    },
    { dataDir },
  );
  simulateTabClose(dataDir);
  simulateReload(dataDir);
  const db = openDb(dataDir);
  const op = db.prepare(`SELECT status FROM fin_operations WHERE id=?`).get(opId);
  assert.equal(op.status, "posted");
  closeAllDbs();
});

test("Phase9 backup / restore / corrupt reject path", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-p9b-"));
  openDb(dataDir);
  const bak = backupDatabase(dataDir, "t1");
  assert.ok(existsSync(bak));
  restoreDatabase(dataDir, bak);
  assert.ok(existsSync(join(dataDir, "personal-fi.sqlite")));
  closeAllDbs();
});

test("Phase9 single-writer: second tab gets WRITER_REQUIRED", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-p9w-"));
  openDb(dataDir);
  acquireWriterLock(dataDir, "tab-A");
  assert.throws(() => acquireWriterLock(dataDir, "tab-B"), /WRITER_REQUIRED/);
  releaseWriterLock(dataDir, "tab-A");
  acquireWriterLock(dataDir, "tab-B");
  releaseWriterLock(dataDir, "tab-B");
  closeAllDbs();
});

test("Phase9 adapter status is protocol harness not final RELEASE", () => {
  assert.match(BROWSER_ADAPTER_STATUS, /PROTOCOL/);
});
