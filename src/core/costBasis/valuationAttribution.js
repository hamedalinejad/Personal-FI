import { canonicalDecimalString } from "../money/canonicalDecimal.js";

function asPos(s, name) {
  const c = canonicalDecimalString(String(s));
  const n = Number(c);
  if (!Number.isFinite(n) || !(n > 0)) throw new Error(`${name}_NOT_POSITIVE`);
  return n;
}

/** BUG-CODE-005 */
export function valuationAttribution({ quantity, price0, price1, fx0, fx1 }) {
  const q = asPos(quantity, "QTY");
  const p0 = asPos(price0, "PRICE0");
  const p1 = asPos(price1, "PRICE1");
  const f0 = asPos(fx0, "FX0");
  const f1 = asPos(fx1, "FX1");
  const assetPriceEffect = q * (p1 - p0) * f0;
  const fxEffect = q * p1 * (f1 - f0);
  return {
    assetPriceEffectBase: String(assetPriceEffect),
    fxEffectBase: String(fxEffect),
    total: String(assetPriceEffect + fxEffect),
  };
}
