# P0-FINAL-011 … 014 — CA vectors, C2C policy, economic kinds, opening

---

## P0-FINAL-011 — Corporate Action numeric golden vectors (v1)

All CA transforms go through CorporateActionEngine + CostBasisEngine. Numbers below are **mandatory fixtures** (decimal strings in implementation tests).

### CA-BONUS-20

```text
Before: qty=100, totalCost=1_000_000 IRR, avg=10_000
Bonus: +20% free shares (ratio 1.2)
After:  qty=120, totalCost=1_000_000 IRR, avg=8_333.333333… (RoundingPolicy on avg display; totalCost exact)
Realized P&L = 0
Journal: memo reclass only / no cash (unless market requires)
```

### CA-SPLIT-2FOR1

```text
Before: qty=100, totalCost=1_000_000
Split 2-for-1
After:  qty=200, totalCost=1_000_000, avg halved
Realized = 0
```

### CA-REVERSE-SPLIT-1FOR10

```text
Before: qty=100, totalCost=1_000_000
Reverse 1-for-10
After:  qty=10, totalCost=1_000_000
Fractional residue: per fractionalPolicy (cash-in-lieu or round)
```

### CA-CAPITAL-INCREASE-CASH (simplified)

```text
Before: qty=100, totalCost=1_000_000
User exercises: pays 200_000 cash, receives +20 shares
After:  qty=120, totalCost=1_200_000
Cash ↓ 200_000 on paymentDate
```

### CA-RIGHTS-ENTITLEMENT-EXERCISE-CIL

```text
Holding: 100 shares
Rights ratio: 1 right per 10 shares → entitlement rightsQty = 10
Exercise price: 5_000 IRR per new share; 1 right + cash → 1 new share
User exercises 8 rights → +8 shares, cash −40_000, totalCost += 40_000
Remaining 2 rights:
  fractionalPolicy = cash_in_lieu
  cashInLieuRate = 100 IRR per right → +200 cash, rights closed
No orphan rights qty after event closed
```

Engine must emit: entitlement snapshot, exercise legs, CIL cash leg, cost adjustments — all with same `operationId` / CA group id.

---

## P0-FINAL-012 — Transfer vs bridge vs economic swap

Three **disjoint** operation kinds:

| Kind | Realized P&L | Cost | Typical use |
|------|--------------|------|-------------|
| **internal_transfer** | **0** | carry source cost → dest (same instrumentId) | wallet A→B same asset |
| **same_owner_bridge** | **0** | carry cost to **target instrumentId** (e.g. ERC20→TRC20 USDT) | bridge/wrap same economic claim |
| **economic_trade_or_swap** (C2C) | **yes** on disposal leg | dest cost = **fair value / trade implied value** of received **or** explicit legs; source releases cost → realized = proceedsBase − costReleased | true exchange BTC→ETH |

### C2C / economic swap (LOCKED)

```text
Leg S: disposal of source asset at swap-implied proceeds
  proceedsBase = qtySource × impliedPriceSourceQuote × fxPath
  // implied from destination value or explicit rate on command
Leg D: acquisition of dest at costBase = proceedsBase + allocated fees
Realized on S: proceedsBase − costReleasedSource − feeShare
```

**Forbidden:** labeling a true market C2C as `internal_transfer` to hide realized P&L.  
**Forbidden:** using pure cost-carry for economic_trade_or_swap (that is bridge/transfer only).

Command must set `economicKind: internal_transfer | same_owner_bridge | economic_trade_or_swap`.

---

## P0-FINAL-013 — EconomicKind matrix (receive-side)

| economicKind | Income recognition | Cost basis | Journal (v1) | P&L | Wealth |
|--------------|-------------------|------------|--------------|-----|--------|
| **external_transfer** (known self) | none | user_provided or prior carry | Dr Asset Cr Transfer equity/clearing | 0 | ↑ asset |
| **gift** | optional gift income if policy `gift_as_income` else none | FMV or user_provided or zero | if income: Dr Asset Cr Gift income (FMV); else Dr Asset Cr Equity gift | income if recognized | ↑ |
| **airdrop** | **yes** income at FMV (default) | cost = FMV (so later sale marginal) **or** zero_basis+full gain later — **v1 default: cost=FMV, income=FMV** | Dr Asset Cr Airdrop income | income at receipt | ↑ |
| **staking_reward** | **yes** income at FMV | cost = FMV v1 | Dr Asset Cr Staking income | income | ↑ |
| **opening** | none | book cost from opening (FINAL-014) | Dr Asset Cr Opening equity | 0 | ↑ net assets vs equity |
| **fair_value_at_receipt** (policy flag) | if kind is reward/airdrop/gift-as-income | cost = FMV | as above | income = FMV when income on | ↑ |

### fair_value_at_receipt explicit

```text
Dr Asset (FMV base)
Cr Income (same FMV)     // when economicKind recognizes income
// cost basis unit = FMV so immediate unrealized = 0
```

Tax lineage: `linkedTaxEventId` optional later; receive operationId remains parent for any tax_event.

zero_basis: Dr Asset 0 cost / Cr Income 0 or memo; full proceeds become gain on later disposal.

---

## P0-FINAL-014 — Opening balance (never fake purchase)

### Opening operation (all asset classes + cash)

```text
operationType: opening
source: migration | user_opening
```

| Field | Enters cost basis? | Enters valuation only? |
|-------|--------------------|------------------------|
| quantity / cash amount | yes (position/cash) | — |
| bookCost / totalInvested | **yes — sole cost SoT for opening** | — |
| originalAcquisitionDate | lot metadata for FIFO optional; **unknown → null + policy** | does not invent purchase |
| valuationAtOpening | **no cost** | snapshot mark only |

### Journal (asset)

```text
Dr Asset / Investment (bookCost)
Cr Opening equity (bookCost)
// NOT Dr Asset / Cr Cash  ← that would be fake purchase
```

### Journal (cash)

```text
Dr Cash
Cr Opening equity
```

### Crypto example opening BTC

```text
qty=0.5
bookCost=200_000_000 IRR
originalAcquisitionDate=null | user date
valuationAtOpening=210_000_000  // optional mark; unrealized +10m; cost remains 200m
```

No buy trade is synthesized. Rebuild treats opening as acquisition event with given cost, not market purchase.

---

## Status

| ID | Status |
|----|--------|
| P0-FINAL-011 | **LOCKED** + numeric vectors |
| P0-FINAL-012 | **LOCKED** three-way transfer/bridge/swap |
| P0-FINAL-013 | **LOCKED** EconomicKind matrix |
| P0-FINAL-014 | **LOCKED** opening ≠ purchase |

