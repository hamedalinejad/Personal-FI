
/**
 * Deterministic T+n settlement from tradeDate + policy version.
 * Does not use "today". Historical ops must store settlement_policy_version.
 *
 * Iran equity (TSE): weekly market closure is typically Thursday–Friday.
 * Saturday–Wednesday are trading/business days for this policy package.
 *
 * Versions:
 * - iran-equity-T2-v2 (CURRENT): skip Thu+Fri
 * - iran-equity-T2-v1 (LEGACY): skip Fri+Sat — retained only to recompute historical
 *   operations that stored that version; do not use for new trades.
 */

export const SETTLEMENT_POLICY_VERSION = "iran-equity-T2-v2";

const POLICIES = {
  "iran-equity-T2-v2": {
    tPlusDefault: 2,
    /** JS getUTCDay(): 0 Sun … 6 Sat */
    weekendDays: [4, 5], // Thu, Fri
  },
  "iran-equity-T2-v1": {
    tPlusDefault: 2,
    weekendDays: [5, 6], // Fri, Sat — legacy only
  },
};

export function getSettlementPolicy(policyVersion = SETTLEMENT_POLICY_VERSION) {
  const p = POLICIES[policyVersion];
  if (!p) throw new Error(`SETTLEMENT_POLICY_UNKNOWN:${policyVersion}`);
  return p;
}

/** Add n business days using the named policy weekend set. */
export function addBusinessDays(isoDate, n, policyVersion = SETTLEMENT_POLICY_VERSION) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) throw new Error("INVALID_DATE");
  if (!Number.isInteger(n) || n < 0) throw new Error("INVALID_N");
  const { weekendDays } = getSettlementPolicy(policyVersion);
  const weekend = new Set(weekendDays);
  const d = new Date(isoDate + "T12:00:00Z");
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (weekend.has(wd)) continue;
    left -= 1;
  }
  return d.toISOString().slice(0, 10);
}

export function computeEquitySettlementDate(
  tradeDate,
  { tPlus, policyVersion = SETTLEMENT_POLICY_VERSION } = {},
) {
  const policy = getSettlementPolicy(policyVersion);
  const n = tPlus != null ? tPlus : policy.tPlusDefault;
  if (!Number.isInteger(n) || n < 0) throw new Error("INVALID_N");
  const settlementDate = addBusinessDays(tradeDate, n, policyVersion);
  return {
    tradeDate,
    settlementDate,
    tPlus: n,
    policyVersion,
  };
}

export function assertPolicyVersion(policyVersion) {
  getSettlementPolicy(policyVersion);
  return true;
}
