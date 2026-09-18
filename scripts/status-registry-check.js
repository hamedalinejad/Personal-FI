#!/usr/bin/env node
/**
 * status.registry.json — feature/edition/release summaries only.
 * BUG-F17: per-command lifecycle status authority = command-catalog.json
 */
import { readFileSync, existsSync } from "fs";

const regPath = "docs/core/registry/status.registry.json";
const catPath = "docs/core/registry/command-catalog.json";
if (!existsSync(regPath)) {
  console.error("missing status.registry.json");
  process.exit(1);
}
const reg = JSON.parse(readFileSync(regPath, "utf8"));
const catalog = existsSync(catPath)
  ? JSON.parse(readFileSync(catPath, "utf8"))
  : { commands: {} };

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

// Per-command blocks in status.registry are non-authoritative if present —
// require parity with catalog when both list a command
const catalogCmds = catalog.commands || {};
let regCmdCount = 0;
for (const [feat, body] of Object.entries(reg.features || {})) {
  for (const [cmd, st] of Object.entries(body.commands || {})) {
    regCmdCount++;
    if (!allowed.has(st)) {
      console.error(`invalid command status ${cmd}=${st}`);
      process.exit(1);
    }
    if (catalogCmds[cmd] && catalogCmds[cmd].status && catalogCmds[cmd].status !== st) {
      console.error(
        `command status drift: ${cmd} registry=${st} catalog=${catalogCmds[cmd].status}`,
      );
      process.exit(1);
    }
  }
}

console.log(
  "status-registry-check: OK catalogCommands=",
  Object.keys(catalogCmds).length,
  "registryFeatureCommands=",
  regCmdCount,
  "(catalog is sole lifecycle authority)",
);
