import { toDecimal } from "../../money/canonicalDecimal.js";
import { assertPositive } from "../../money/decimalMath.js";

/**
 * Direct or 1-hop via pivot (e.g. EUR→USD→IRR)
 * rates map: "EUR/USD" -> rate string
 */
export function convertAmount({ amount, from, to, rates, pivot = "USD" }) {
  assertPositive(amount);
  if (from === to) return { amount: toDecimal(amount).toFixed(), path: [from] };
  const direct = rates[`${from}/${to}`];
  if (direct != null) {
    const out = toDecimal(amount).times(toDecimal(String(direct)));
    return {
      amount: out.toFixed(),
      path: [from, to],
      rate: toDecimal(String(direct)).toFixed(),
    };
  }
  const a = rates[`${from}/${pivot}`];
  const b = rates[`${pivot}/${to}`];
  if (a != null && b != null) {
    const out = toDecimal(amount)
      .times(toDecimal(String(a)))
      .times(toDecimal(String(b)));
    return {
      amount: out.toFixed(),
      path: [from, pivot, to],
      conversionPath: [
        { from, to: pivot, rate: toDecimal(String(a)).toFixed() },
        { from: pivot, to, rate: toDecimal(String(b)).toFixed() },
      ],
    };
  }
  throw new Error("FX_PATH_MISSING");
}
