# P0 Cost-Basis / P&L locks 001–005 (canonical — supersedes conflicting prose)

> **Authority:** این سند برای C2C semantics، transfer fee cost، acquisition fee roles، و P&L axes.  
> هر متن مخالف در Cost-Basis-Engine / CR-005 / P1-GLOBAL باید به اینجا ارجاع دهد یا اصلاح شود.

---

## P0-FINAL-001 — economicKind discriminator (C2C / transfer / bridge)

Command **must** set exactly one:

```text
economicKind:
  internal_transfer
  | same_owner_bridge
  | economic_trade_or_swap
```

### Semantic contract (hard)

#### `internal_transfer`
```text
realizedPnl = 0
destinationCost = sourceCarryingCostMoved   // proportional to quantity moved
transferredCost ALLOWED as engine internal name for that moved carrying cost
```

#### `same_owner_bridge` (identity change, same owner, e.g. USDT-ERC20 → USDT-TRC20)
```text
realizedPnl = 0
destinationCost = carryingCostMovedToTargetInstrument  // after fee split if any
transferredCost ALLOWED
```

#### `economic_trade_or_swap` (true C2C market swap, BTC→ETH, etc.)
```text
sourceProceedsBase = explicit trade consideration converted to source book/base currency
sourceRealizedBase = sourceProceedsBase − sourceCostReleased − saleFeesAllocatedToDisposal
destinationCostBase = destinationConsiderationBase + capitalizedAcquisitionFees
```

**Forbidden on trade/swap path:**
- setting destination cost = source carrying cost (“cost carry”)
- accepting `transferredCost` as the **destination book cost input** for trade/swap
- labeling market C2C as `internal_transfer`

### Acceptance (P0-001)
```text
BTC carrying cost = 100_000_000 IRR
swap → ETH; ETH consideration = 140_000_000 IRR
→ source realized = 40_000_000 − applicable sale fees
→ ETH opening cost basis = 140_000_000 + capitalized buy fees
→ NOT 100_000_000
```

---

## P0-FINAL-002 — Transfer fee: single cost release

**Problem:** releasing cost on `transfer_out(gross)` **and** again on `fee_burn(feeQty)` double-counts.

### Canonical event graph (one engine pass)

```text
Source pool before: qty=gross, cost=totalCost
avg = totalCost / gross

ONE release from source cost pool:
  releasedCostTotal = avg * gross   // exactly once

Split of releasedCostTotal (no second pool mutation):
  transferredCostToDestination = avg * netQuantity
  feeCarryingCost              = avg * feeQuantity
  assert transferred + feeCarrying == releasedCostTotal (± rounding policy)

Source after: qty=0 (or −gross), cost=0 (or −releasedCostTotal)
Destination: qty += net; cost += transferredCostToDestination
Fee economic effect: feeCarryingCost once (expense or equity per feeTreatment)
  — does NOT call releaseCost(feeQty) again
```

Engine returns **one** result object:

```typescript
interface TransferCostResult {
  releasedCostTotal: string;
  transferredCostToDestination: string;
  feeCarryingCost: string;
  sourceQtyDelta: string;      // -gross
  destinationQtyDelta: string; // +net
  feeQtyDelta: string;         // -fee on source instrument
}
```

Two independent code paths must not each subtract from the same pool.

### Acceptance (P0-002)
```text
1 BTC cost 100m; send 1 BTC; fee 0.001 BTC:
  source cost removed = 100m total
  destination cost    = 99.9m
  fee carrying        = 0.1m
  99.9 + 0.1 = 100  (exact reconcile)
```

---

## P0-FINAL-003 — economicFeeRole (acquisition vs burn)

`feePresence` alone is insufficient. Every fee leg sets:

```text
economicFeeRole:
  acquisition_fee_from_received
  | post_acquisition_network_burn
  | sale_fee_from_proceeds
  | standalone_asset_burn
```

