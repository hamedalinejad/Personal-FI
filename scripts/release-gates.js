/**
 * Release gate checker (PHASE 10).
 * Does NOT set PRODUCTION=GO — only reports evidence.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { matrixReadiness } from "../src/core/recovery/recoveryMatrix.js";
import { COMMAND_REGISTRY } from "../src/application/commandRegistry.js";
import { REPORT_REGISTRY } from "../src/application/reporting/reportRegistry.js";
import { EDITIONS } from "../src/core/license/capabilityGate.js";

const root = process.cwd();

function loadJson(rel) {
  const p = join(root, rel);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

const checks = [];

function check(name, ok, detail) {
  checks.push({ name, ok: !!ok, detail: detail || "" });
}

// Registries present
check("status.registry.json", existsSync(join(root, "docs/core/registry/status.registry.json")));
check("requirements-matrix.json", existsSync(join(root, "docs/core/registry/requirements-matrix.json")));
check("field-preservation-decisions.json", existsSync(join(root, "docs/core/registry/field-preservation-decisions.json")));
check("commandRegistry non-empty", Object.keys(COMMAND_REGISTRY).length > 10);
check("reportRegistry has core statements", REPORT_REGISTRY.some((r) => r.id === "trialBalance"));
check("editions defined", !!EDITIONS.standalone && !!EDITIONS.pro);

const status = loadJson("docs/core/registry/status.registry.json");
check("PRODUCTION is NO-GO until evidence", status?.PRODUCTION === "NO-GO" || status?.PRODUCTION !== "GO");

const recovery = matrixReadiness();
check(
  "recovery matrix not fully release-ready (browser E2E pending)",
  recovery.releaseReady === false,
  JSON.stringify(recovery.productionBlockers)
);

check("singleWriter module exists", existsSync(join(root, "src/core/persistence/browser/singleWriter.js")));
check("idbByteStore exists", existsSync(join(root, "src/core/persistence/browser/idbByteStore.js")));
check("browserProductionHost exists", existsSync(join(root, "src/platform/web/browserProductionHost.js")));
check("backupPackage exists", existsSync(join(root, "src/core/recovery/backupPackage.js")));
check("DEFERRED-V1 locked", existsSync(join(root, "docs/DEFERRED-V1.md")));

const failed = checks.filter((c) => !c.ok);
const passed = checks.filter((c) => c.ok);

console.log("=== Personal-FI Release Gates ===");
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name}${c.detail ? " — " + c.detail : ""}`);
}
console.log(`\n${passed.length}/${checks.length} structural checks pass`);
console.log("FREEZE_PROVEN: false");
console.log("RELEASE_PROVEN: false");
console.log("PRODUCTION: NO-GO");
console.log(
  "Reason: browser offline E2E (R-M24), multi-tab E2E, full import commit host loop, and recovery scenarios 5/9/10 still need real browser proof."
);

process.exit(failed.length ? 1 : 0);
