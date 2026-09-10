import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  createLoan,
  recordPayment,
  getLoan,
  getSchedule,
  getStatement,
  capabilities,
} from "../public-api/index.js";
import { closeAllDbs } from "../../../core/persistence/port.js";

test("A9 Loan-only standalone without Accounts UI surface", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-sa-"));
  const caps = capabilities();
  assert.equal(caps.edition, "loan-only");
  const c = await createLoan(
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
      },
    },
    { dataDir },
  );
  await recordPayment(
    {
      operationId: randomUUID(),
      payload: {
        loanId: c.loanId,
        amount: "100",
        currency: "IRR",
        businessDate: "2026-02-01",
      },
    },
    { dataDir },
  );
  const loan = getLoan(c.loanId, { dataDir });
  assert.ok(loan.remaining);
  assert.ok(getSchedule(c.loanId, { dataDir }));
  assert.ok(getStatement(c.loanId, { dataDir }));
  closeAllDbs();
});
