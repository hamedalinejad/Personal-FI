import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { canonicalDecimalString } from '../money/canonicalDecimal.js';

export type FixtureFile = {
  id: string;
  engineVersions?: Record<string, string>;
  input: Record<string, unknown>;
  expected: {
    domain?: Record<string, unknown>;
    journal?: unknown[];
    cash?: Record<string, unknown>;
    holding?: Record<string, unknown>;
    costBasis?: Record<string, unknown>;
    realizedPnl?: Record<string, unknown>;
    unrealizedPnl?: Record<string, unknown>;
    attribution?: Record<string, unknown>;
    wealthDelta?: Record<string, unknown>;
  };
};

export function loadFixture(path: string): FixtureFile {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as FixtureFile;
  if (!raw.id || !raw.expected) {
    throw new Error(`Fixture missing id/expected: ${path}`);
  }
  return raw;
}

export function listFixtureFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => join(dir, f));
}

/** Recursively assert expected leaves equal actual; money-like strings normalized. */
export function assertExpected(
  expected: unknown,
  actual: unknown,
  path = '',
): void {
  if (expected === null || expected === undefined) {
    if (actual !== expected) {
      throw new Error(`Mismatch at ${path}: expected ${String(expected)} got ${String(actual)}`);
    }
    return;
  }
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) {
      throw new Error(`Array mismatch at ${path}`);
    }
    expected.forEach((e, i) => assertExpected(e, (actual as unknown[])[i], `${path}[${i}]`));
    return;
  }
  if (typeof expected === 'object') {
    const exp = expected as Record<string, unknown>;
    const act = (actual ?? {}) as Record<string, unknown>;
    for (const key of Object.keys(exp)) {
      if (!(key in act)) {
        throw new Error(`Missing expected field: ${path}.${key}`);
      }
      assertExpected(exp[key], act[key], path ? `${path}.${key}` : key);
    }
    return;
  }
  if (typeof expected === 'string' && typeof actual === 'string') {
    // try canonical decimal compare when both parse as numbers
    try {
      const e = canonicalDecimalString(expected);
      const a = canonicalDecimalString(actual);
      if (e === a) return;
    } catch {
      /* not decimal */
    }
    if (expected !== actual) {
      throw new Error(`Mismatch at ${path}: expected ${expected} got ${actual}`);
    }
    return;
  }
  if (expected !== actual) {
    throw new Error(`Mismatch at ${path}: expected ${String(expected)} got ${String(actual)}`);
  }
}
