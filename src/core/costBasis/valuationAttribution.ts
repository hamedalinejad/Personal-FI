import Decimal from 'decimal.js';
import { canonicalDecimalString } from '../money/canonicalDecimal.js';

/** BTC/USDT/IRR attribution vector from the v1 golden convention. */
export function btcUsdtIrrUnrealized(params: {
  qty: string;
  buyUsdtPerBtc: string;
  fx0: string;
  markUsdtPerBtc: string;
  fx1: string;
}) {
  const q = new Decimal(params.qty);
  const buy = new Decimal(params.buyUsdtPerBtc);
  const fx0 = new Decimal(params.fx0);
  const mark = new Decimal(params.markUsdtPerBtc);
  const fx1 = new Decimal(params.fx1);

  if (!q.isFinite() || q.lte(0)) throw new Error('qty must be finite and > 0');
  if (!buy.isFinite() || buy.lte(0)) throw new Error('buy price must be finite and > 0');
  if (!mark.isFinite() || mark.lte(0)) throw new Error('mark price must be finite and > 0');
  if (!fx0.isFinite() || fx0.lte(0)) throw new Error('fx0 must be finite and > 0');
  if (!fx1.isFinite() || fx1.lte(0)) throw new Error('fx1 must be finite and > 0');

  const cost = q.times(buy).times(fx0);
  const value = q.times(mark).times(fx1);
  const total = value.minus(cost);
  const valuePriceOnly = q.times(mark).times(fx0);
  const assetEffect = valuePriceOnly.minus(cost);
  const fxEffect = total.minus(assetEffect);
  const quoteOnlyUsdt = q.times(mark.minus(buy));

  return {
    totalInvestedIRR: canonicalDecimalString(cost.toFixed()),
    valueIRR: canonicalDecimalString(value.toFixed()),
    totalBase: canonicalDecimalString(total.toFixed()),
    assetPriceEffectBase: canonicalDecimalString(assetEffect.toFixed()),
    fxEffectBase: canonicalDecimalString(fxEffect.toFixed()),
    quoteOnlyUsdt: canonicalDecimalString(quoteOnlyUsdt.toFixed()),
  };
}
