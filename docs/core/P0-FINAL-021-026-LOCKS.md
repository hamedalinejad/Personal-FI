# P0-FINAL-021 … 026 — Cost basis depth · Performance · Snapshot watermark

---

## P0-FINAL-021 — costCurrency immutable per cost-basis state

```text
costCurrency = currency of totalInvested / unit cost pool on a holding (or lot)
```

**LOCKED:**

- Immutable for the life of that cost-basis **state** (holding pool / lot).
- Changing user `baseCurrency` does **not** rewrite historical `costCurrency` or `amountInBase` on past ops (P0-097).
- To re-denominate cost pool: explicit **migration / rebuild operation** with new `engineVersions` + audit — not a silent settings toggle.

Default: cost pool stored in **book currency at first acquisition** (often user base at open); may equal holding quote currency if product locks “cost in USDT” — still immutable after first post.

---

## P0-FINAL-022 — CostBasisFeeAllocation v1

### Buy (acquisition)

```text
capitalizedFeesBase = sum of fees with treatment = capitalize_into_cost
costBasisAdded = acquisitionSpendInCostCurrency + capitalizedFeesInCostCurrency
// fee_in_quote: usually capitalize or expense per feeTreatment; v1 default buy quote fee → capitalize into cost
// fee same-asset from received: net qty only; spend still full quote; cost per net unit rises
// fee third_asset: convert to costCurrency via path at trade; capitalize or expense per treatment
```

### Sell (disposal)

```text
grossProceeds = qty × price
netProceeds = grossProceeds − fees_with_treatment_from_proceeds
realized = netProceedsInCostOrBase − costReleased − (expense fees not already in net)
```

### Fee-in-quote (buy)

```text
qty_net = gross (if fee not from asset)
cost += quotePaid + quoteFee   // both in cost currency after FX
```

### Fee-in-asset (buy, from received)

```text
qty_net = gross − feeQty
cost += quotePaid only (no second cash for asset fee)
// avg = cost / qty_net
```

### Fee third asset

```text
feeValueInCostCurrency = feeQty × price(feeInstrument) × fx path
if capitalize → cost += feeValue
if expense → feeEffect P&L; cost unchanged by fee
```

### Fee from proceeds (sell)

```text
netProceeds = grossProceeds − feeFromProceeds
realized uses netProceeds
```

### Transfer fee

See P0-FINAL-023 (not acquisition capitalisation of unrelated transfer).

One CanonicalFeeEvent → one economic allocation (X-011).

---

## P0-FINAL-023 — Transfer fee between two cost pools

```text
Source:
  release carrying for grossQty sent (or net policy — v1: release for qty leaving source)
  feeQty burned on source or path:
    feeCarrying = feeQty × avgCostSource
    → P&L/expense per P0-FINAL-004 (v1: expense released carrying); NOT added to destination cost

Destination:
  receivedNetQty = gross − fee if fee_from_received else gross
  transferredCost = carrying released for **receivedNetQty** only
                (source released for receivedNetQty; fee portion already expensed)
```

| Component | Effect |
|-----------|--------|
| source carrying for net received | moves to dest cost |
| fee carrying | expense/P&L (v1), not dest cost |
| dest totalInvested | += transferredCost (+ dest-side capitalize fees if any) |

---

## P0-FINAL-024 — Period return metric v1 (executable)

**v1 ships one primary investment period return:**

```text
name: simple_modified_dietz_like_bridge  (document as "Period Return v1")

R = (endValue − startValue − netExternalFlows) / 
    (startValue + weightedExternalFlows)

where:
  startValue, endValue = position (+ optional cashScope) under ValuationContext at period bounds
  netExternalFlows = contributions − withdrawals (base); **exclude** internal transfers
  weightedExternalFlows = Σ flow_i × (weight_i) 
  v1 weight: mid-period = 0.5 for all flows  (simple); optional day-weight later as v2

Also always expose the **additive bridge** (not a ratio):
  startValue
  + purchases
  − sales/redemptions
  + income cash
  + realized (optional detail)
  + unrealized change
  + fees/expense
  = endValue
  (± residual reconcile)
```

