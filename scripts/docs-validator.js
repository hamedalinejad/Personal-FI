#!/usr/bin/env node
/**
 * Stronger documentation validator than docs-check-refs alone.
 * - required authority files exist
 * - GO-NO-GO does not claim Production GO
 * - IMPLEMENTATION-READY packs exist
 * - no stale "src absent" / vitest in README
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = process.cwd();
const required = [
  "docs/core/ARCHITECTURE-LOCKED.md",
  "docs/core/GO-NO-GO.md",
  "docs/core/OPEN-ISSUES-REGISTER.md",
  "docs/core/CODING-GATE.md",
  "docs/core/IMPLEMENTATION-READY-INDEX.md",
  "docs/core/IMPLEMENTATION-READY-LOAN-SLICE.md",
  "docs/core/Canonical-Financial-Operation.md",
  "docs/core/Cash-Settlement-Adapter.md",
  "docs/core/Feature-Independence-Contract.md",
  "docs/core/Domain-Dependency-Matrix.md",
  "docs/00-Product/Pages-IA.md",
  "docs/core/db/schema.sql",
  "docs/core/db/SCHEMA-FREEZE-PROOF.md",
  "README.md",
];

let failed = false;
for (const r of required) {
  if (!existsSync(join(root, r))) {
    console.error("MISSING", r);
    failed = true;
  }
}

const go = readFileSync(join(root, "docs/core/GO-NO-GO.md"), "utf8");
if (/Production release\s*\|\s*\*\*GO\*\*/i.test(go)) {
  console.error("GO-NO-GO must not mark Production GO");
  failed = true;
}
if (!/NO-GO/i.test(go)) {
  console.error("GO-NO-GO should state Production NO-GO");
  failed = true;
}

const readme = readFileSync(join(root, "README.md"), "utf8");
if (/intentionally not on this branch/i.test(readme)) {
  console.error("README stale: claims source absent");
  failed = true;
}
if (/npx vitest/i.test(readme)) {
  console.error("README stale: vitest");
  failed = true;
}
if (!/node --test|npm test/i.test(readme)) {
  console.error("README should document npm test / node --test");
  failed = true;
}

if (failed) {
  console.error("docs-validator FAILED");
  process.exit(1);
}
console.log("docs-validator: OK");
process.exit(0);
