import { describe, it, expect } from 'vitest';
import { acquisitionCostFromReceived } from './acquisitionFeeFromReceived.js';
import { transferCost } from './transferCost.js';

describe('AUD-006', () => {
  it('full consideration over net', () => {
    const r = acquisitionCostFromReceived({
      consideration: '100000000',
      grossQty: '1',
      feeQty: '0.001',
    });
    expect(r.netQty).toBe('0.999');
    expect(r.totalCost).toBe('100000000');
  });
});

describe('AUD-005', () => {
  it('dest+fee=released', () => {
    const r = transferCost({
      beforeCost: '100000000',
      gross: '1',
      net: '0.999',
      feeQty: '0.001',
    });
    expect(r.sourceCostReleased).toBe('100000000');
    expect(r.destinationCarrying).toBe('99900000');
    expect(r.feeCarrying).toBe('100000');
  });
});
