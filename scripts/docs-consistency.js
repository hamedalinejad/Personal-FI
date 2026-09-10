#!/usr/bin/env node
/**
 * B-030: cross-document consistency checks (machine gate)
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = process.cwd();
let failed = false;
function fail(msg) {
  console.error("DOCS-CONSISTENCY:", msg);
  failed = true;
}

const readme = readFileSync(join(root, "README.md"), "utf8");
if (!/IMPLEMENTATION_SCAFFOLD_PHASE|implementation scaffold/i.test(readme)) {
  fail("README must declare implementation scaffold phase");
}
if (/Production release.*\*\*GO\*\*/i.test(readme) && !/NO-GO/i.test(readme)) {
  fail("README must not claim production GO");
}

const gate = join(root, "docs/core/CODING-GATE.md");
const features = join(root, "docs/core/IMPLEMENTATION-READY-FEATURES.md");
if (existsSync(gate) && existsSync(features)) {
  const ft = readFileSync(features, "utf8");
  if (/may start in parallel/i.test(ft) && !/sequential/i.test(ft)) {
    fail("IMPLEMENTATION-READY-FEATURES still allows unconstrained parallel production");
  }
  if (!/READY TO IMPLEMENT ≠ IMPLEMENTED/i.test(ft) && !/READY TO IMPLEMENT ≠ IMPLEMENTED/.test(ft)) {
    // check vocabulary section
    if (!/RELEASE-PROVEN/.test(ft)) {
      fail("Features doc missing status vocabulary");
    }
  }
}

const index = join(root, "docs/core/IMPLEMENTATION-READY-INDEX.md");
if (existsSync(index)) {
  const ix = readFileSync(index, "utf8");
  for (const feat of ["crypto", "funds", "stocks", "metals"]) {
    if (existsSync(join(root, `src/features/${feat}`)) && !new RegExp(feat, "i").test(ix)) {
      fail(`INDEX missing HEAD mention of feature folder ${feat}`);
    }
  }
}

// Public API PARTIAL honesty
for (const feat of ["crypto", "funds", "stocks", "metals"]) {
  const api = join(root, `src/features/${feat}/public-api/index.js`);
  if (!existsSync(api)) continue;
  const t = readFileSync(api, "utf8");
  if (!/PARTIAL|RELEASE-PROVEN|IMPLEMENTED/.test(t)) {
    fail(`${feat} public-api missing status`);
  }
}

if (failed) process.exit(1);
console.log("docs-consistency: OK");
