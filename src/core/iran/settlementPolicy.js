import { toDecimal } from "../money/canonicalDecimal.js";

/**
 * Deterministic T+n settlement date from tradeDate + policy version.
 * Does not use "today". Historical ops must store settlement_policy_version.
 */
export const SETTLEMENT_POLICY_VERSION = "iran-equity-T2-v1";

/** Simple calendar: skip Fri+Sat (Iran weekend) — deterministic. */
export function addBusinessDays(isoDate, n) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) throw new Error("INVALID_DATE");
  if (!Number.isInteger(n) || n < 0) throw new Error("INVALID_N");
  const d = new Date(isoDate + "T12:00:00Z");
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay(); // 0 Sun ... 5 Fri 6 Sat
    if (wd === 5 || wd === 6) continue; // Fri Sat
    left -= 1;
  }
  return d.toISOString().slice(0, 10);
}

export function computeEquitySettlementDate(tradeDate, { tPlus = 2, policyVersion = SETTLEMENT_POLICY_VERSION } = {}) {
  if (policyVersion !== SETTLEMENT_POLICY_VERSION) {
    // future: load historical policy table
    throw new Error(`SETTLEMENT_POLICY_UNKNOWN:${policyVersion}`);
  }
  const settlementDate = addBusinessDays(tradeDate, tPlus);
  return {
    tradeDate,
    settlementDate,
    tPlus,
    policyVersion,
  };
}
