#!/usr/bin/env node
/**
 * command:contract gate
 * Catalog is semantic authority. Fail when an IMPLEMENTED command's catalog-required
 * non-alias fields are not referenced in that feature's command source file.
 * File matching is scoped by feature folder to avoid cross-feature false positives.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const catalog = JSON.parse(readFileSync(join(root, "docs/core/registry/command-catalog.json"), "utf8"));

/** Map commandId action segment to likely filenames under src/features/<feature>/commands/ */
const ACTION_FILE_ALIASES = {
  create: ["createLoan.js", "create.js"],
  recordPayment: ["recordPayment.js"],
  reversePayment: ["reversePayment.js"],
  generateSchedule: ["generateSchedule.js"],
  previewSchedule: ["previewSchedule.js"],
  buy: ["buy.js"],
  sell: ["sell.js"],
  transfer: ["transfer.js"],
  settle: ["settle.js"],
  dividend: ["dividend.js"],
  subscribe: ["subscribe.js"],
  redeem: ["redeem.js"],
  distribution: ["distribution.js"],
  delivery: ["delivery.js"],
};

function commandSourceFiles(commandId) {
  const [feature, action] = commandId.split(".");
  const dir = join(root, "src/features", feature, "commands");
  if (!existsSync(dir)) return [];
  const names = ACTION_FILE_ALIASES[action] || [`${action}.js`];
  const found = [];
  for (const name of names) {
    const p = join(dir, name);
    if (existsSync(p)) found.push(p);
  }
  // fallback: any file in commands containing action token
  if (!found.length) {
    for (const name of readdirSync(dir)) {
      if (!name.endsWith(".js") || name.endsWith(".test.js")) continue;
      if (name.toLowerCase().includes(action.toLowerCase())) found.push(join(dir, name));
    }
  }
  return found;
}

function fieldReferenced(source, name) {
  // input.operationId / p.field / "field" in validation lists
  const patterns = [
    new RegExp(`\\b(?:input|p|payload)\\.${name}\\b`),
    new RegExp(`["']${name}["']`),
    new RegExp(`\\b${name}\\b`),
  ];
  return patterns.some((re) => re.test(source));
}

let errors = 0;
let checked = 0;
const implemented = Object.entries(catalog.commands || {}).filter(([, v]) => v.status === "IMPLEMENTED");

for (const [id, meta] of implemented) {
  const files = commandSourceFiles(id);
  if (!files.length) {
    // Host modules may lack package commands — warn only
    console.warn(`command:contract WARN no feature command file for ${id}`);
    continue;
  }
  checked++;
  const source = files.map((f) => readFileSync(f, "utf8")).join("\n");
  const fields = meta.card?.requestFields || [];
  for (const f of fields) {
    if (!f.required || f.aliasOf) continue;
    if (!fieldReferenced(source, f.name)) {
      console.error(
        `command:contract FAIL ${id}: catalog required "${f.name}" not referenced in ${files.map((x) => x.replace(root + "/", "")).join(", ")}`,
      );
      errors++;
    }
  }
}

if (errors) {
  console.error(`command:contract: ${errors} error(s) across ${checked} commands`);
  process.exit(1);
}
console.log(`command:contract: OK (${checked} implemented feature commands with sources)`);
