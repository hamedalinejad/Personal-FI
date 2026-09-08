#!/usr/bin/env node
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const required = [
  "docs/core/ARCHITECTURE-LOCKED.md",
  "docs/core/GO-NO-GO.md",
  "docs/core/IMPLEMENTATION-READY-INDEX.md",
  "docs/core/IMPLEMENTATION-READY-LOAN-SLICE.md",
  "docs/00-Product/Pages-IA.md",
  "docs/core/db/schema.sql",
  "docs/core/db/SCHEMA-FREEZE-PROOF.md",
];
let bad = false;
for (const r of required) {
  if (!existsSync(join(process.cwd(), r))) {
    console.error("MISSING", r);
    bad = true;
  }
}
if (bad) process.exit(1);
console.log("docs-check-refs: OK");
