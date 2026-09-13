#!/usr/bin/env node
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const root = process.cwd();
const required = [
  "docs/README.md",
  "docs/DOCUMENTATION-STANDARD.md",
  "docs/PRODUCT.md",
  "docs/ARCHITECTURE.md",
  "docs/FINANCIAL-CORE.md",
  "docs/DATA-MODEL.md",
  "docs/API.md",
  "docs/REPORTING.md",
  "docs/OFFLINE-RELEASE.md",
  "docs/DEVELOPMENT.md",
  "docs/QUALITY-STATUS.md",
  "docs/core/db/schema.sql",
  "docs/core/registry/status.registry.json",
  "docs/core/registry/requirements-matrix.json",
  "docs/modules/accounts.md",
  "docs/modules/income-expense.md",
  "docs/modules/cheque.md",
  "docs/modules/loan.md",
  "docs/modules/crypto.md",
  "docs/modules/stocks.md",
  "docs/modules/funds.md",
  "docs/modules/metals.md",
  "docs/modules/physical-assets.md",
  "docs/modules/budget-goals-bills.md",
  "docs/modules/tax.md",
];

let failed = false;
for (const r of required) {
  if (!existsSync(join(root, r))) {
    console.error("MISSING", r);
    failed = true;
  }
}

const qs = readFileSync(join(root, "docs/QUALITY-STATUS.md"), "utf8");
if (!/NO_GO|NO-GO/i.test(qs)) {
  console.error("QUALITY-STATUS must state NO_GO");
  failed = true;
}

const reg = JSON.parse(readFileSync(join(root, "docs/core/registry/status.registry.json"), "utf8"));
const ss = reg.schema_status || {};
const doc = reg.documentation || {};
if (ss.FREEZE_PROVEN !== doc.schema_freeze_proven) {
  console.error("schema freeze flags disagree between schema_status and documentation");
  failed = true;
}

if (failed) {
  console.error("docs-validator: FAIL");
  process.exit(1);
}
console.log("docs-validator: OK");
