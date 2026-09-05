/**
 * detect → explain → (optional) approved repair plan — never silent repair
 */
export function detectDrift({ expected, actual, label = "metric" }) {
  const drifts = [];
  for (const key of Object.keys(expected || {})) {
    if (String(expected[key]) !== String(actual?.[key])) {
      drifts.push({
        label,
        field: key,
        expected: expected[key],
        actual: actual?.[key],
      });
    }
  }
  return { hasDrift: drifts.length > 0, drifts };
}

export function explainDrift(report) {
  return (report.drifts || [])
    .map((d) => `${d.field}: expected ${d.expected} actual ${d.actual}`)
    .join("; ");
}

export function buildRepairPlan(report, { approvedBy }) {
  if (!approvedBy) throw new Error("REPAIR_REQUIRES_APPROVAL");
  if (!report.hasDrift) return { actions: [] };
  return {
    actions: report.drifts.map((d) => ({
      type: "rebuild_projection_field",
      field: d.field,
      setTo: d.expected,
    })),
    approvedBy,
    note: "Does not rewrite ledger; projection only",
  };
}
