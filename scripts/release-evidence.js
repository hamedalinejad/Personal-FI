#!/usr/bin/env node
/**
 * Assemble machine-readable release evidence from CURRENT authorities only.
 * Does not claim GREEN. No historical ticket doc paths.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const schema = fs.readFileSync(path.join(root, "docs/core/db/schema.sql"), "utf8");
const schemaHash = createHash("sha256").update(schema).digest("hex").slice(0, 16);
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const status = readJson("docs/core/registry/status.registry.json");
const requirements = readJson("docs/core/registry/requirements-matrix.json");
const catalog = readJson("docs/core/registry/command-catalog.json");

const evidence = {
  registryVersion: "1",
  schemaHash,
  gatesScript: pkg.scripts.gates,
  production: status.release?.production || status.production || "NO-GO",
  FREEZE_PROVEN: status.schema_status?.FREEZE_PROVEN === true ? true : false,
  RELEASE_PROVEN: status.release?.RELEASE_PROVEN === true,
  SEMANTIC_CODING_READY: status.schema_status?.SEMANTIC_CODING_READY === true,
  authority: {
    human: [
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
      "docs/modules/",
    ],
    machine: [
      "docs/core/db/schema.sql",
      "docs/core/registry/command-catalog.json",
      "docs/core/registry/field-preservation-matrix.json",
      "docs/core/registry/requirements-matrix.json",
      "docs/core/registry/status.registry.json",
      "docs/core/registry/license-editions.json",
      "docs/core/registry/fixture-manifest.json",
    ],
  },
  commandAuthority: {
    perCommandStatus: "docs/core/registry/command-catalog.json",
    featureEditionRelease: "docs/core/registry/status.registry.json",
    note: "Do not duplicate per-command status in status.registry",
  },
  counts: {
    publicCommands: Object.keys(catalog.commands || {}).length,
    requirements: (requirements.requirements || []).length,
  },
  proof: status.proof || {},
  release: status.release || {},
  requiredGreenForRelease: [
    "npm run gates",
    "field-preservation exact persistence for PERSISTED rows",
    "golden families for claimed commands",
    "recovery matrix executable",
    "standalone editions claimed",
    "browser adapter RELEASE-PROVEN if shipping browser",
  ],
};

const out = path.join(root, "docs/core/RELEASE-EVIDENCE.json");
fs.writeFileSync(out, JSON.stringify(evidence, null, 2) + "\n");
console.log("release-evidence:", out, "schemaHash=", schemaHash, "production=", evidence.production);
