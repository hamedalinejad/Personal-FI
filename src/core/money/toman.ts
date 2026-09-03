import { canonicalDecimalString } from './canonicalDecimal.js';
import Decimal from 'decimal.js';

/** UI toman → IRR command amount (1 Toman = 10 Rial/IRR). */
export function tomanUiToIrrCommand(uiAmount: string): string {
  if (typeof uiAmount !== 'string' || uiAmount.trim() === '') {
    throw new Error('UI money amount must be a non-empty string');
  }
  const amount = new Decimal(uiAmount.trim());
  if (!amount.isFinite() || amount.lt(0)) {
    throw new Error('UI money amount must be a finite non-negative decimal');
  }
  return canonicalDecimalString(amount.times(10).toFixed());
}
