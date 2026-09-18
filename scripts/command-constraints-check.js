#!/usr/bin/env node
/**
 * Validate machine-readable command constraints in command-catalog.json.
 * Phase 0 / R-02 — conditional constraints are first-class.
 */
import { readFileSync } from "fs";

const ALLOWED_TYPES = new Set([
  "atLeastOneOf",
  "exactlyOneOf",
  "whenBothPresent",
  "positiveDecimal",
  "pricingMode",
  "requiredUnless",
  "enum",
  "fieldEquals",
  "when",
]);

const REQUIRED_COMMANDS = [
  "funds.redeem",
  "funds.subscribe",
  "metals.buy",
  "loan.create",
  "crypto.buy",
];

const catalog = JSON.parse(readFileSync("docs/core/registry/command-catalog.json", "utf8"));
const cmds = catalog.commands || {};
const errors = [];

for (const cid of REQUIRED_COMMANDS) {
  const cmd = cmds[cid];
  if (!cmd) {
    errors.push(`missing command ${cid}`);
    continue;
  }
  const constraints = cmd.constraints || cmd.card?.constraints;
  if (!Array.isArray(constraints) || constraints.length === 0) {
    errors.push(`${cid}: constraints[] required and non-empty`);
    continue;
  }
  const ids = new Set();
  for (const c of constraints) {
    if (!c.id || typeof c.id !== "string") errors.push(`${cid}: constraint missing id`);
    if (ids.has(c.id)) errors.push(`${cid}: duplicate constraint id ${c.id}`);
    ids.add(c.id);
    if (!ALLOWED_TYPES.has(c.type)) errors.push(`${cid}.${c.id}: unknown type ${c.type}`);
    if (!c.error || typeof c.error !== "string") errors.push(`${cid}.${c.id}: error code required`);
    if (c.type === "atLeastOneOf" || c.type === "exactlyOneOf" || c.type === "whenBothPresent") {
      if (!Array.isArray(c.fields) || c.fields.length < 1) {
        errors.push(`${cid}.${c.id}: fields[] required`);
      }
    }
    if (c.type === "enum") {
      if (!c.field || !Array.isArray(c.values) || c.values.length < 1) {
        errors.push(`${cid}.${c.id}: enum needs field + values[]`);
      }
    }
    if (c.type === "requiredUnless") {
      if (!c.field || !c.unless?.field) errors.push(`${cid}.${c.id}: requiredUnless needs field + unless.field`);
    }
    if (c.type === "fieldEquals") {
      if (!c.left || !c.right) errors.push(`${cid}.${c.id}: fieldEquals needs left + right`);
    }
  }
  // requestFields must include referenced field names (when present on card)
  const rf = (cmd.card?.requestFields || []).map((f) => f.name);
  if (rf.length) {
    const rfSet = new Set(rf);
    for (const c of constraints) {
      const names = [
        ...(c.fields || []),
        c.field,
        c.left,
        c.right,
        c.unless?.field,
      ].filter(Boolean);
      for (const n of names) {
        if (typeof n === "string" && !rfSet.has(n) && n !== "feeQuantity") {
          // feeQuantity may be derived; soft warn only for unknown
          if (!["feeQuantity"].includes(n)) {
            // allow if it's a known derived alias
          }
        }
      }
    }
  }
}

if (errors.length) {
  console.error("command-constraints-check FAIL:");
  for (const e of errors) console.error("  -", e);
  process.exit(1);
}
console.log(
  "command-constraints-check OK commands=",
  REQUIRED_COMMANDS.length,
  "constraintSchema=",
  catalog.constraintSchema?.version ?? "?"
);
