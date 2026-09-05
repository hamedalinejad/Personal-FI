import { toNum, assertPositive, assertNonNegative } from "../../money/decimalMath.js";

function round2(n) {
  return String(Math.round(n * 100) / 100);
}

/** Equal principal declining (simple) */
export function scheduleDeclining({ principal, annualRate, periods, startDate = "2026-01-01" }) {
  const P = assertPositive(principal);
  const r = assertNonNegative(annualRate) / 12;
  const n = Math.floor(toNum(periods));
  if (n <= 0) throw new Error("LOAN_PERIODS");
  const principalPart = P / n;
  let bal = P;
  const rows = [];
  for (let i = 1; i <= n; i++) {
    const interest = bal * r;
    const payment = principalPart + interest;
    bal -= principalPart;
    rows.push({
      period: i,
      payment: round2(payment),
      principal: round2(principalPart),
      interest: round2(interest),
      balance: round2(Math.max(bal, 0)),
    });
  }
  return { method: "declining_balance", startDate, rows };
}

/** Flat rate: total interest = P * annualRate * years approx periods/12 */
export function scheduleFlat({ principal, annualRate, periods, startDate = "2026-01-01" }) {
  const P = assertPositive(principal);
  const n = Math.floor(toNum(periods));
  const years = n / 12;
  const totalInterest = P * assertNonNegative(annualRate) * years;
  const totalPay = P + totalInterest;
  const installment = totalPay / n;
  const principalPart = P / n;
  const interestPart = totalInterest / n;
  let bal = P;
  const rows = [];
  for (let i = 1; i <= n; i++) {
    bal -= principalPart;
    rows.push({
      period: i,
      payment: round2(installment),
      principal: round2(principalPart),
      interest: round2(interestPart),
      balance: round2(Math.max(bal, 0)),
    });
  }
  return { method: "flat_rate", startDate, rows };
}

/** Qarz-al-hasaneh: principal only, optional fixed fee percent once */
export function scheduleQarz({ principal, periods, feePercent = "0", startDate = "2026-01-01" }) {
  const P = assertPositive(principal);
  const n = Math.floor(toNum(periods));
  const fee = P * assertNonNegative(feePercent);
  const principalPart = P / n;
  const feePart = fee / n;
  let bal = P;
  const rows = [];
  for (let i = 1; i <= n; i++) {
    bal -= principalPart;
    rows.push({
      period: i,
      payment: round2(principalPart + feePart),
      principal: round2(principalPart),
      interest: "0",
      fee: round2(feePart),
      balance: round2(Math.max(bal, 0)),
    });
  }
  return { method: "qarz_al_hasaneh", startDate, rows };
}

/** Bullet: interest-only optional then principal at end */
export function scheduleBullet({ principal, annualRate, periods, startDate = "2026-01-01" }) {
  const P = assertPositive(principal);
  const r = assertNonNegative(annualRate) / 12;
  const n = Math.floor(toNum(periods));
  const rows = [];
  for (let i = 1; i <= n; i++) {
    const interest = P * r;
    const principalPart = i === n ? P : 0;
    rows.push({
      period: i,
      payment: round2(interest + principalPart),
      principal: round2(principalPart),
      interest: round2(interest),
      balance: round2(i === n ? 0 : P),
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
