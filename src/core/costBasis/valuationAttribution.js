import { toDecimal } from "../money/canonicalDecimal.js";

function asPos(s, name) {
  const d = toDecimal(s);
  if (!d.gt(0)) throw new Error(`${name}_NOT_POSITIVE`);
  return d;
}

export function valuationAttribution({ quantity, price0, price1, fx0, fx1 }) {
  const q = asPos(quantity, "QTY");
  const p0 = asPos(price0, "PRICE0");
  const p1 = asPos(price1, "PRICE1");
  const f0 = asPos(fx0, "FX0");
  const f1 = asPos(fx1, "FX1");
  const assetPriceEffect = q.times(p1.minus(p0)).times(f0);
  const fxEffect = q.times(p1).times(f1.minus(f0));
  return {
    assetPriceEffectBase: assetPriceEffect.toFixed(),
    fxEffectBase: fxEffect.toFixed(),
    total: assetPriceEffect.plus(fxEffect).toFixed(),
  };
}
