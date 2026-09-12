#!/usr/bin/env node
/**
 * REQ-032 — assemble machine-readable release evidence skeleton.
 * Does not claim GREEN; records gate script presence and schema hash.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = fs.readFileSync(path.join(root, "docs/core/db/schema.sql"), "utf8");
const schemaHash = createHash("sha256").update(schema).digest("hex").slice(0, 16);
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

const evidence = {
  generatedAt: new Date().toISOString(),
  schemaHash,
  gatesScript: pkg.scripts.gates,
  status: {
    production: "NO-GO",
    loanVerticalCoding: "ALLOWED_UNDER_CODING_GATE",
    browserSqlJs: "OPEN",
    fullReports: "PARTIAL",
    standaloneAll: "PARTIAL",
  },
  requiredGreenForRelease: [
    "npm run gates",
    "Golden families claimed",
    "Recovery matrix COVERED",
    "Standalone editions claimed",
    "Browser adapter RELEASE-PROVEN if shipping browser",
    "REQ-001 deferred commands explicit",
  ],
  docs: {
    reqStatus: "docs/core/REQ-001-032-STATUS.md",
    audit613: "docs/core/AUDIT-BATCH-6-13-STATUS.md",
    authority: "docs/core/DOC-AUTHORITY-CHAIN.md",
  },
};

const out = path.join(root, "docs/core/RELEASE-EVIDENCE.json");
fs.writeFileSync(out, JSON.stringify(evidence, null, 2) + "\n");
console.log("release-evidence:", out, "schemaHash=", schemaHash, "production=NO-GO");
