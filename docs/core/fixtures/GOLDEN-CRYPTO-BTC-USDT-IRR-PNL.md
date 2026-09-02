# Golden Fixture — Crypto Multi-FX P&L (BTC / USDT / IRR)

**P0 valuation contract.** Base currency = **IRR**.  
Implements X-009 attribution + X-010 historical locks.  
Forbidden as sole user P&L when base=IRR: `(currentPriceUSDT - averageBuyUSDT) × quantity`.

---

## Scenario setup

| Item | Value |
|------|--------|
| baseCurrency | IRR |
| Asset | BTC |
| quantity `q` | `0.2` |
| Buy: BTC/USDT `P0` | `50000` |
| Buy: USDT/IRR `FX0` | `100000` |
| As-of: BTC/USDT `P1` | `45000` |
| As-of: USDT/IRR `FX1` | `150000` |

### Cost at book (IRR)

```text
costAtBookBase = q × P0 × FX0
               = 0.2 × 50000 × 100000
               = 1000000000 IRR
```

### Value at as-of (IRR)

```text
valueAtAsOfBase = q × P1 × FX1
                = 0.2 × 45000 × 150000
                = 1350000000 IRR
```

### Total unrealized P&L (IRR)

```text
pnlBase = valueAtAsOfBase - costAtBookBase
        = 1350000000 - 1000000000
        = +350000000 IRR
```

### Quote-only move (not final P&L for base=IRR)

```text
Δ in USDT terms = q × (P1 - P0) = 0.2 × (-5000) = -1000 USDT
```

This is **not** the user’s base P&L.

---

## Attribution without double-count

Hold FX at buy for asset-price leg; apply FX change on **current** asset price:

```text
assetPriceEffectBase = q × (P1 - P0) × FX0
                     = 0.2 × (-5000) × 100000
                     = -100000000 IRR

fxEffectBase = q × P1 × (FX1 - FX0)
             = 0.2 × 45000 × 50000
             = +450000000 IRR

assetPriceEffectBase + fxEffectBase
  = -100000000 + 450000000
  = +350000000 IRR
  = pnlBase
```

Optional components (zero in this fee-free hold scenario):

```text
feeEffectBase = 0
externalCashFlowEffectBase = 0
realizedPnlBase = 0
unrealizedPnlBase = pnlBase
```

---

## Required valuation / report contract fields

```text
valueAtAsOfBase
costAtBookBase
pnlBase
assetPriceEffectBase
fxEffectBase
feeEffectBase
externalCashFlowEffectBase
realizedPnlBase
unrealizedPnlBase
```

Plus provenance: `priceAsOf`, `fxAsOf` (or per-hop `conversionPath`), `baseCurrencyAtBook`, engineVersions.

`pnlBase` **must** be decomposable; a single opaque total is insufficient for multi-currency holdings.

---

## Forbidden

```text
// NOT valid final P&L when user baseCurrency = IRR
(currentPriceUSDT - averageBuyUSDT) × quantity

// Opaque only — allowed as check, not as sole reported breakdown
currentValueIRR - historicalCostIRR   // without assetPriceEffect + fxEffect (+ fees/flows)
```

Changing the user’s **current** baseCurrency setting must **not** rewrite historical `costAtBookBase` / amounts booked under `baseCurrencyAtOperation` (X-010 / P0-097).

---

## Acceptance tests

| # | Setup | Expect |
|---|--------|--------|
| 1 | BTC ↓, USDT/IRR fixed | `pnlBase` < 0; dominated by `assetPriceEffectBase` |
| 2 | BTC fixed, USDT/IRR ↑ | `pnlBase` > 0; dominated by `fxEffectBase` |
| 3 | BTC ↓, USDT/IRR ↑ (this fixture) | `pnlBase` may be **> 0** despite BTC/USDT loss |
| 4 | BTC ↑, USDT/IRR ↓ | asset gain may offset negative FX; both effects reported |
| 5 | Fee in USDT, BTC, IRR, or other asset | `feeEffectBase` separate; fee economics apply **once** (X-011) |
| 6 | User switches baseCurrency after booking | historical as-booked IRR (or original base) unchanged |

All money fields in fixtures/API: **decimal strings**.

---

## Implementation pointers

- CostBasisEngine + valuation adapter produce cost/qty; FX attribution in valuation/report layer using locked path rates.
- Crypto Feature: contract + this fixture; no parallel ad-hoc P&L formula.
- Reports / Portfolio: expose decomposition fields when `conversionPath` length ≥ 1 or quote ≠ base.
