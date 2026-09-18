/**
 * Deterministic T+n settlement from tradeDate + policy version.
 * Canonical ID: iran-equity-settlement-v2
 * Data source package: data/policy/iran/iran-equity-calendar-v1.json (weekend + holidays seed)
 *
 * Aliases (migration only):
 * - iran-equity-T2-v2 → iran-equity-settlement-v2
 * - iran-equity-T2-v1 → legacy Fri+Sat weekend (historical replay only)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const SETTLEMENT_POLICY_VERSION = "iran-equity-settlement-v2";
export const CALENDAR_PACKAGE_ID = "iran-equity-calendar-v1";

const ALIASES = {
  "iran-equity-T2-v2": "iran-equity-settlement-v2",
  "iran-equity-settlement-v2": "iran-equity-settlement-v2",
  "iran-equity-T2-v1": "iran-equity-T2-v1",
};

const BUILTIN = {
  "iran-equity-settlement-v2": {
    tPlusDefault: 2,
    weekendDays: [4, 5], // Thu, Fri — matches calendar package
    calendarPackageId: CALENDAR_PACKAGE_ID,
  },
  "iran-equity-T2-v1": {
    tPlusDefault: 2,
    weekendDays: [5, 6], // Fri, Sat — LEGACY only
    calendarPackageId: null,
  },
};

function loadCalendarPackage() {
  try {
    const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../..");
    const file = path.join(root, "data/policy/iran/iran-equity-calendar-v1.json");
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function weekendNameToJsDay(name) {
  const map = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  return map[name];
}

export function getSettlementPolicy(policyVersion = SETTLEMENT_POLICY_VERSION) {
  const canonical = ALIASES[policyVersion] || policyVersion;
  let p = BUILTIN[canonical];
  if (!p) throw new Error(`SETTLEMENT_POLICY_UNKNOWN:${policyVersion}`);
  // Prefer weekend from calendar package when present (v2)
  if (canonical === "iran-equity-settlement-v2") {
    const cal = loadCalendarPackage();
    if (cal?.weekend?.length) {
      const days = cal.weekend.map(weekendNameToJsDay).filter((d) => d != null);
      if (days.length) p = { ...p, weekendDays: days, policyVersion: canonical, calendarPackageId: cal.policyVersion };
    }
  }
  return { ...p, policyVersion: canonical };
}

export function addBusinessDays(isoDate, n, policyVersion = SETTLEMENT_POLICY_VERSION) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) throw new Error("INVALID_DATE");
  if (!Number.isInteger(n) || n < 0) throw new Error("INVALID_N");
  const { weekendDays } = getSettlementPolicy(policyVersion);
  const weekend = new Set(weekendDays);
  const d = new Date(isoDate + "T12:00:00Z");
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (weekend.has(d.getUTCDay())) continue;
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
  const settlementDate = addBusinessDays(tradeDate, n, policy.policyVersion);
  return {
    tradeDate,
    settlementDate,
    tPlus: n,
    policyVersion: policy.policyVersion,
    calendarPackageId: policy.calendarPackageId || null,
  };
}

export function assertPolicyVersion(policyVersion) {
  getSettlementPolicy(policyVersion);
  return true;
}
