import { toDecimal } from "../../money/canonicalDecimal.js";
import { assertPositive } from "../../money/decimalMath.js";

export function applyCorporateAction(holding, { type, ratio }) {
  const q = toDecimal(holding.quantity || "0");
  const cost = toDecimal(holding.totalInvested || "0");
  const r = assertPositive(ratio);
  switch (type) {
    case "bonus":
    case "split": {
      const newQ = q.times(r);
      return {
        quantity: newQ.toFixed(),
        totalInvested: cost.toFixed(),
        averageCost: newQ.isZero() ? "0" : cost.div(newQ).toFixed(),
      };
    }
    case "reverse_split": {
      const newQ = q.div(r);
      return {
        quantity: newQ.toFixed(),
        totalInvested: cost.toFixed(),
        averageCost: newQ.isZero() ? "0" : cost.div(newQ).toFixed(),
      };
    }
    default:
      throw new Error(`CA_TYPE_UNKNOWN:${type}`);
  }
}
