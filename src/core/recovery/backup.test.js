import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { readFileSync, writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createLoan, recordPayment, getLoan } from "../../features/loan/public-api/index.js";
import { backupDatabase, restoreDatabase } from "./backup.js";
import { closeAllDbs, openDb } from "../persistence/worker.js";

test("A8 backup/restore preserves loan + payment", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-bk-"));
  const created = await createLoan(
    {
      operationId: randomUUID(),
      payload: {
        role: "lent",
        principal: "1200",
        currency: "IRR",
        annualRate: "0",
        periods: "12",
        method: "declining_balance",
        startDate: "2026-01-01",
        businessDate: "2026-01-01",
        dayCount: "period_based",
        originationKind: "disburse_now",
      },
    },
    { dataDir },
  );
  await recordPayment(
    {
      operationId: randomUUID(),
      payload: {
        loanId: created.loanId,
        amount: "100",
        currency: "IRR",
        businessDate: "2026-02-01",
      },
    },
    { dataDir },
  );
  const bak = join(dataDir, "backup.sqlite");
  await backupDatabase(dataDir, bak);
  const restoreDir = await mkdtemp(join(tmpdir(), "pf-rs-"));
  await restoreDatabase(bak, restoreDir);
  const loan = getLoan(created.loanId, { dataDir: restoreDir });
  assert.equal(loan.principal, "1200");
  assert.equal(loan.remaining.remainingPrincipal, "1100");
  closeAllDbs();
});


test("corrupt backup is rejected before replacing an existing live database", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-live-"));
  const created = await createLoan(
    {
      operationId: randomUUID(),
      payload: {
        role: "lent",
        principal: "500",
        currency: "IRR",
        annualRate: "0",
        periods: "5",
        method: "declining_balance",
        startDate: "2026-01-01",
        businessDate: "2026-01-01",
        dayCount: "period_based",
        originationKind: "disburse_now",
      },
    },
    { dataDir },
  );
  const backupPath = join(dataDir, "good.sqlite");
  await backupDatabase(dataDir, backupPath);

  const badPath = join(dataDir, "bad.sqlite");
  const raw = readFileSync(backupPath);
  writeFileSync(badPath, raw);
  const corruptDb = new DatabaseSync(badPath);
  corruptDb.prepare(
    `UPDATE fin_journal_lines SET amount_in_base='999999'
     WHERE entry_id = (SELECT id FROM fin_journal_entries WHERE operation_id = ?)
       AND side='debit'`,
  ).run(created.operationId);
  corruptDb.close();

  await assert.rejects(
    () => restoreDatabase(badPath, dataDir),
    /BACKUP_CORRUPT/,
  );

  const live = openDb(dataDir);
  const row = live.prepare("SELECT command_hash FROM fin_operations WHERE id=?").get(created.operationId);
  assert.ok(row?.command_hash);
  const count = live.prepare("SELECT COUNT(*) AS c FROM fin_journal_lines WHERE amount_in_base='999999'").get().c;
  assert.equal(count, 0);
  closeAllDbs();
});
