import Decimal from 'decimal.js';

function parseCanonicalInput(input: string): Decimal {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new Error('decimal input must be a non-empty string');
  }
  const d = new Decimal(input.trim());
  if (!d.isFinite()) {
    throw new Error('decimal input must be finite');
  }
  return d;
}

/** Canonical decimal string for compare / commandHash / persist. */
export function canonicalDecimalString(input: string): string {
  const d = parseCanonicalInput(input);
  if (d.isZero()) return '0';
  // no scientific notation; strip trailing zeros after point
  let s = d.toFixed();
  if (s.includes('.')) {
    s = s.replace(/\.?0+$/, '');
  }
  return s === '-0' ? '0' : s;
}

export function parseMoney(input: string): Decimal {
  return new Decimal(canonicalDecimalString(input));
}
