import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createLoan } from "../commands/createLoan.js";
import { getLoanById } from "../ledger/loanRepository.js";
import { backupDatabase, restoreDatabase } from "../../../core/persistence/browser/sqlJsIndexedDbAdapter.js";
import { closeAllDbs } from "../../../core/persistence/worker.js";

test("loan recovery: create → backup → restore → loan still readable", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "pf-loan-rec-"));
  const opId = randomUUID();
  const result = await createLoan(
    {
      operationId: opId,
      payload: {
        role: "lender",
        principal: "1200",
        annualRate: "12",
        method: "flat_rate",
        periods: "12",
        frequency: "monthly",
        dayCount: "period_based",
        currency: "IRR",
        businessDate: "2026-01-01",
        startDate: "2026-01-01",
      },
    },
    { dataDir },
  );
  const loanId = result.loanId;
  assert.ok(loanId);
  const bak = backupDatabase(dataDir, "loan");
  closeAllDbs();
  const dataDir2 = mkdtempSync(join(tmpdir(), "pf-loan-rec2-"));
  restoreDatabase(dataDir2, bak);
  const loan = getLoanById(dataDir2, loanId);
  assert.ok(loan);
  assert.equal(String(loan.principal), "1200");
  closeAllDbs();
});
