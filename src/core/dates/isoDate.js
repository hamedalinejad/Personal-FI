/**
 * Gregorian ISO date only — no locale parsing in Core.
 * Never collapse distinct economic date roles into one field.
 */

const RE = /^\d{4}-\d{2}-\d{2}$/;

/** Distinct date roles — UI and commands must not merge these */
export const DATE_ROLE_FIELDS = Object.freeze([
  "tradeDate",
  "settlementDate",
  "cashDate",
  "businessDate",
  "marketDate",
  "priceAsOf",
  "fxAsOf",
]);

export function assertIsoDate(value, field = "date") {
  if (typeof value !== "string" || !RE.test(value)) {
    throw new Error(`DATE_NOT_ISO:${field}`);
  }
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    throw new Error(`DATE_INVALID:${field}`);
  }
  return value;
}

export function assertDateFields(obj, fields) {
  for (const f of fields) {
    if (obj[f] != null && obj[f] !== "") assertIsoDate(obj[f], f);
  }
  return true;
}

/**
 * Assert payload keeps date roles as separate keys when present.
 * Does not require all roles — only forbids a single "date" stand-in for trade+settlement.
 */
export function assertDateRolesNotCollapsed(payload, requiredRoles = []) {
  if (!payload || typeof payload !== "object") throw new Error("DATE_PAYLOAD_REQUIRED");
  for (const role of requiredRoles) {
    if (payload[role] == null || payload[role] === "") {
      throw new Error(`DATE_ROLE_REQUIRED:${role}`);
    }
    assertIsoDate(payload[role], role);
  }
  // If both trade and settlement present, they may differ; collapsing means only one generic field used
  if (payload.date != null && payload.tradeDate == null && payload.settlementDate == null) {
    throw new Error("DATE_ROLE_COLLAPSED:use tradeDate/settlementDate/businessDate not generic date");
  }
  return true;
}
