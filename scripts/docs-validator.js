#!/usr/bin/env node
/**
 * Documentation tree validator — owner hierarchy only.
 */
import { readFileSync, existsSync } from "fs";
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
  "docs/modules/loan.md",
  "docs/modules/accounts.md",
  "docs/modules/crypto.md",
  "docs/modules/stocks.md",
  "README.md",
];

let failed = false;
for (const r of required) {
  if (!existsSync(join(root, r))) {
    console.error("MISSING", r);
    failed = true;
  }
}

const qs = readFileSync(join(root, "docs/QUALITY-STATUS.md"), "utf8");
if (/Production release\s*\|\s*\*\*GO\*\*/i.test(qs) || /\|\s*GO\s*\|/.test(qs) && /Production/.test(qs) && !/NO_GO|NO-GO/.test(qs)) {
  // soft: QUALITY must not claim GO without RELEASE_PROVEN language
}
if (!/NO_GO|NO-GO/i.test(qs)) {
  console.error("QUALITY-STATUS should state NO_GO / NO-GO for release");
  failed = true;
}

const readme = readFileSync(join(root, "README.md"), "utf8");
if (!/docs\/README/i.test(readme) && !/PRODUCT/i.test(readme)) {
  console.error("Root README should point at docs entry");
  failed = true;
}

if (failed) {
  console.error("docs-validator: FAIL");
  process.exit(1);
}
console.log("docs-validator: OK");
