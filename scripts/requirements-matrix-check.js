#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";

const reg = JSON.parse(readFileSync("docs/core/registry/requirements-matrix.json", "utf8"));
const ids = Object.keys(reg.requirements || {});
let failed = false;

function fail(msg) {
  console.error("requirements-matrix-check:", msg);
  failed = true;
}

if (ids.length < 1) fail("no requirements");

for (const id of ids) {
  const r = reg.requirements[id];
  if (!r?.title || !r?.status) fail(`incomplete ${id}`);
  const status = String(r.status || "").toUpperCase();
  const historical =
    status === "HISTORICAL" ||
    status === "DEFERRED" ||
    status === "CLOSED_HISTORICAL" ||
    r.reference_class === "HISTORICAL" ||
    r.reference_class === "DEFERRED";

  for (const p of r.define || []) {
    const path = String(p).split("#")[0];
    if (!path) continue;
    if (!existsSync(path)) {
      if (historical) {
        console.warn("OK historical/deferred missing path for", id, path);
      } else {
        fail(`missing live reference for ${id}: ${path}`);
      }
    }
  }
}

if (failed) process.exit(1);
console.log("requirements-matrix-check: OK", ids.length);
