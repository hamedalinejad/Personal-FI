/**
 * Cheque deterministic state machine.
 * Transitions must be explicit; financially meaningful ones go through Core journal.
 */

export const CHEQUE_STATES = Object.freeze([
  "issued",
  "deposited",
  "cleared",
  "bounced",
  "cancelled",
]);

/** allowed transitions: from -> [to] */
export const CHEQUE_TRANSITIONS = Object.freeze({
  issued: ["deposited", "cancelled"],
  deposited: ["cleared", "bounced", "cancelled"],
  cleared: [], // terminal for success path
  bounced: ["deposited"], // can re-deposit
  cancelled: [], // terminal
});

/**
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
export function canTransition(from, to) {
  const allowed = CHEQUE_TRANSITIONS[from];
  return Array.isArray(allowed) && allowed.includes(to);
}

/**
 * @param {string} from
 * @param {string} to
 */
export function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    const err = new Error(`CHEQUE_INVALID_TRANSITION:${from}->${to}`);
    err.code = "CHEQUE_INVALID_TRANSITION";
    throw err;
  }
}

/** Transitions that require journal / financial operation */
export const FINANCIAL_TRANSITIONS = Object.freeze(new Set(["cleared", "bounced"]));

export function isFinancialTransition(to) {
  return FINANCIAL_TRANSITIONS.has(to);
}
