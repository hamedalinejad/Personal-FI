import Decimal from 'decimal.js';
import { canonicalDecimalString } from '../money/canonicalDecimal.js';

/** BTC/USDT/IRR attribution vector from GOLDEN-CRYPTO-BTC-USDT-IRR-PNL */
export function btcUsdtIrrUnrealized(params: {
  qty: string;
  buyUsdtPerBtc: string;
  fx0: string;
  markUsdtPerBtc: string;
  fx1: string;
}) {
  const q = new Decimal(params.qty);
  const cost = q.times(params.buyUsdtPerBtc).times(params.fx0);
  const value = q.times(params.markUsdtPerBtc).times(params.fx1);
  const total = value.minus(cost);
  // asset effect: hold FX0, price change only
  const valuePriceOnly = q.times(params.markUsdtPerBtc).times(params.fx0);
  const assetEffect = valuePriceOnly.minus(cost);
  const fxEffect = total.minus(assetEffect);
  const quoteOnlyUsdt = q.times(new Decimal(params.markUsdtPerBtc).minus(params.buyUsdtPerBtc));
  return {
    totalInvestedIRR: canonicalDecimalString(cost.toFixed()),
    valueIRR: canonicalDecimalString(value.toFixed()),
    totalBase: canonicalDecimalString(total.toFixed()),
    assetPriceEffectBase: canonicalDecimalString(assetEffect.toFixed()),
    fxEffectBase: canonicalDecimalString(fxEffect.toFixed()),
    quoteOnlyUsdt: canonicalDecimalString(quoteOnlyUsdt.toFixed()),
  };
}
