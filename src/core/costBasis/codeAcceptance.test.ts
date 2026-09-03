import { describe, it, expect } from 'vitest';
import { transferCost } from './transferCost.js';
import { acquisitionCostFromReceived } from './acquisitionFeeFromReceived.js';
import { applyEconomicSwap } from './applyEconomicSwap.js';
import { btcUsdtIrrUnrealized } from './valuationAttribution.js';

describe('P0-CODE-002 transferCost', () => {
  it('single release conservation', () => {
    const r = transferCost({ beforeCost: '100000000', gross: '1', net: '0.999', feeQty: '0.001' });
    expect(r.sourceCostReleased).toBe('100000000');
    expect(r.destinationCarrying).toBe('99900000');
    expect(r.feeCarrying).toBe('100000');
  });

  it('rejects invalid inputs', () => {
    expect(() => transferCost({ beforeCost: '-1', gross: '1', net: '1', feeQty: '0' })).toThrow();
    expect(() => transferCost({ beforeCost: '100', gross: '0', net: '0', feeQty: '0' })).toThrow();
    expect(() => transferCost({ beforeCost: '100', gross: '1', net: '0.5', feeQty: '0.4' })).toThrow();
    expect(() => transferCost({ beforeCost: 'NaN', gross: '1', net: '1', feeQty: '0' })).toThrow();
    expect(() => transferCost({ beforeCost: '100', gross: '1', net: '-0.1', feeQty: '1.1' })).toThrow();
  });
});

describe('P0-CODE-003 acquisitionCostFromReceived', () => {
  it('accepts valid fee_from_received', () => {
    const r = acquisitionCostFromReceived({ consideration: '100', grossQty: '1', feeQty: '0.001' });
    expect(r.netQty).toBe('0.999');
    expect(r.totalCost).toBe('100');
  });

  it('rejects impossible states', () => {
    expect(() => acquisitionCostFromReceived({ consideration: '100', grossQty: '1', feeQty: '-0.1' })).toThrow();
    expect(() => acquisitionCostFromReceived({ consideration: '100', grossQty: '1', feeQty: '1' })).toThrow();
    expect(() => acquisitionCostFromReceived({ consideration: '0', grossQty: '1', feeQty: '0' })).toThrow();
    expect(() => acquisitionCostFromReceived({ consideration: 'NaN', grossQty: '1', feeQty: '0' })).toThrow();
  });
});

describe('P0-CODE-004 applyEconomicSwap', () => {
  it('destination from consideration not market carry', () => {
    const r = applyEconomicSwap({
      sourceCarryingReleased: '50',
      swapConsideration: '200',
      saleFee: '1',
      capitalizedDestFees: '2',
    });
    expect(r.realized).toBe('149');
    expect(r.destinationCost).toBe('202');
  });

  it('rejects invalid states', () => {
    expect(() =>
      applyEconomicSwap({ sourceCarryingReleased: '-1', swapConsideration: '10', saleFee: '0' }),
    ).toThrow();
    expect(() =>
      applyEconomicSwap({ sourceCarryingReleased: '1', swapConsideration: '0', saleFee: '0' }),
    ).toThrow();
    expect(() =>
      applyEconomicSwap({ sourceCarryingReleased: '1', swapConsideration: '10', saleFee: '-1' }),
    ).toThrow();
  });
});

describe('P0-CODE-005 valuationAttribution', () => {
  it('rejects zero/negative/non-finite', () => {
    const base = {
      qty: '0.2',
      buyUsdtPerBtc: '50000',
      fx0: '100000',
      markUsdtPerBtc: '45000',
      fx1: '150000',
    };
    expect(() => btcUsdtIrrUnrealized({ ...base, qty: '0' })).toThrow();
    expect(() => btcUsdtIrrUnrealized({ ...base, fx0: '-1' })).toThrow();
    expect(() => btcUsdtIrrUnrealized({ ...base, markUsdtPerBtc: 'NaN' })).toThrow();
  });

  it('computes deterministic P&L', () => {
    const r = btcUsdtIrrUnrealized({
      qty: '0.2',
      buyUsdtPerBtc: '50000',
      fx0: '100000',
      markUsdtPerBtc: '45000',
      fx1: '150000',
    });
    expect(r.totalInvestedIRR).toBe('1000000000');
    expect(r.valueIRR).toBe('1350000000');
    expect(r.totalBase).toBe('350000000');
  });
});
