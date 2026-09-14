#!/usr/bin/env node
/**
 * Fail if forbidden command aliases appear as keys in catalog or status.registry features.commands
 */
import { readFileSync } from "node:fs";

const catalog = JSON.parse(readFileSync("docs/core/registry/command-catalog.json", "utf8"));
const status = JSON.parse(readFileSync("docs/core/registry/status.registry.json", "utf8"));
const forbidden = catalog.naming?.forbiddenAliases || {};
const errors = [];

for (const bad of Object.keys(forbidden)) {
  if (catalog.commands[bad]) {
    errors.push(`catalog has forbidden key ${bad}; use ${forbidden[bad]}`);
  }
}
const features = status.features || {};
for (const [feat, body] of Object.entries(features)) {
  const cmds = body.commands || {};
  for (const bad of Object.keys(forbidden)) {
    if (cmds[bad]) {
      errors.push(`status.registry features.${feat}.commands has ${bad}; use ${forbidden[bad]}`);
    }
  }
}
// Every status command should exist in catalog
for (const [feat, body] of Object.entries(features)) {
  for (const id of Object.keys(body.commands || {})) {
    if (!catalog.commands[id]) {
      errors.push(`status has ${id} but command-catalog missing`);
    }
  }
}

if (errors.length) {
  console.error("command-catalog-check FAILED:");
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}
console.log("command-catalog-check OK commands=", Object.keys(catalog.commands).length);
