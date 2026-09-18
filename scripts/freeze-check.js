#!/usr/bin/env node
/**
 * Semantic freeze gate — fails if structural freeze criteria missing.
 * Does NOT claim RELEASE_PROVEN / browser GREEN by itself.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
let failed = false;
function fail(m) {
  console.error("freeze-check:", m);
  failed = true;
}

const catalog = JSON.parse(readFileSync(join(root, "docs/core/registry/command-catalog.json"), "utf8"));
const cmds = catalog.commands || {};
if (Object.keys(cmds).length < 40) fail("command catalog too small");
for (const [id, c] of Object.entries(cmds)) {
  if (!c.card?.purpose) fail(`missing card: ${id}`);
}

if (!existsSync(join(root, "docs/core/registry/field-preservation-matrix.json"))) {
  fail("missing field-preservation-matrix.json");
}

const status = JSON.parse(readFileSync(join(root, "docs/core/registry/status.registry.json"), "utf8"));
if (status.schema_status?.FREEZE_PROVEN === true && status.schema_status?.RELEASE_PROVEN !== true) {
  // freeze may be true before release — ok
}
if (status.schema_status?.FREEZE_PROVEN === true) {
  console.log("freeze-check: FREEZE_PROVEN claimed — ensure goldens+recovery human-reviewed");
}

// Active goldens must exist
for (const id of ["LOAN-FLAT", "LOAN-DECLINING", "METAL-FINEWEIGHT", "FUND-NAV-VS-TX-PRICE"]) {
  const p = join(root, "fixtures", `${id}.json`);
  if (!existsSync(p)) fail(`missing golden ${id}`);
}

if (failed) process.exit(1);
console.log("freeze-structure-check: OK (not freeze-proof; FREEZE_PROVEN requires all blockers green)");
