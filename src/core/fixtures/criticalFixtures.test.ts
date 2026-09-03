import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { loadFixture, assertExpected } from './harness.js';
import { tomanUiToIrrCommand } from '../money/toman.js';
import { transferCost } from '../costBasis/transferCost.js';
import { applyEconomicSwap } from '../costBasis/applyEconomicSwap.js';
import { btcUsdtIrrUnrealized } from '../costBasis/valuationAttribution.js';

const root = join(process.cwd(), 'fixtures');

describe('P0 critical fixtures (executable)', () => {
  it('CRITICAL-TOMAN-INPUT', () => {
    const f = loadFixture(join(root, 'CRITICAL-TOMAN-INPUT.json'));
    const amount = tomanUiToIrrCommand(String(f.input.uiAmount));
    assertExpected(f.expected.domain, { amount, currency: 'IRR' });
  });

  it('CRITICAL-TRANSFER-FEE', () => {
    const f = loadFixture(join(root, 'CRITICAL-TRANSFER-FEE.json'));
    const r = transferCost({
      beforeCost: String(f.input.beforeCostIRR),
      gross: String(f.input.gross),
      net: String(f.input.net),
      feeQty: String(f.input.feeQty),
    });
    assertExpected(f.expected.costBasis, r);
    assertExpected(f.expected.realizedPnl, { base: '0' });
  });

  it('CRITICAL-C2C-SWAP', () => {
    const f = loadFixture(join(root, 'CRITICAL-C2C-SWAP.json'));
    const r = applyEconomicSwap({
      sourceCarryingReleased: String(f.input.btcCarryingReleased),
      swapConsideration: String(f.input.btcSwapConsideration),
      saleFee: String(f.input.saleFee),
    });
    assertExpected(f.expected.realizedPnl, { btc: r.realized });
    assertExpected(f.expected.costBasis, { ethDestinationCost: r.destinationCost });
  });

  it('CRYPTO-BTC-USDT-IRR-PNL', () => {
    const f = loadFixture(join(root, 'CRYPTO-BTC-USDT-IRR-PNL.json'));
    const r = btcUsdtIrrUnrealized({
      qty: String(f.input.qty),
      buyUsdtPerBtc: String(f.input.buyUsdtPerBtc),
      fx0: String(f.input.fx0),
      markUsdtPerBtc: String(f.input.markUsdtPerBtc),
      fx1: String(f.input.fx1),
    });
    assertExpected(f.expected.costBasis, { totalInvestedIRR: r.totalInvestedIRR });
    assertExpected(f.expected.unrealizedPnl, { totalBase: r.totalBase });
    assertExpected(f.expected.attribution, {
      status: 'exact',
      assetPriceEffectBase: r.assetPriceEffectBase,
      fxEffectBase: r.fxEffectBase,
      quoteOnlyUsdt: r.quoteOnlyUsdt,
    });
  });
});
