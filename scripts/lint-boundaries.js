#!/usr/bin/env node
/**
 * Minimal boundary lint until full ESLint lands.
 * Fails if any feature file imports another feature's internal path.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join } from "path";

const root = join(process.cwd(), "src/features");
if (!existsSync(root)) {
  console.log("lint-boundaries: no src/features yet — OK");
  process.exit(0);
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (name.endsWith(".js") || name.endsWith(".ts")) acc.push(p);
  }
  return acc;
}

const files = walk(root);
let failed = false;
for (const f of files) {
  const text = readFileSync(f, "utf8");
  const feature = f.split("src/features/")[1]?.split("/")[0];
  const re = /from\s+["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(text))) {
    const spec = m[1];
    if (spec.includes("features/") && !spec.includes(`features/${feature}`)) {
      if (spec.includes("/internal") || spec.includes("/ledger") || spec.includes("/domain")) {
        console.error("BOUNDARY:", f, "→", spec);
        failed = true;
      }
    }
  }
}
if (failed) process.exit(1);
console.log("lint-boundaries: OK (", files.length, "files)");
