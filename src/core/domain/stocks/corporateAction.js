/**
 * Corporate actions v1 — Decimal-only arithmetic (no JS Number math).
 * Types: bonus | split | reverse_split
 */

import { toDecimal, canonicalDecimalString } from "../../money/canonicalDecimal.js";

/**
 * @param {{ quantity: string, totalInvested?: string }} holding
 * @param {{ type: string, ratio: string }} action
 */
export function applyCorporateAction(holding, { type, ratio }) {
  const q = toDecimal(holding.quantity || "0");
  const cost = toDecimal(holding.totalInvested || "0");
  const r = toDecimal(String(ratio));
  if (r.lte(0)) throw Object.assign(new Error("CA_RATIO_POSITIVE"), { code: "CA_RATIO_POSITIVE" });

  switch (type) {
    case "bonus":
    case "split": {
      const newQty = q.times(r);
      const avg = newQty.isZero() ? toDecimal("0") : cost.div(newQty);
      return {
        quantity: canonicalDecimalString(newQty.toFixed()),
        totalInvested: canonicalDecimalString(cost.toFixed()),
        averageCost: canonicalDecimalString(avg.toFixed()),
      };
    }
    case "reverse_split": {
      const newQty = q.div(r);
      const avg = newQty.isZero() ? toDecimal("0") : cost.div(newQty);
      return {
        quantity: canonicalDecimalString(newQty.toFixed()),
        totalInvested: canonicalDecimalString(cost.toFixed()),
        averageCost: canonicalDecimalString(avg.toFixed()),
      };
    }
    default:
      throw Object.assign(new Error(`CA_TYPE_UNKNOWN:${type}`), { code: "CA_TYPE_UNKNOWN" });
  }
}
