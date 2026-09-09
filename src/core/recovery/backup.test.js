import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLoan, recordPayment, getLoan } from "../../features/loan/public-api/index.js";
import { backupDatabase, restoreDatabase } from "./backup.js";
import { closeAllDbs } from "../persistence/worker.js";

test("A8 backup/restore preserves loan + payment", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-bk-"));
  const created = await createLoan(
    {
      payload: {
        principal: "1200",
        annualRate: "0",
        periods: "12",
        method: "declining_balance",
        startDate: "2026-01-01",
        currency: "IRR",
      },
    },
    { dataDir },
  );
  await recordPayment(
    {
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
