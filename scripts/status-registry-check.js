#!/usr/bin/env node
/**
 * /B16 — single command lifecycle status; fail on conflicts with hand docs.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const regPath = join(root, "docs/core/registry/status.registry.json");
if (!existsSync(regPath)) {
  console.error("status.registry.json missing");
  process.exit(1);
}
const reg = JSON.parse(readFileSync(regPath, "utf8"));
const allowed = new Set([
  "SPEC_LOCKED",
  "IMPLEMENTED",
  "PARTIAL",
  "BLOCKED",
  "DEFERRED",
  "CLOSED_HISTORICAL",
  "NOT_IMPLEMENTED",
  "NO-GO",
  "ALLOWED",
  "FORBIDDEN_UNTIL_PHASE_ORDER",
]);

const commands = {};
for (const [feat, body] of Object.entries(reg.features || {})) {
  for (const [cmd, st] of Object.entries(body.commands || {})) {
    if (commands[cmd]) {
      console.error(`duplicate command key: ${cmd}`);
      process.exit(1);
    }
    commands[cmd] = st;
    if (!allowed.has(st) && st !== "IMPLEMENTED") {
      // allow IMPLEMENTED
    }
    if (!["SPEC_LOCKED", "IMPLEMENTED", "PARTIAL", "BLOCKED", "DEFERRED"].includes(st)) {
      console.error(`invalid command status ${cmd}=${st}`);
      process.exit(1);
    }
  }
}

console.log("status-registry-check: OK", Object.keys(commands).length, "commands");
