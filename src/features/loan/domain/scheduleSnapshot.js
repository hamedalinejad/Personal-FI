/**
 * Canonical v1 schedule snapshot shape — aligned with LOAN-V1 + schema comments.
 */
export function buildScheduleSnapshot({
  schedule,
  rateInput,
  rateFractional,
  currency,
  engineVersion = "1.0.0-period_based-equal-principal",
}) {
  const installments = (schedule.rows || []).map((row, i) => ({
    seq: row.period ?? i + 1,
    dueDate: row.dueDate || null,
    principal: row.principal,
    interest: row.interest || "0.00",
    fee: row.fee || "0.00",
    total: row.payment || row.total,
    status: "planned",
  }));
  const lastRow = (schedule.rows || [])[installments.length - 1];
  return {
    engineVersion,
    dayCount: schedule.dayCount || "period_based",
    rate: rateFractional,
    rateInput,
    currency,
    residual: lastRow?.balance != null ? String(lastRow.balance) : "0.00",
    generatedAt: new Date().toISOString(),
    installments,
  };
}
