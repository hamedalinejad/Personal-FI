import { buildSchedule, periodRateFromAnnual } from "../../../core/domain/loan/scheduleEngine.js";

export function generateSchedule(params) {
  return buildSchedule(params.method, params);
}

export { periodRateFromAnnual };
