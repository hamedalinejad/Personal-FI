import { canonicalDecimalString } from './canonicalDecimal.js';
import Decimal from 'decimal.js';

/** UI toman → IRR command amount (1 Toman = 10 Rial/IRR). */
export function tomanUiToIrrCommand(uiAmount: string): string {
  return canonicalDecimalString(new Decimal(uiAmount).times(10).toFixed());
}
