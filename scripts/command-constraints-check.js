#!/usr/bin/env node
/**
 * Validate machine-readable command constraints in command-catalog.json.
 * Phase 0 / R-02 — semantic validation, not mere presence.
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

function fieldNames(cmd) {
  return new Set((cmd.card?.requestFields || []).map((f) => f.name));
}

for (const cid of REQUIRED_COMMANDS) {
  const cmd = cmds[cid];
  if (!cmd) {
    errors.push(`missing command ${cid}`);
    continue;
  }
  // Single authority: root constraints preferred; card must match if both present
  const root = cmd.constraints;
  const cardC = cmd.card?.constraints;
  if (root && cardC && JSON.stringify(root) !== JSON.stringify(cardC)) {
    errors.push(`${cid}: constraints on root and card.constraints must be identical`);
  }
  const constraints = root || cardC;
  if (!Array.isArray(constraints) || constraints.length === 0) {
    errors.push(`${cid}: constraints[] required and non-empty`);
    continue;
  }
  const rfSet = fieldNames(cmd);
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
      } else {
        for (const f of c.fields) {
          if (rfSet.size && !rfSet.has(f)) {
            errors.push(`${cid}.${c.id}: field ${f} not in requestFields`);
          }
        }
      }
    }
    if (c.type === "whenBothPresent" && (!c.rule || typeof c.rule !== "string")) {
      errors.push(`${cid}.${c.id}: whenBothPresent needs rule string`);
    }
    if (c.type === "enum") {
      if (!c.field || !Array.isArray(c.values) || c.values.length < 1) {
        errors.push(`${cid}.${c.id}: enum needs field + values[]`);
      } else if (rfSet.size && !rfSet.has(c.field)) {
        errors.push(`${cid}.${c.id}: enum field ${c.field} not in requestFields`);
      }
      // enum values must be non-empty strings
      for (const v of c.values || []) {
        if (typeof v !== "string" || !v) errors.push(`${cid}.${c.id}: invalid enum value`);
      }
    }
    if (c.type === "requiredUnless") {
      if (!c.field || !c.unless?.field) {
        errors.push(`${cid}.${c.id}: requiredUnless needs field + unless.field`);
      } else if (rfSet.size) {
        if (!rfSet.has(c.field)) errors.push(`${cid}.${c.id}: field ${c.field} not in requestFields`);
        if (!rfSet.has(c.unless.field)) errors.push(`${cid}.${c.id}: unless.field ${c.unless.field} not in requestFields`);
      }
    }
    if (c.type === "fieldEquals") {
      if (!c.left || !c.right) errors.push(`${cid}.${c.id}: fieldEquals needs left + right`);
      else if (rfSet.size) {
        if (!rfSet.has(c.left)) errors.push(`${cid}.${c.id}: left ${c.left} not in requestFields`);
        if (!rfSet.has(c.right)) errors.push(`${cid}.${c.id}: right ${c.right} not in requestFields`);
      }
    }
    if (c.type === "pricingMode") {
      if (!c.modes || typeof c.modes !== "object") {
        errors.push(`${cid}.${c.id}: pricingMode needs modes object`);
      } else {
        for (const [mode, spec] of Object.entries(c.modes)) {
          if (!spec || !Array.isArray(spec.required)) {
            errors.push(`${cid}.${c.id}: mode ${mode} needs required[]`);
          } else if (rfSet.size) {
            for (const f of spec.required) {
              if (!rfSet.has(f)) errors.push(`${cid}.${c.id}: mode ${mode} field ${f} not in requestFields`);
            }
          }
        }
      }
    }
    if (c.type === "when") {
      if (!c.when || !c.rule) errors.push(`${cid}.${c.id}: when needs when + rule`);
    }
    // requiredness parity: if constraint.required===true, requestField should be required
    if (c.required === true && c.field && cmd.card?.requestFields) {
      const rf = cmd.card.requestFields.find((f) => f.name === c.field);
      if (rf && rf.required === false) {
        errors.push(`${cid}.${c.id}: constraint required but requestField.required=false for ${c.field}`);
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
