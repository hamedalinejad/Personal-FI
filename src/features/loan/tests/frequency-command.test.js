import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createLoan } from "../public-api/index.js";
import { setBookBaseCurrency } from "../../../core/accounting/bookSettings.js";
import { closeAllDbs, openDb } from "../../../core/persistence/port.js";

async function makeLoan(freq) {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-freq-"));
  setBookBaseCurrency(openDb(dataDir), "IRR");
  const r = await createLoan(
    {
      operationId: randomUUID(),
      payload: {
        role: "lender",
        principal: "1200",
        currency: "IRR",
        annualRate: "12",
        periods: "12",
        method: "declining_balance",
        startDate: "2026-01-01",
        businessDate: "2026-01-01",
        dayCount: "period_based",
        installmentFrequency: freq,
      },
    },
    { dataDir },
  );
  const db = openDb(dataDir);
  const loan = db.prepare("SELECT installment_frequency FROM ln_loans WHERE id = ?").get(r.loanId);
  const snap = db.prepare("SELECT snapshot_json FROM ln_schedule_snapshots WHERE loan_id = ?").get(r.loanId);
  const parsed = JSON.parse(snap.snapshot_json);
  closeAllDbs();
  return { loan, parsed, dataDir };
}

test("loan.create weekly frequency reaches engine and snapshot", async () => {
  const { loan, parsed } = await makeLoan("weekly");
  assert.equal(loan.installment_frequency, "weekly");
  assert.equal(parsed.frequency, "weekly");
  // period 1 interest under weekly: 1200 * 0.12 / 52 ≈ 2.769...
  const i1 = parsed.rows[0].interest;
  assert.ok(Number(i1) < 5, `weekly interest should be small, got ${i1}`);
});

test("loan.create quarterly frequency", async () => {
  const { loan, parsed } = await makeLoan("quarterly");
  assert.equal(loan.installment_frequency, "quarterly");
  assert.equal(parsed.frequency, "quarterly");
});
