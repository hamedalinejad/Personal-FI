import { generateSchedule } from "../domain/scheduleFacade.js";

/**
 * Pure calculation command — no journal, no operationId required.
 */
export function generateScheduleCommand(params = {}) {
  for (const k of ["principal", "annualRate", "periods", "method", "startDate"]) {
    if (params[k] == null || params[k] === "") throw new Error(`VALIDATION_ERROR:${k}`);
  }
  return generateSchedule({
    principal: params.principal,
    annualRate: params.annualRate,
    periods: params.periods,
    method: params.method,
    startDate: params.startDate,
    dayCount: params.dayCount || "period_based",
    feePercent: params.feePercent,
    installmentFrequency: params.installmentFrequency || params.frequency,
  });
}
