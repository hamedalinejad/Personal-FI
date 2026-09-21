/**
 * Machine license entitlement contract.
 * Core only knows assertCapability / edition matrix against a capability map
 * provided by Application (never imports application/*).
 */

import { EDITIONS, isCommandAllowed, assertCommandAllowed, getRuntimeCapabilities } from "./capabilityGate.js";

/**
 * @param {string} edition
 * @param {Iterable<string>} commandIds — supplied by Application layer
 */
export function proveEditionMatrix(edition, commandIds = []) {
  const allowed = [];
  const denied = [];
  for (const id of commandIds) {
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
 * @param {string} [capability] — optional label from Application registry
 */
export function assertEditionCommand(edition, commandId, capability = null) {
  assertCommandAllowed(edition, commandId);
  return { edition, commandId, capability };
}

/**
 * Generic Core gate — Application maps commandId → capability externally.
 * @param {{ has: (cap: string) => boolean }} capabilities
 * @param {string} capability
 */
export function assertCapability(capabilities, capability) {
  if (!capability) return true;
  if (!capabilities || typeof capabilities.has !== "function") {
    throw Object.assign(new Error("CAPABILITY_MAP_REQUIRED"), { code: "CAPABILITY_MAP_REQUIRED" });
  }
  if (!capabilities.has(capability)) {
    throw Object.assign(new Error(`CAPABILITY_DENIED:${capability}`), {
      code: "CAPABILITY_DENIED",
    });
  }
  return true;
}

export { EDITIONS, isCommandAllowed, assertCommandAllowed, getRuntimeCapabilities };
