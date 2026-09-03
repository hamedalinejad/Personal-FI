import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

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

function assertNoJsonNumbers(value: unknown, path: string): void {
  if (typeof value === 'number') {
    throw new Error(`Fixture financial value must be a string, not number: ${path}`);
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoJsonNumbers(item, `${path}[${index}]`));
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      assertNoJsonNumbers(child, `${path}.${key}`);
    }
  }
}

export function loadFixture(path: string): FixtureFile {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as FixtureFile;
  if (!raw.id || !raw.expected || !raw.input) {
    throw new Error(`Fixture missing id/input/expected: ${path}`);
  }
  assertNoJsonNumbers(raw, '$');
  return raw;
}

export function listFixtureFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => join(dir, f));
}

/** Recursively assert expected leaves equal actual. Strings are compared exactly. */
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
    if (actual === null || typeof actual !== 'object' || Array.isArray(actual)) {
      throw new Error(`Object mismatch at ${path}`);
    }
    const exp = expected as Record<string, unknown>;
    const act = actual as Record<string, unknown>;
    for (const key of Object.keys(exp)) {
      if (!(key in act)) {
        throw new Error(`Missing expected field: ${path}.${key}`);
      }
      assertExpected(exp[key], act[key], path ? `${path}.${key}` : key);
    }
    return;
  }
  if (expected !== actual) {
    throw new Error(`Mismatch at ${path}: expected ${String(expected)} got ${String(actual)}`);
  }
}
