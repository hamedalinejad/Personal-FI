import { describe, it, expect } from 'vitest';
import { acquisitionCostFromReceived } from './acquisitionFeeFromReceived.js';
import { transferCost } from './transferCost.js';
import { applyEconomicSwap } from './applyEconomicSwap.js';

describe('cost-basis input validation', () => {
  it('accepts acquisition fee from received and keeps full consideration as cost', () => {
    const r = acquisitionCostFromReceived({
      consideration: '100000000',
      grossQty: '1',
      feeQty: '0.001',
    });
    expect(r.netQty).toBe('0.999');
    expect(r.totalCost).toBe('100000000');
    expect(r.avgCost).toBe('100100100.1001001001001001001');
  });

  it('rejects fee equal to or above gross quantity', () => {
    expect(() => acquisitionCostFromReceived({
      consideration: '100',
      grossQty: '1',
      feeQty: '1',
    })).toThrow();
    expect(() => acquisitionCostFromReceived({
      consideration: '100',
      grossQty: '1',
      feeQty: '2',
    })).toThrow();
  });

  it('rejects negative monetary inputs', () => {
    expect(() => acquisitionCostFromReceived({
      consideration: '-100',
      grossQty: '1',
      feeQty: '0',
    })).toThrow();
    expect(() => transferCost({
      beforeCost: '-1',
      gross: '1',
      net: '1',
      feeQty: '0',
    })).toThrow();
  });

  it('rejects zero/invalid transfer gross and non-conserving quantities', () => {
    expect(() => transferCost({ beforeCost: '100', gross: '0', net: '0', feeQty: '0' })).toThrow();
    expect(() => transferCost({ beforeCost: '100', gross: '1', net: '0.998', feeQty: '0.001' })).toThrow();
  });

  it('preserves a single released-cost reconciliation on transfer', () => {
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

  it('rejects invalid economic swaps', () => {
    expect(() => applyEconomicSwap({
      sourceCarryingReleased: '100',
      swapConsideration: '0',
      saleFee: '0',
    })).toThrow();
    expect(() => applyEconomicSwap({
      sourceCarryingReleased: '100',
      swapConsideration: '200',
      saleFee: '-1',
    })).toThrow();
  });
});

describe('P0-CODE negative guards', () => {
  it('rejects fee >= gross', () => {
    expect(() =>
      acquisitionCostFromReceived({
        consideration: '100',
        grossQty: '1',
        feeQty: '1',
      }),
    ).toThrow();
  });
  it('rejects non-positive consideration', () => {
    expect(() =>
      acquisitionCostFromReceived({
        consideration: '0',
        grossQty: '1',
        feeQty: '0',
      }),
    ).toThrow();
  });
  it('rejects invalid transfer gross', () => {
    expect(() =>
      transferCost({ beforeCost: '100', gross: '0', net: '0', feeQty: '0' }),
    ).toThrow();
  });
});
