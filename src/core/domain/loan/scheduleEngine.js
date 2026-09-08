import { toDecimal } from "../../money/canonicalDecimal.js";
import { assertPositive, assertNonNegative } from "../../money/decimalMath.js";

function money2(d) {
  // accept Decimal instance or decimal string
  const x = d && typeof d === "object" && typeof d.toFixed === "function" ? d : toDecimal(d);
  return x.toDecimalPlaces(2).toFixed(2);
}

/** P0-CODE-010 — strict positive integer period count (string decimal, integer only). */
export function parsePeriodCount(periods) {
  const d = toDecimal(periods);
  if (!d.isInteger()) throw new Error("LOAN_PERIODS_NOT_INTEGER");
  if (d.lte(0)) throw new Error("LOAN_PERIODS");
  return d.toNumber(); // safe: integer period count only, not money
}

function money2str(d) {
  return money2(d);
}

/**
 * P0-CODE-011 — Day-count / rate-period full model is PARTIAL.
 * Current v1 uses period_based monthly (/12). Other day-count modes are
 * explicitly rejected until DayCountEngine lands (not silent approximation).
 */
export function assertDayCountSupported(dayCount) {
  if (dayCount == null || dayCount === "period_based" || dayCount === "monthly") return;
  throw new Error(`LOAN_DAY_COUNT_UNSUPPORTED:${dayCount}`);
}

export function scheduleDeclining({ principal, annualRate, periods, startDate = "2026-01-01", dayCount }) {
  assertDayCountSupported(dayCount);
  const P = assertPositive(principal);
  const r = assertNonNegative(annualRate).div(12);
  const n = parsePeriodCount(periods);
  const principalPart = P.div(n);
  let bal = P;
  const rows = [];
  for (let i = 1; i <= n; i++) {
    const interest = bal.times(r);
    let pPart = principalPart;
    if (i === n) pPart = bal;
    const payment = pPart.plus(interest);
    bal = bal.minus(pPart);
    rows.push({
      period: i,
      payment: money2str(payment),
      principal: money2str(pPart),
      interest: money2str(interest),
      balance: money2str(bal.gt(0) ? bal : toDecimal("0")),
    });
  }
  return { method: "declining_balance", startDate, dayCount: "period_based", rows };
}

export function scheduleFlat({ principal, annualRate, periods, startDate = "2026-01-01", dayCount }) {
  assertDayCountSupported(dayCount);
  const P = assertPositive(principal);
  const n = parsePeriodCount(periods);
  const totalInterest = P.times(assertNonNegative(annualRate));
  const payment = P.plus(totalInterest).div(n);
  const pPart = P.div(n);
  const iPart = totalInterest.div(n);
  let bal = P;
  const rows = [];
  for (let i = 1; i <= n; i++) {
    if (i === n) {
      rows.push({
        period: i,
        payment: money2str(bal.plus(iPart)),
        principal: money2str(bal),
        interest: money2str(iPart),
        balance: "0.00",
      });
    } else {
      bal = bal.minus(pPart);
      rows.push({
        period: i,
        payment: money2str(payment),
        principal: money2str(pPart),
        interest: money2str(iPart),
        balance: money2str(bal),
      });
    }
  }
  return { method: "flat_rate", startDate, dayCount: "period_based", rows };
}

export function scheduleQarz({ principal, periods, feePercent = "0", startDate = "2026-01-01", dayCount }) {
  assertDayCountSupported(dayCount);
  const P = assertPositive(principal);
  const n = parsePeriodCount(periods);
  const feeTotal = P.times(assertNonNegative(feePercent));
  const pPart = P.div(n);
  const feePart = feeTotal.div(n);
  let bal = P;
  const rows = [];
  for (let i = 1; i <= n; i++) {
    let p = pPart;
    if (i === n) p = bal;
    bal = bal.minus(p);
    rows.push({
      period: i,
      payment: money2str(p.plus(feePart)),
      principal: money2str(p),
      interest: "0.00",
      fee: money2str(feePart),
      balance: money2str(bal.gt(0) ? bal : toDecimal("0")),
    });
  }
  return { method: "qarz_al_hasaneh", startDate, dayCount: "period_based", rows };
}

export function scheduleBullet({ principal, annualRate, periods, startDate = "2026-01-01", dayCount }) {
  assertDayCountSupported(dayCount);
  const P = assertPositive(principal);
  const n = parsePeriodCount(periods);
  const r = assertNonNegative(annualRate).div(12);
  const rows = [];
  let bal = P;
  for (let i = 1; i <= n; i++) {
    const interest = bal.times(r);
    if (i === n) {
      rows.push({
        period: i,
        payment: money2str(bal.plus(interest)),
        principal: money2str(bal),
        interest: money2str(interest),
        balance: "0.00",
      });
    } else {
      rows.push({
        period: i,
        payment: money2str(interest),
        principal: "0.00",
        interest: money2str(interest),
        balance: money2str(bal),
      });
    }
  }
  return { method: "bullet", startDate, dayCount: "period_based", rows };
}

export function buildSchedule(method, params) {
  switch (method) {
    case "declining_balance":
      return scheduleDeclining(params);
    case "flat_rate":
      return scheduleFlat(params);
    case "qarz_al_hasaneh":
      return scheduleQarz(params);
    case "bullet":
      return scheduleBullet(params);
    default:
      throw new Error(`LOAN_METHOD_UNKNOWN:${method}`);
  }
}
