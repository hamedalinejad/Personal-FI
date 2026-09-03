import { describe, it, expect } from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { assertExpected, loadFixture } from './harness.js';

describe('P1-CODE-006 assertExpected exact strings', () => {
  it('does not treat 001 and 1 as equal identifiers', () => {
    expect(() => assertExpected('001', '1')).toThrow();
    expect(() => assertExpected({ id: '001' }, { id: '1' })).toThrow();
    assertExpected({ id: '001' }, { id: '001' });
  });
});

describe('P1-CODE-007 loadFixture rejects JSON numbers', () => {
  it('rejects numeric money/qty primitives', () => {
    const dir = join(tmpdir(), `pfi-fx-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const path = join(dir, 'bad.json');
    writeFileSync(
      path,
      JSON.stringify({
        id: 'bad',
        input: { amount: 1000 },
        expected: { domain: {} },
      }),
    );
    try {
      expect(() => loadFixture(path)).toThrow(/string, not number/);
    } finally {
      unlinkSync(path);
    }
  });
});
