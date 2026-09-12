/**
 * Loan schedule v1: declining_balance = EQUAL PRINCIPAL (not annuity/fixed-PMT).
 * engineVersion: 1.0.0-period_based-equal-principal
 * Annuity requires a new versioned engine — never silent change.
 */
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
/** Only for dayCount=period_based — frequency mapping lives in engine, not features. */

/**
 * API annual rate = percentage points (18 = 18%).
 * Internal arithmetic uses fractional rate (0.18).
 */
export function normalizeRatePercentage(annualRatePercentagePoints) {
  const p = assertNonNegative(annualRatePercentagePoints);
  return p.div(100);
}

export function periodRateFromAnnual(annualRatePercentagePoints, frequency = "monthly") {
  const a = normalizeRatePercentage(annualRatePercentagePoints);
  switch (frequency) {
    case "monthly":
      return a.div(12);
    case "weekly":
      return a.div(52);
    case "quarterly":
      return a.div(4);
    case "annual":
      return a;
    default:
      throw new Error(`LOAN_FREQUENCY_UNSUPPORTED:${frequency}`);
  }
}

export function assertDayCountSupported(dayCount) {
  if (dayCount == null || dayCount === "period_based" || dayCount === "monthly") return;
  throw new Error(`LOAN_DAY_COUNT_UNSUPPORTED:${dayCount}`);
}

/** P0-LOAN-006 — canonical v1 enum */
export function normalizeDayCount(dayCount) {
  assertDayCountSupported(dayCount);
  if (dayCount == null || dayCount === "monthly" || dayCount === "period_based") {
    return "period_based";
  }
  return dayCount;
}

/** P0-LOAN-007 — v1 rejects variable-rate events */
export function assertFixedRateV1(params = {}) {
  if (params.rateHistory || params.rateChanges || params.variableRate) {
    throw new Error("LOAN_VARIABLE_RATE_UNSUPPORTED_V1");
  }
  if (params.commandType === "rate_change" || params.commandType === "reschedule") {
    throw new Error("LOAN_COMMAND_UNSUPPORTED_V1");
  }
}

export function scheduleDeclining({ principal, annualRate, periods, startDate, dayCount, frequency = "monthly" }) {
  if (!startDate || typeof startDate !== "string") throw new Error("LOAN_START_DATE_REQUIRED");
  assertFixedRateV1(arguments[0] || {});
  const dayCountNorm = normalizeDayCount(dayCount);
  const P = assertPositive(principal);
  const r = periodRateFromAnnual(annualRate, frequency);
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
  return { method: "declining_balance", startDate, dayCount: dayCountNorm, rows };
}

export function scheduleFlat({ principal, annualRate, periods, startDate, dayCount, frequency = "monthly" })
{
  if (!startDate || typeof startDate !== "string") throw new Error("LOAN_START_DATE_REQUIRED");
  assertFixedRateV1(arguments[0] || {});
  const dayCountNorm = normalizeDayCount(dayCount);
  const P = assertPositive(principal);
  const n = parsePeriodCount(periods);
  // P0-LOAN-003: annual flat = P * annualFraction * termYears
  // termYears from period count / periods-per-year (monthly → /12)
  const rateFrac = normalizeRatePercentage(annualRate);
  const periodsPerYear = frequency === "monthly" ? 12 : frequency === "quarterly" ? 4 : frequency === "weekly" ? 52 : 1;
  const termYears = toDecimal(String(n)).div(String(periodsPerYear));
  const totalInterest = P.times(rateFrac).times(termYears);
  const pPartExact = P.div(n);
  const iPartExact = totalInterest.div(n);
  let bal = P;
  let principalAllocated = toDecimal("0");
  let interestAllocated = toDecimal("0");
  const rows = [];
  for (let i = 1; i <= n; i++) {
    let pPart = pPartExact;
    let iPart = iPartExact;
    if (i === n) {
      // residual: force principal+interest totals to exact P and totalInterest
      pPart = bal;
      iPart = totalInterest.minus(interestAllocated);
      if (iPart.lt(0)) iPart = toDecimal("0");
    }
    const payment = pPart.plus(iPart);
    bal = bal.minus(pPart);
    principalAllocated = principalAllocated.plus(pPart);
    interestAllocated = interestAllocated.plus(iPart);
    rows.push({
      period: i,
      payment: money2str(payment),
      principal: money2str(pPart),
      interest: money2str(iPart),
      balance: money2str(bal.gt(0) ? bal : toDecimal("0")),
    });
  }
  return { method: "flat_rate", startDate, dayCount: dayCountNorm, flatConvention: "annual_times_term_years", rows };
}

export function scheduleQarz({ principal, periods, feePercent = "0", feePercentPoints, startDate, dayCount }) {
  if (!startDate || typeof startDate !== "string") throw new Error("LOAN_START_DATE_REQUIRED");
  const dayCountNorm = normalizeDayCount(dayCount);
  // P0-LOAN-002: feePercentPoints alias preferred; feePercent still percentage-points
  if (feePercentPoints != null) feePercent = feePercentPoints;
  const P = assertPositive(principal);
  const n = parsePeriodCount(periods);
  // feePercent is percentage-points (2 = 2% of principal), not a raw fraction.
  const feeTotal = P.times(normalizeRatePercentage(feePercent));
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
  return { method: "qarz_al_hasaneh", startDate, dayCount: dayCountNorm, rows };
}

export function scheduleBullet({ principal, annualRate, periods, startDate, dayCount, frequency = "monthly" })
{
  if (!startDate || typeof startDate !== "string") throw new Error("LOAN_START_DATE_REQUIRED");
  assertFixedRateV1(arguments[0] || {});
  const dayCountNorm = normalizeDayCount(dayCount);
  const P = assertPositive(principal);
  const n = parsePeriodCount(periods);
  const r = periodRateFromAnnual(annualRate, frequency);
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
  return { method: "bullet", startDate, dayCount: dayCountNorm, rows };
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