| Role | Cost/qty behavior |
|------|-------------------|
| **acquisition_fee_from_received** | Quote/cash spend is full trade consideration; **holding += net qty**; cost basis = consideration (+ capitalized policy) **over net qty**; **no** separate `standalone_asset_burn` cost release |
| **post_acquisition_network_burn** | After acquisition complete; burn uses proportional carrying of held qty |
| **sale_fee_from_proceeds** | Reduces proceeds / feeFromProceeds; not a second qty burn on inventory unless explicit |
| **standalone_asset_burn** | Only this uses generic burn-cost release on fee quantity |

### Acceptance (P0-003)
```text
BUY 1 BTC for 100m IRR; 0.001 BTC taken from received (acquisition_fee_from_received):
  holding +0.999 BTC
  cash −100m IRR
  no second BTC cash movement
  cost basis = 100m over 0.999 BTC
  no duplicate fee expense from standalone burn unless policy explicitly adds expense treatment
```

---

## P0-FINAL-004 — Two-axis P&L model

**Forbidden:** flat sibling list that invites summing both axes.

### Axis 1 — Primary buckets (lifecycle)
```text
realizedPnlBase
unrealizedPnlBase
recognizedIncomeBase
recognizedExpenseBase
```
```text
primaryPnlBase = sum(primary buckets)
```

### Axis 2 — Attribution dimensions (within a bucket, when attributable)
```text
assetPriceEffectBase
fxEffectBase
feeEffectBase
costBasisResidualEffectBase
```
```text
bucketPnl = sum(dimensions for that bucket)  // only when attributionStatus=exact
```

### Outside P&L
```text
externalFlowEffectBase  // contributions, withdrawals — wealth only
```

Report API exposes structured object, **not** a flat array of all of the above as summable peers.

---

## P0-FINAL-005 — attributionStatus

```text
attributionStatus: exact | degraded | unavailable
```

| Status | Meaning |
|--------|---------|
| **exact** | Dimension fields populated; sum to bucket total |
| **degraded** | **Total** P&L / wealth delta is exact; non-identifiable dimensions are **`null`** (not zero, not invented); UI shows “جزئیات قابل تفکیک نیست” |
| **unavailable** | Valuation itself cannot be computed |

WA multi-quote without unique historical FX split → **degraded** (or lot mode preferred).  
**Forbidden:** manufacturing synthetic historical FX split when non-identifiable.

---

## P0-FINAL-AUD-005 — Single pool mutation (transfer fee)

```text
releasedCostTotal = avg × gross
transferredCost   = avg × net
feeCarrying       = avg × fee
releasedCostTotal = transferredCost + feeCarrying
```

**Forbidden:** `transfer_out` releases cost **and** `fee_burn` releases cost again.

**Code:** only `transferCost()` / `bridgeCost()` return `TransferCostResult`. Adapters **must not** mutate the cost pool a second time.

## P0-FINAL-AUD-006 — Acquisition fee ≠ burn

```text
acquisition_fee_from_received  ≠  post_acquisition_network_burn  ≠  standalone_asset_burn
```

BUY example:

```text
BUY gross 1 BTC · fee 0.001 from received · net 0.999
consideration C (quote/cash)
holding += 0.999
unit cost pool = C / 0.999
```

**No** second `standalone_asset_burn` cost release on the 0.001.

## P0-FINAL-AUD-007 — Two-axis P&L in API object

```typescript
interface PnlReport {
  primary: {
    realizedPnlBase: string;
    unrealizedPnlBase: string;
    recognizedIncomeBase: string;
    recognizedExpenseBase: string;
    primaryPnlBase: string; // realized+unrealized+income−expense
  };
  attribution?: {
    status: 'exact' | 'degraded' | 'unavailable';
    // dimensions ONLY when status=exact; else null — never flat-sum with primary
    assetPriceEffectBase: string | null;
    fxEffectBase: string | null;
    feeEffectBase: string | null;
    costBasisResidualEffectBase: string | null;
  };
}
```

**Forbidden:** one array of siblings `[realized, unrealized, assetPrice, fx, fees, …]` inviting sum of both axes.

## P0-FINAL-AUD-008 — WAC multi-quote degraded

| status | |
|--------|--|
| exact | dimensions populated and sum to bucket |
| degraded | **total** P&L exact; non-identifiable dimensions = **`null`** |
| unavailable | valuation cannot run |

**Forbidden:** inventing synthetic FX split when history is non-identifiable.
