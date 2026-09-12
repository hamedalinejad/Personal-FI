/**
 * LOAN-002 — formal schedule snapshot envelope (validated before persist).
 */
export const SCHEDULE_SNAPSHOT_SCHEMA_VERSION = "1.0.0";

export function wrapScheduleSnapshot({
  rows,
  engineVersion,
  method,
  startDate,
  dayCount,
  calendarVersion = "none",
  roundingVersion = "money2-half-up",
  rateVersion = "pct-points-annual",
  extra = {},
}) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("SCHEDULE_ROWS_REQUIRED");
  if (!engineVersion) throw new Error("SCHEDULE_ENGINE_VERSION_REQUIRED");
  for (const row of rows) {
    if (row.period == null) throw new Error("SCHEDULE_ROW_PERIOD");
    if (row.payment == null || row.principal == null) throw new Error("SCHEDULE_ROW_AMOUNTS");
  }
  return {
    snapshotSchemaVersion: SCHEDULE_SNAPSHOT_SCHEMA_VERSION,
    engineVersion,
    calendarVersion,
    roundingVersion,
    rateVersion,
    method,
    startDate,
    dayCount,
    rows,
    installments: rows,
    ...extra,
  };
}

/** Used by createLoan — accepts schedule object from engine */
export function buildScheduleSnapshot({
  schedule,
  rateInput,
  rateFractional,
  currency,
  engineVersion,
}) {
  const rows = schedule.rows || schedule.installments;
  return wrapScheduleSnapshot({
    rows,
    engineVersion,
    method: schedule.method,
    startDate: schedule.startDate,
    dayCount: schedule.dayCount || "period_based",
    extra: {
      currency,
      rateInput: rateInput != null ? String(rateInput) : null,
      rateFractional: rateFractional != null ? String(rateFractional) : null,
    },
  });
}

export function parseScheduleSnapshot(json) {
  const parsed = typeof json === "string" ? JSON.parse(json) : json;
  if (!parsed || typeof parsed !== "object") throw new Error("SCHEDULE_SNAPSHOT_INVALID");
  const rows = parsed.rows || parsed.installments;
  if (!Array.isArray(rows)) throw new Error("SCHEDULE_SNAPSHOT_ROWS");
  return { ...parsed, rows };
}
