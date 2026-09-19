/**
 * Phase 17 — Capability gate at public API boundary.
 * Disable edition → LICENSE_REQUIRED on commands; history always readable/exportable.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
let editionsCache = null;

function loadEditions() {
  if (editionsCache) return editionsCache;
  editionsCache = JSON.parse(
    readFileSync(join(root, "docs/core/registry/license-editions.json"), "utf8"),
  );
  return editionsCache;
}

export function listEditions() {
  return Object.keys(loadEditions().editions);
}

export function capabilitiesForEdition(editionId) {
  const ed = loadEditions().editions[editionId];
  if (!ed) throw new Error("LICENSE_EDITION_UNKNOWN:" + editionId);
  return ed.capabilities || [];
}

/**
 * @param {string} commandId e.g. loan.create
 * @param {string} editionId
 */
export function isCommandAllowed(commandId, editionId) {
  const caps = capabilitiesForEdition(editionId);
  if (caps.includes("*")) return true;
  for (const c of caps) {
    if (c.endsWith(".*")) {
      const prefix = c.slice(0, -1); // loan.
      if (commandId.startsWith(prefix) || commandId.startsWith(c.slice(0, -2))) return true;
      // loan.* → prefix "loan."
      if (commandId.startsWith(c.replace(".*", "."))) return true;
      if (commandId.startsWith(c.replace(".*", ""))) return true;
    }
    if (c === commandId) return true;
  }
  return false;
}

export function assertCommandAllowed(commandId, editionId) {
  if (!isCommandAllowed(commandId, editionId)) {
    const err = new Error("LICENSE_REQUIRED");
    err.code = "LICENSE_REQUIRED";
    err.commandId = commandId;
    err.editionId = editionId;
    throw err;
  }
  return true;
}

/** Downgrade: capability off, data retained */
export function downgradeEdition(previousRecords, fromEdition, toEdition) {
  return {
    fromEdition,
    toEdition,
    retainedCount: previousRecords?.length || 0,
    retainedIds: (previousRecords || []).map((r) => r.id),
    historyDeleted: false,
  };
}
