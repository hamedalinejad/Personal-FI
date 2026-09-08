import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLoan } from "../public-api/index.js";
import { capabilities } from "../public-api/index.js";

test("loan create posts journal", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-loan-"));
  const r = await createLoan(
    {
      payload: {
        principal: "1000",
        annualRate: "0.12",
        periods: "12",
        method: "declining_balance",
        startDate: "2026-01-01",
      },
    },
    { dataDir },
  );
  assert.equal(r.idempotentReplay, false);
  assert.ok(r.operationId);
  assert.equal(r.journalLines.length, 2);
  assert.ok(r.domainResult.schedule.rows.length === 12);
});

test("capabilities loan-only", () => {
  const c = capabilities();
  assert.equal(c.edition, "loan-only");
});
