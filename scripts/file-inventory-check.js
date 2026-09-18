#!/usr/bin/env node
/**
 * filesystem ↔ docs/core/file-inventory.tsv must match.
 * BUG-F14: also require tracked-class files to appear in inventory (bidirectional).
 */
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { execSync } from "child_process";

const invPath = "docs/core/file-inventory.tsv";
const text = readFileSync(invPath, "utf8").trim().split("\n").slice(1);
const listed = new Set();
const missing = [];
for (const line of text) {
  if (!line.trim()) continue;
  const path = line.split("\t")[0];
  listed.add(path);
  if (!existsSync(path)) missing.push(path);
}
if (missing.length) {
  console.error("file-inventory-check FAIL: inventory points to missing files:");
  for (const m of missing) console.error("  -", m);
  process.exit(1);
}

const ALLOW_PREFIX = [
  ".git/",
  "node_modules/",
  ".pf-data/",
];
const ALLOW_EXACT = new Set([
  ".gitattributes",
  ".gitignore",
  ".github/FEATURE-README-TEMPLATE.md",
  ".github/workflows/ci.yml",
  "docs/core/file-inventory.tsv",
  "package-lock.json",
]);

let tracked = [];
try {
  tracked = execSync("git ls-files", { encoding: "utf8" })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
} catch {
  console.log("file-inventory-check: skip reverse scan (not a git checkout)");
  console.log("file-inventory-check OK entries=", listed.size);
  process.exit(0);
}

const unlisted = [];
for (const f of tracked) {
  if (ALLOW_EXACT.has(f)) continue;
  if (ALLOW_PREFIX.some((p) => f.startsWith(p))) continue;
  if (!listed.has(f)) unlisted.push(f);
}
if (unlisted.length) {
  console.error("file-inventory-check FAIL: tracked files missing from inventory:");
  for (const u of unlisted.slice(0, 40)) console.error("  -", u);
  if (unlisted.length > 40) console.error(`  ... +${unlisted.length - 40} more`);
  process.exit(1);
}
console.log("file-inventory-check OK entries=", listed.size, "tracked=", tracked.length);
