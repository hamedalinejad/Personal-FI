/**
 * Edition capability gate.
 * Wave-3: Standalone edition cannot execute another edition’s commands.
 * License is enforced at the host execute boundary.
 */

/** @type {Record<string, { label: string, capabilities: string[] }>} */
export const EDITIONS = Object.freeze({
  standalone: {
    label: "Standalone",
    capabilities: [
      "accounts.*",
      "income.*",
      "expense.*",
      "transfer.*",
      "cheque.*",
      "tax.*",
      "assets.*",
      "loan.*",
      "crypto.*",
      "stocks.*",
      "funds.*",
      "metals.*",
      "reports.*",
      "planning.*",
      "import.*",
      "backup.*",
      "meta.*",
    ],
  },
  free: {
    label: "Free",
    capabilities: [
      "accounts.*",
      "income.create",
      "expense.create",
      "transfer.create",
      "reports.trialBalance",
      "reports.balanceSheet",
      "meta.*",
      "backup.export",
    ],
  },
  pro: {
    label: "Pro",
    capabilities: ["*"],
  },
});

/**
 * @param {string} edition
 * @param {string} commandId  e.g. "accounts.deposit"
 * @returns {boolean}
 */
export function isCommandAllowed(edition, commandId) {
  const ed = EDITIONS[edition] || EDITIONS.standalone;
  const caps = ed.capabilities;
  if (caps.includes("*")) return true;
  if (caps.includes(commandId)) return true;
  // prefix match: accounts.* matches accounts.deposit
  for (const c of caps) {
    if (c.endsWith(".*")) {
      const prefix = c.slice(0, -1); // "accounts."
      if (commandId.startsWith(prefix)) return true;
    }
  }
  return false;
}

/**
 * @param {string} edition
 * @param {string} commandId
 * @throws {Error} LICENSE_REQUIRED
 */
export function assertCommandAllowed(edition, commandId) {
  if (!isCommandAllowed(edition, commandId)) {
    const err = new Error(`LICENSE_REQUIRED:${commandId}`);
    err.code = "LICENSE_REQUIRED";
    err.commandId = commandId;
    err.edition = edition;
    throw err;
  }
}

/**
 * Runtime capabilities object for LicenseScreen.
 * @param {string} edition
 */
export function getRuntimeCapabilities(edition) {
  const ed = EDITIONS[edition] || EDITIONS.standalone;
  return {
    edition,
    label: ed.label,
    capabilities: [...ed.capabilities],
    allowed: (commandId) => isCommandAllowed(edition, commandId),
  };
}
