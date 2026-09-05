import { toDecimal } from "../../money/canonicalDecimal.js";
import { assertPositive, assertNonNegative } from "../../money/decimalMath.js";

function money2(d) {
  return toDecimal(d).toDecimalPlaces(2).toFixed(2);
}

export function scheduleDeclining({ principal, annualRate, periods, startDate = "2026-01-01" }) {
  const P = assertPositive(principal);
  const r = assertNonNegative(annualRate).div(12);
  const n = Number(toDecimal(periods).toFixed(0)); // count only
  if (n <= 0) throw new Error("LOAN_PERIODS");
  const principalPart = P.div(n);
  let bal = P;
  const rows = [];
  for (let i = 1; i <= n; i++) {
    const interest = bal.times(r);
    let pPart = principalPart;
    if (i === n) pPart = bal; // residual to last
    const payment = pPart.plus(interest);
    bal = bal.minus(pPart);
    rows.push({
      period: i,
      payment: money2(payment),
      principal: money2(pPart),
      interest: money2(interest),
      balance: money2(bal.gt(0) ? bal : 0),
    });
  }
  return { method: "declining_balance", startDate, rows };
}

export function scheduleFlat({ principal, annualRate, periods, startDate = "2026-01-01" }) {
  const P = assertPositive(principal);
  const n = Number(toDecimal(periods).toFixed(0));
  const years = toDecimal(n).div(12);
  const totalInterest = P.times(assertNonNegative(annualRate)).times(years);
  const totalPay = P.plus(totalInterest);
  const installment = totalPay.div(n);
  const principalPart = P.div(n);
  const interestPart = totalInterest.div(n);
  let bal = P;
  const rows = [];
  for (let i = 1; i <= n; i++) {
    let pPart = principalPart;
    if (i === n) pPart = bal;
    bal = bal.minus(pPart);
    rows.push({
      period: i,
      payment: money2(pPart.plus(interestPart)),
      principal: money2(pPart),
      interest: money2(interestPart),
      balance: money2(bal.gt(0) ? bal : 0),
    });
  }
  return { method: "flat_rate", startDate, rows };
}

export function scheduleQarz({ principal, periods, feePercent = "0", startDate = "2026-01-01" }) {
  const P = assertPositive(principal);
  const n = Number(toDecimal(periods).toFixed(0));
  const fee = P.times(assertNonNegative(feePercent));
  const principalPart = P.div(n);
  const feePart = fee.div(n);
  let bal = P;
  const rows = [];
  for (let i = 1; i <= n; i++) {
    let pPart = principalPart;
    if (i === n) pPart = bal;
    bal = bal.minus(pPart);
    rows.push({
      period: i,
      payment: money2(pPart.plus(feePart)),
      principal: money2(pPart),
      interest: "0.00",
      fee: money2(feePart),
      balance: money2(bal.gt(0) ? bal : 0),
    });
  }
  return { method: "qarz_al_hasaneh", startDate, rows };
}

export function scheduleBullet({ principal, annualRate, periods, startDate = "2026-01-01" }) {
  const P = assertPositive(principal);
  const r = assertNonNegative(annualRate).div(12);
  const n = Number(toDecimal(periods).toFixed(0));
  const rows = [];
  for (let i = 1; i <= n; i++) {
    const interest = P.times(r);
    const principalPart = i === n ? P : toDecimal(0);
    rows.push({
      period: i,
      payment: money2(interest.plus(principalPart)),
      principal: money2(principalPart),
      interest: money2(interest),
      balance: money2(i === n ? 0 : P),
    });
  }
  return { method: "bullet", startDate, rows };
}

export function buildSchedule(template, params) {
  switch (template) {
    case "declining_balance":
      return scheduleDeclining(params);
    case "flat_rate":
      return scheduleFlat(params);
    case "qarz_al_hasaneh":
      return scheduleQarz(params);
    case "bullet":
      return scheduleBullet(params);
    default:
      throw new Error(`LOAN_TEMPLATE_UNKNOWN:${template}`);
  }
}
