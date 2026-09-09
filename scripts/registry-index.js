#!/usr/bin/env node
/**
 * Package/feature registry index — machine-readable inventory of executable surface.
 */
import { readdirSync, existsSync, writeFileSync, statSync } from "fs";
import { join } from "path";

const root = process.cwd();
const features = [];
const fr = join(root, "src/features");
if (existsSync(fr)) {
  for (const name of readdirSync(fr)) {
    const p = join(fr, name);
    if (!statSync(p).isDirectory()) continue;
    features.push({
      id: name,
      publicApi: existsSync(join(p, "public-api/index.js")) || existsSync(join(p, "public-api/index.ts")),
      commands: existsSync(join(p, "commands")),
      fixtures: existsSync(join(p, "fixtures")),
    });
  }
}

const registry = {
  generatedAt: new Date().toISOString(),
  core: existsSync(join(root, "src/core")),
  features,
  scripts: {
    test: "npm test",
    drift: "node scripts/schema-drift-test.js",
    inventory: "node scripts/field-inventory-verify.js",
    depGraph: "node scripts/dependency-graph-check.js",
    docs: "node scripts/docs-validator.js",
  },
};
const out = join(root, "docs/core/registry.index.json");
writeFileSync(out, JSON.stringify(registry, null, 2));
console.log("registry-index: wrote", out, "features=", features.length);
