#!/usr/bin/env node
/**
 * Minimal benchmark evidence — not a full perf suite.
 * Records that core path runs under a soft ceiling on this machine.
 */
import { performance } from "perf_hooks";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import { createLoan } from "../src/features/loan/public-api/index.js";

const dataDir = mkdtempSync(join(tmpdir(), "pf-bench-"));
const t0 = performance.now();
const r = await createLoan(
  {
    operationId: randomUUID(),
    payload: {
      role: "lent",
      principal: "1000000",
      currency: "IRR",
      annualRate: "18",
      periods: "12",
      method: "declining_balance",
      startDate: "2026-01-01",
      businessDate: "2026-01-01",
      dayCount: "period_based",
    },
  },
  { dataDir },
);
const ms = performance.now() - t0;
const evidence = {
  op: "loan.create",
  ms: Math.round(ms * 100) / 100,
  operationId: r.operationId,
  ceilingMs: 5000,
  pass: ms < 5000,
};
console.log(JSON.stringify(evidence));
if (!evidence.pass) {
  console.error("bench-smoke FAILED");
  process.exit(1);
}
console.log("bench-smoke: OK");
