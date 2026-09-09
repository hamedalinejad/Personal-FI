import { generateSchedule } from "../domain/scheduleFacade.js";

export function generateScheduleCommand(params) {
  return generateSchedule(params);
}
