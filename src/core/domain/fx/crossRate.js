import { toNum, assertPositive } from "../../money/decimalMath.js";

/**
 * Direct or 1-hop via pivot (e.g. EUR→USD→IRR)
 * rates map: "EUR/USD" -> rate meaning quote per base as stored
 */
export function convertAmount({ amount, from, to, rates, pivot = "USD" }) {
  assertPositive(amount);
  if (from === to) return { amount: String(amount), path: [from] };
  const direct = rates[`${from}/${to}`];
  if (direct != null) {
    return {
      amount: String(toNum(amount) * toNum(direct)),
      path: [from, to],
      rate: String(direct),
    };
  }
  const a = rates[`${from}/${pivot}`];
  const b = rates[`${pivot}/${to}`];
  if (a != null && b != null) {
    const out = toNum(amount) * toNum(a) * toNum(b);
    return {
      amount: String(out),
      path: [from, pivot, to],
      conversionPath: [
        { from, to: pivot, rate: String(a) },
        { from: pivot, to, rate: String(b) },
      ],
    };
  }
  throw new Error("FX_PATH_MISSING");
}
