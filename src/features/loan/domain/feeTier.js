/**
 * LOAN-003 — tiered fee calculation semantics (not overloaded rate_or_amount alone).
 */
export function normalizeFeeTierSpec(input) {
  const calculationMethod = input.calculationMethod || (input.is_percentage ? "percentage" : "fixed");
  if (!["percentage", "fixed", "tiered_percentage", "tiered_fixed"].includes(calculationMethod)) {
    throw new Error(`FEE_TIER_METHOD:${calculationMethod}`);
  }
  const base = input.base || input.calculation_base || "principal";
  if (!["principal", "outstanding", "installment", "payment"].includes(base)) {
    throw new Error(`FEE_TIER_BASE:${base}`);
  }
  return {
    calculationMethod,
    base,
    rate: calculationMethod.includes("percentage") ? String(input.rate ?? input.rate_or_amount ?? "") : null,
    fixedAmount: calculationMethod.includes("fixed") ? String(input.fixedAmount ?? input.rate_or_amount ?? "") : null,
    min: input.min != null ? String(input.min) : input.min_amount != null ? String(input.min_amount) : null,
    max: input.max != null ? String(input.max) : input.max_amount != null ? String(input.max_amount) : null,
    period: input.period || input.day_count || null,
    applicationMoment: input.applicationMoment || input.fee_timing || "on_event",
    priority: input.priority != null ? Number(input.priority) : Number(input.tier_order || 0),
  };
}
