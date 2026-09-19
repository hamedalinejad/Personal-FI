import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createLoan } from "../public-api/index.js";
import { closeAllDbs } from "../../../core/persistence/worker.js";

function basePayload(extra = {}) {
  return {
    role: "lender",
    principal: "1200",
    currency: "IRR",
    annualRate: "0",
    periods: "12",
    method: "declining_balance",
    startDate: "2026-01-01",
    businessDate: "2026-01-01",
    dayCount: "period_based",
    originationKind: "disburse_now",
    ...extra,
  };
}

test("P1-CARRY-01: missing originationKind rejected (no silent default)", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-carry-"));
  const payload = basePayload();
  delete payload.originationKind;
  await assert.rejects(
    () => createLoan({ operationId: randomUUID(), payload }, { dataDir }),
    /LOAN_ORIGINATION_KIND_REQUIRED/,
  );
  closeAllDbs();
});

test("P1-CARRY-01: missing dayCount rejected", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-carry-dc-"));
  const payload = basePayload();
  delete payload.dayCount;
  await assert.rejects(
    () => createLoan({ operationId: randomUUID(), payload }, { dataDir }),
    /LOAN_DAY_COUNT_REQUIRED/,
  );
  closeAllDbs();
});

test("P1-CARRY-02: yearly alias → annual", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-yearly-"));
  const r = await createLoan(
    {
      operationId: randomUUID(),
      payload: basePayload({ installmentFrequency: "yearly" }),
    },
    { dataDir },
  );
  assert.ok(r.loanId || r.domainResult?.loanId);
  closeAllDbs();
});

test("economicMode alias accepted as explicit originationKind", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-em-"));
  const payload = basePayload();
  delete payload.originationKind;
  payload.economicMode = "disburse_now";
  const r = await createLoan({ operationId: randomUUID(), payload }, { dataDir });
  assert.ok(r.loanId || r.domainResult?.loanId);
  closeAllDbs();
});

test("record_outstanding originationKind accepted when explicit", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "pf-ro-"));
  const r = await createLoan(
    {
      operationId: randomUUID(),
      payload: basePayload({ originationKind: "record_outstanding" }),
    },
    { dataDir },
  );
  assert.ok(r.loanId || r.domainResult?.loanId);
  closeAllDbs();
});
