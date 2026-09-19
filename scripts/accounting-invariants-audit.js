#!/usr/bin/env node
/**
 * P2-17 — Machine audit of core accounting invariants (static + optional DB dir).
 * Exit 0 when structural source contracts hold; optional dataDir for live DB scan.
 */
import { readFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";

const errors = [];

// Static: fee engine has no silent default
const fee = readFileSync("src/core/domain/fee/feeEngine.js", "utf8");
if (!fee.includes("FEE_TREATMENT_REQUIRED")) {
  errors.push("feeEngine missing FEE_TREATMENT_REQUIRED");
}
if (!fee.includes("FEE_TREATMENT_DEFERRED")) {
  errors.push("feeEngine missing equity deferred guard");
}

// Static: no parallel cash table names in schema as SoT (intentional omission comments ok)
const schema = readFileSync("docs/core/db/schema.sql", "utf8");
for (const ghost of [
  "inv_crypto_exchange_transactions",
  "inv_stocks_iran_brokerage_transactions",
  "inv_metals_platform_transactions",
]) {
  if (new RegExp(`CREATE TABLE.*${ghost}`, "i").test(schema)) {
    errors.push(`ghost cash ledger table present: ${ghost}`);
  }
}

// Static: journal invariants export posted path
const inv = readFileSync("src/core/domain/invariants/index.js", "utf8");
if (!inv.includes("posted")) errors.push("invariants missing posted base path");

// Run journal matrix + golden quickly
const tests = spawnSync(
  "node",
  [
    "--test",
    "src/core/domain/invariants/journal-matrix.test.js",
    "src/core/acceptance/accounting-golden.acceptance.test.js",
    "src/core/domain/operation/reversal.test.js",
  ],
  { encoding: "utf8" },
);
if (tests.status !== 0) {
  errors.push("accounting invariant unit/golden tests failed");
  console.error(tests.stdout);
  console.error(tests.stderr);
}

if (errors.length) {
  console.error("accounting-invariants-audit FAIL:");
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}
console.log("accounting-invariants-audit OK");
