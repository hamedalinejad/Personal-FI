import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createLoan, capabilities } from "../public-api/index.js";
import { closeAllDbs } from "../../../core/persistence/port.js";

test("loan create posts journal", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-loan-"));
  const r = await createLoan(
    {
      operationId: randomUUID(),
      payload: {
        role: "lent",
        principal: "1000",
        currency: "IRR",
        annualRate: "0",
        periods: "10",
        method: "declining_balance",
        startDate: "2026-01-01",
        businessDate: "2026-01-01",
        dayCount: "period_based",
      },
    },
    { dataDir },
  );
  assert.ok(r.operationId);
  assert.equal(r.journalLines.length, 2);
  closeAllDbs();
});

test("capabilities loan-only", () => {
  assert.equal(capabilities().edition, "loan-only");
});
