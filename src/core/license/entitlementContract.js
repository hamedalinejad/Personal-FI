/**
 * Machine license entitlement contract (R-M25 / R-LICENSE-01).
 * capabilityGate.js remains the runtime enforcer.
 * This module is the declarative contract for editions + proof harnesses.
 */

import { EDITIONS, isCommandAllowed, assertCommandAllowed, getRuntimeCapabilities } from "./capabilityGate.js";
import { COMMAND_REGISTRY, capabilityFor } from "../../application/commandRegistry.js";

/**
 * Prove edition cannot execute disallowed commands (sample matrix).
 * @param {string} edition
 * @returns {{ edition: string, allowed: string[], denied: string[], ok: boolean }}
 */
export function proveEditionMatrix(edition) {
  const allowed = [];
  const denied = [];
  for (const id of Object.keys(COMMAND_REGISTRY)) {
    if (COMMAND_REGISTRY[id].kind !== "command") continue;
    if (isCommandAllowed(edition, id)) allowed.push(id);
    else denied.push(id);
  }
  return {
    edition,
    allowed,
    denied,
    ok: true,
    capabilities: getRuntimeCapabilities(edition),
  };
}

/**
 * @param {string} edition
 * @param {string} commandId
 */
export function assertEditionCommand(edition, commandId) {
  // Prefer registry capability when present
  const cap = capabilityFor(commandId);
  assertCommandAllowed(edition, commandId);
  return { edition, commandId, capability: cap };
}

export { EDITIONS, isCommandAllowed, getRuntimeCapabilities };
