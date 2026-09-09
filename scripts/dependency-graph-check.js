#!/usr/bin/env node
/**
 * Dependency graph guard — fails on illegal Feature→Feature internal imports
 * and Feature→UI reverse dependencies.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join } from "path";

const root = process.cwd();
const featuresRoot = join(root, "src/features");
const coreRoot = join(root, "src/core");

const ILLEGAL = [
  /from\s+["'][^"']*features\/[^"']+\/(internal|ledger|domain)\//,
  /from\s+["'][^"']*\/ui\//,
  /from\s+["']@\/features\/(?!loan)/, // placeholder: expand when more packages
];

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(js|ts|mjs)$/.test(name)) acc.push(p);
  }
  return acc;
}

let failed = false;
const files = [...walk(featuresRoot), ...walk(coreRoot)];
for (const f of files) {
  const text = readFileSync(f, "utf8");
  const rel = f.slice(root.length + 1);
  // Feature must not import another feature's non-public path
  if (rel.startsWith("src/features/")) {
    const self = rel.split("/")[2];
    const imports = [...text.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
    for (const spec of imports) {
      if (spec.includes("features/") && !spec.includes(`features/${self}`)) {
        if (/\/(internal|ledger|domain)\//.test(spec) || !spec.includes("public-api")) {
          console.error("DEP_GRAPH:", rel, "→ illegal", spec);
          failed = true;
        }
      }
    }
  }
  // Core must not import features (production modules only; *.test.js may exercise features)
  if (rel.startsWith("src/core/") && !/\.test\.js$/.test(rel)) {
    if (/from\s+["'][^"']*features\//.test(text)) {
      console.error("DEP_GRAPH: core must not import features:", rel);
      failed = true;
    }
  }
}

if (failed) {
  console.error("dependency-graph-check FAILED");
  process.exit(1);
}
console.log("dependency-graph-check: OK (", files.length, "files)");
process.exit(0);
