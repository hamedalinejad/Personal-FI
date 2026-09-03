import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Architecture: only Core helpers implement transfer/bridge/swap cost.
 * Feature packages must not redefine parallel formulas.
 */
describe('AUD-004 single cost implementation path', () => {
  it('canonical helpers exist', () => {
    const base = path.join(process.cwd(), 'src/core/costBasis');
    for (const f of ['transferCost.ts', 'bridgeCost.ts', 'applyEconomicSwap.ts']) {
      expect(fs.existsSync(path.join(base, f))).toBe(true);
    }
  });
});
