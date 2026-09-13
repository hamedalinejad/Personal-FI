#!/usr/bin/env node
import { existsSync } from "fs";
import { join } from "path";
const required = [
  "docs/PRODUCT.md",
  "docs/ARCHITECTURE.md",
  "docs/FINANCIAL-CORE.md",
  "docs/DATA-MODEL.md",
  "docs/API.md",
  "docs/modules/loan.md",
  "docs/core/db/schema.sql",
];
let failed = false;
for (const r of required) {
  if (!existsSync(join(process.cwd(), r))) {
    console.error("MISSING", r);
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
