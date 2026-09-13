#!/usr/bin/env node
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = process.cwd();
let failed = false;
function fail(msg) {
  console.error("DOCS-CONSISTENCY:", msg);
  failed = true;
}

const readme = readFileSync(join(root, "README.md"), "utf8");
if (/Production release.*\*\*GO\*\*/i.test(readme) && !/NO-GO/i.test(readme)) {
  fail("README must not claim production GO without NO-GO");
}

const std = join(root, "docs/DOCUMENTATION-STANDARD.md");
if (!existsSync(std)) fail("DOCUMENTATION-STANDARD missing");

const owners = [
  "docs/PRODUCT.md",
  "docs/ARCHITECTURE.md",
  "docs/FINANCIAL-CORE.md",
  "docs/DATA-MODEL.md",
  "docs/API.md",
  "docs/REPORTING.md",
  "docs/OFFLINE-RELEASE.md",
  "docs/DEVELOPMENT.md",
];
for (const o of owners) {
  if (!existsSync(join(root, o))) fail(`owner missing ${o}`);
}

const reg = JSON.parse(readFileSync(join(root, "docs/core/registry/status.registry.json"), "utf8"));
const ao = reg.authority_owners || {};
for (const [k, v] of Object.entries(ao)) {
  const path = String(v).split("#")[0];
  if (path.startsWith("docs/") && !existsSync(join(root, path))) {
    fail(`authority_owners.${k} dead path ${v}`);
  }
}

if (failed) process.exit(1);
console.log("docs-consistency: OK");
