#!/usr/bin/env node
/**
 * Live define/evidence/related_contracts paths must exist.
 * HISTORICAL / DEFERRED / CLOSED_HISTORICAL may warn only.
 */
import { readFileSync, existsSync } from "node:fs";

const reg = JSON.parse(readFileSync("docs/core/registry/requirements-matrix.json", "utf8"));
const ids = Object.keys(reg.requirements || {});
let failed = false;

function fail(msg) {
  console.error("requirements-matrix-check:", msg);
  failed = true;
}

function isHistorical(r) {
  const status = String(r.status || "").toUpperCase();
  return (
    status === "HISTORICAL" ||
    status === "DEFERRED" ||
    status === "CLOSED_HISTORICAL" ||
    r.reference_class === "HISTORICAL" ||
    r.reference_class === "DEFERRED"
  );
}

function collectPaths(r) {
  const out = [];
  for (const key of ["define", "evidence", "related_contracts", "references"]) {
    const v = r[key];
    if (Array.isArray(v)) out.push(...v.filter((x) => typeof x === "string"));
    else if (typeof v === "string") out.push(v);
  }
  return out;
}

if (ids.length < 1) fail("no requirements");

for (const id of ids) {
  const r = reg.requirements[id];
  if (!r?.title || !r?.status) fail(`incomplete ${id}`);
  const historical = isHistorical(r);
  for (const p of collectPaths(r)) {
    const path = String(p).split("#")[0];
    if (!path || path.startsWith("http")) continue;
    // Only filesystem-like references (skip free-text evidence labels)
    if (!path.startsWith("docs/") && !path.startsWith("src/") && !path.startsWith("scripts/") && !path.startsWith("fixtures/") && !path.startsWith("tests/")) continue;
    if (!existsSync(path)) {
      if (historical) {
        console.warn("OK historical/deferred missing path for", id, path);
      } else {
        fail(`missing live reference for ${id}: ${path}`);
      }
    }
  }
  // Navigation must not be owned by FINANCIAL-CORE
  if (id === "R-M26") {
    const defs = r.define || [];
    if (defs.some((d) => String(d).includes("FINANCIAL-CORE"))) {
      fail("R-M26 must not define navigation against FINANCIAL-CORE.md");
    }
    if (!defs.some((d) => String(d).includes("PRODUCT.md"))) {
      fail("R-M26 must include docs/PRODUCT.md");
    }
  }
}

if (failed) process.exit(1);
console.log("requirements-matrix-check: OK", ids.length);