**Not in v1 as default:** full TWR sub-period chain, XIRR/MWR — may be added later as named metrics with own formulas. UI must not label Period Return v1 as TWR/XIRR.

---

## P0-FINAL-025 — Cash FX / wealth vs P&L matrix

| Position | FX move, no transaction | Wealth Δ | Investment P&L | Classification |
|----------|-------------------------|----------|----------------|----------------|
| Cash in **base** only | N/A | 0 from FX | 0 | — |
| Cash in **foreign currency** | FX to base changes | **yes** (translation) | **0** investment P&L | `cashFxTranslationEffect` in wealth bridge |
| Foreign **asset** (BTC etc.) | price and/or FX | yes | yes — Attribution v1 (price + FX effects) | investment unrealized |
| Foreign **liability** | FX | yes (liability in base) | 0 or financing FX policy — **v1: wealth only as `liabilityFxTranslationEffect`** | not asset P&L |

```text
WealthDelta = InvestmentP&L
            + ExternalFlows
            + cashFxTranslationEffect
            + liabilityFxTranslationEffect
            + other (revals per policy)
```

Example: 100m IRR cash only, “IRR depreciates vs USD” with base=IRR → **Wealth Δ = 0** (base cash unchanged).  
If base=USD and 100m IRR cash: translation changes USD wealth; **P&L investment = 0**.

---

## P0-FINAL-026 — Canonical snapshot watermark

```text
SnapshotWatermark {
  ledgerWatermark: {
    lastOperationId: string
    lastJournalSequence?: string
  }
  priceAsOf: string
  priceDatasetVersion?: string   // or hash of selected price observations
  fxAsOf: string
  fxDatasetVersion?: string
  engineVersions: Record<string, string>
  calculationContextHash: string  // hash of ValuationContext + policies + attributionAlgorithmVersion
  rebuiltAt: string
  schemaVersion: string
}
```

Reproducibility: same ledger watermark + same price/fx dataset versions + same engineVersions + same context hash ⇒ same report numbers.

`lastOperationId` alone is **insufficient** when marks depend on price/FX inputs.

---

## Status

| ID | Status |
|----|--------|
| P0-FINAL-021…026 | **LOCKED** |

## P0-002 single release

`TransferCostResult` — one release of gross carrying cost, split to dest+fee. See `P0-COST-BASIS-PNL-001-005-LOCK.md`.

## P0-FINAL-006 supersession

Period Return additive bridge: **only** wealth bridge + investmentReturn bridge in `P0-FINAL-006-015-LOCKS.md`. Old mixed flow+return equations are void.

## P0-FINAL-009

costCurrency immutable per pool; default baseCurrencyAtFirstCostBearingEvent — `P0-FINAL-006-015-LOCKS.md`.

---

## P0-FIX-008 — Period Return bridges (sole valid version)

### Wealth bridge

```text
Wealth = Opening Wealth
       + External Flows
       + Investment Return
       + Cash FX Translation
       + Liability FX Translation
       + Other Policy Effects
```

### Investment Return bridge

```text
Investment Return = Realized
                  + Unrealized
                  + Recognized Income
                  − Recognized Investment Expense
```

Asset-price / FX **attribution** = child detail of a return component — **not** an additive peer on the wealth equation.

Any older mixed formula (`start + purchases − sales + income + realized + unrealized + fees = end`) is **LEGACY — SUPERSEDED**.

---

## P0-DOC-008 — SUPERSEDED mixed period bridge (do not implement)

```text
LEGACY / SUPERSEDED — DO NOT USE:
start + purchases - sales + income + realized + unrealized + fees = end
```

**Canonical only:**

```text
Wealth = Opening + ExternalFlows + InvestmentReturn + CashFX + LiabilityFX + OtherPolicy
InvestmentReturn = Realized + Unrealized + RecognizedIncome - RecognizedInvestmentExpense
```

Attribution (asset price / FX) is **child detail**, not a wealth peer term.
