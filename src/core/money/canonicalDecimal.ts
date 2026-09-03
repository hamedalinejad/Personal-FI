import Decimal from 'decimal.js';

/** Canonical decimal string for compare / commandHash / persist. */
export function canonicalDecimalString(input: string): string {
  const d = new Decimal(input);
  if (d.isZero()) return '0';
  // no scientific notation; strip trailing zeros after point
  let s = d.toFixed();
  if (s.includes('.')) {
    s = s.replace(/\.?0+$/, '');
  }
  if (s === '-0') return '0';
  return s;
}

export function parseMoney(input: string): Decimal {
  return new Decimal(canonicalDecimalString(input));
}
