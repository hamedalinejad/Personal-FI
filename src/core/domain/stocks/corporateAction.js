import { toNum, assertPositive } from "../../money/decimalMath.js";

export function applyCorporateAction(holding, { type, ratio }) {
  const q = toNum(holding.quantity || "0");
  const cost = toNum(holding.totalInvested || "0");
  const r = assertPositive(ratio);
  switch (type) {
    case "bonus":
    case "split":
      return {
        quantity: String(q * r),
        totalInvested: String(cost),
        averageCost: q * r === 0 ? "0" : String(cost / (q * r)),
      };
    case "reverse_split":
      return {
        quantity: String(q / r),
        totalInvested: String(cost),
        averageCost: q / r === 0 ? "0" : String(cost / (q / r)),
      };
    default:
      throw new Error(`CA_TYPE_UNKNOWN:${type}`);
  }
}
