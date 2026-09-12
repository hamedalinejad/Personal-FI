#!/usr/bin/env node
/**
 * P0-B01/B16 — single command lifecycle status; fail on conflicts with hand docs.
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

// Check FEATURE-COMMAND-STATUS.md does not claim opposite of registry for stocks.settle
const statusMd = join(root, "docs/core/command-coverage/FEATURE-COMMAND-STATUS.md");
if (existsSync(statusMd)) {
  const text = readFileSync(statusMd, "utf8");
  for (const [cmd, st] of Object.entries(commands)) {
    if (st === "IMPLEMENTED") {
      // if doc says settle incomplete as command — fail only if explicit NOT
      const neg = new RegExp(`${cmd.replace(".", "\\.")}.*NOT.?IMPLEMENTED`, "i");
      if (neg.test(text)) {
        console.error(`conflict: ${cmd} IMPLEMENTED in registry but negated in FEATURE-COMMAND-STATUS`);
        process.exit(1);
      }
    }
  }
}

// OPEN-REQUIREMENTS should not say stocks.settle command missing if registry IMPLEMENTED
const openReq = join(root, "docs/core/authority/OPEN-REQUIREMENTS-RELEASE.md");
if (existsSync(openReq)) {
  const t = readFileSync(openReq, "utf8");
  if (/stocks\.settle.*not implemented/i.test(t) && commands["stocks.settle"] === "IMPLEMENTED") {
    console.error("OPEN-REQUIREMENTS contradicts stocks.settle IMPLEMENTED");
    process.exit(1);
  }
}

console.log("status-registry-check: OK", Object.keys(commands).length, "commands");
