#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join } from "path";

const root = process.cwd();
const featuresRoot = join(root, "src/features");
const coreRoot = join(root, "src/core");

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
const featureFiles = walk(featuresRoot);
const coreFiles = walk(coreRoot);

for (const f of featureFiles) {
  const text = readFileSync(f, "utf8");
  const rel = f.slice(root.length + 1);
  const self = rel.split("/")[2];
  for (const m of text.matchAll(/from\s+["']([^"']+)["']/g)) {
    const spec = m[1];
    if (!spec.includes("features/")) continue;
    if (spec.includes(`features/${self}`)) continue;
    // only public-api of other features allowed
    if (!/features\/[^/]+\/public-api/.test(spec)) {
      console.error("BOUNDARY forbidden:", rel, "→", spec);
      failed = true;
    }
  }
}

for (const f of coreFiles) {
  const text = readFileSync(f, "utf8");
  if (/from\s+["'][^"']*features\//.test(text)) {
    console.error("BOUNDARY: core→feature forbidden:", f.slice(root.length + 1));
    failed = true;
  }
}

if (failed) process.exit(1);
console.log("lint-boundaries: OK (features", featureFiles.length, "core", coreFiles.length, ")");
