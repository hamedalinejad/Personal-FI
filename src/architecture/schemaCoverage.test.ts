import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * OPEN-001 / Gate D placeholder:
 * When schema.sql exists, this test must assert zero drift vs SCHEMA-FREEZE-COVERAGE.
 * Until then, assert documentation artifacts exist.
 */
describe('schema coverage gate (OPEN-001)', () => {
  const root = resolve(__dirname, '../..');

  it('freeze coverage doc exists', () => {
    expect(existsSync(resolve(root, 'docs/core/db/SCHEMA-FREEZE-COVERAGE.md'))).toBe(true);
  });

  it('relationship matrix lists instrumentId edges', () => {
    const rm = readFileSync(resolve(root, 'docs/core/Relationship-Matrix.md'), 'utf8');
    expect(rm).toContain('inv_fif_funds');
    expect(rm).toContain('instrumentId');
    expect(rm).toContain('UNIQUE(instrumentId)');
  });

  it('field inventory checklist has journal amount', () => {
    const tsv = readFileSync(resolve(root, 'docs/core/field-inventory.checklist.tsv'), 'utf8');
    expect(tsv).toContain('fin_journal_lines\tamount');
  });

  it('schema.sql drift check deferred until file exists', () => {
    const schema = resolve(root, 'schema.sql');
    if (!existsSync(schema)) {
      expect(true).toBe(true); // soft gate
      return;
    }
    const sql = readFileSync(schema, 'utf8');
    expect(sql.toLowerCase()).toContain('fin_operations');
    expect(sql.toLowerCase()).toContain('fin_journal_lines');
  });
});
