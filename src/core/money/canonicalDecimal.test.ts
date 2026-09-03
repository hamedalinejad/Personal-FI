import { describe, it, expect } from 'vitest';
import { canonicalDecimalString } from './canonicalDecimal.js';

describe('P0-CODE-001 canonicalDecimalString', () => {
  it('rejects empty and non-string-like empty', () => {
    expect(() => canonicalDecimalString('')).toThrow();
    expect(() => canonicalDecimalString('   ')).toThrow();
  });

  it('rejects NaN / Infinity text', () => {
    expect(() => canonicalDecimalString('NaN')).toThrow();
    expect(() => canonicalDecimalString('Infinity')).toThrow();
    expect(() => canonicalDecimalString('-Infinity')).toThrow();
  });

  it('rejects malformed', () => {
    expect(() => canonicalDecimalString('abc')).toThrow();
    expect(() => canonicalDecimalString('12.3.4')).toThrow();
  });

  it('canonicalizes -0 and trailing zeros', () => {
    expect(canonicalDecimalString('-0')).toBe('0');
    expect(canonicalDecimalString('0.0')).toBe('0');
    expect(canonicalDecimalString('100.00')).toBe('100');
    expect(canonicalDecimalString('0.00000001')).toBe('0.00000001');
  });
});
