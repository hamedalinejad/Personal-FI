import { buildSchedule } from "../../../core/domain/loan/scheduleEngine.js";

export function previewSchedule(params) {
  if (!params.startDate) throw new Error("LOAN_START_DATE_REQUIRED");
  return buildSchedule(params.method || "declining_balance", {
    principal: params.principal,
    annualRate: params.annualRate || "0",
    periods: params.periods,
    startDate: params.startDate,
    feePercent: params.feePercent,
    dayCount: params.dayCount || "period_based",
  });
}
