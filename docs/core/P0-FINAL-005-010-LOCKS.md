# P0-FINAL-005 … 010 — Deterministic valuation, FX, settlement, dividend

**حساسیت:** قبل از ورود به کد؛ دو developer باید از همین قراردادها به یک عدد برسند.

---

## P0-FINAL-005 — P&L Attribution Algorithm v1

### Convention choice (LOCKED)

Attribution is **path-dependent**; we fix **one** convention for all reports:

```text
Convention name: ANCHOR_COST_FX_THEN_PRICE_ON_MARK  (v1)

For unrealized mark-to-market of a lot (or WA pool treated as single pool):
  1. Anchor acquisition: qty, costInQuote0, fxToBase0 (book path at acquisition)
  2. Asset-price effect uses FX at acquisition (FX0):
       assetPriceEffectBase = qty × (P1 − P0) × FX0
       where P in quote currency of the valuation leg
  3. FX effect uses current asset price P1:
       fxEffectBase = qty × P1 × (FX1 − FX0)
  4. Sum = unrealized pnlBase for that position slice
     (matches golden BTC/USDT/IRR)

For multi-hop quote→base, FX0 and FX1 are **composed rates** from Conversion Path v1
(see P0-FINAL-006), not a single pair only.
```

**Do not** use competing conventions (e.g. FX-first with P0) in the same product version without a new `attributionAlgorithmVersion` on the report.

### Anchors

| Level | Anchor |
|-------|--------|
| Lot / WA pool | acquisition cost in **book base at acquisition** (`costAtBookBase`), qty remaining |
| Realized disposal | cost released for disposed qty (CostBasisEngine) vs proceeds in base at **trade** FX path |
| Fees | CanonicalFeeEvent once (X-011); feeEffectBase separate |
| External flows | contribution/withdrawal → **not** in P&L (P1 §22) |

### Trade-level realized (v1)

```text
proceedsBase   = qty × sellPriceQuote × fxPathSellToBase (trade asOf)
costReleasedBase = from CostBasisEngine (already in book base of lots; if lot book base differs from report base, convert with **locked lot baseCurrencyAtAcquisition** — do not revalue historical cost with today's FX)
realizedPnLBase = proceedsBase − costReleasedBase − feeEffectBaseOnSale

// Optional secondary split of realized (same convention):
// Treat costReleased as if marked at P0,FX0; decompose move from (P0,FX0) to (P_sell, FX_sell)
assetPriceEffectRealized = qty × (P_sell − P0) × FX0
fxEffectRealized         = qty × P_sell × (FX_sell − FX0)
// Identity: assetPriceEffectRealized + fxEffectRealized = proceedsBase − (qty×P0×FX0)
// Note: costReleasedBase may equal qty×P0×FX0 only under WA/lot consistent book; if fees capitalized, use engine cost
```

### Position-level unrealized (v1)

Per remaining qty (after FIFO/WA):

```text
valueBase = qty × P1 × FX1
costBase  = remaining costAtBookBase (immutable book)
unrealizedTotal = valueBase − costBase
assetPriceEffectBase = qty × (P1 − P0) × FX0
fxEffectBase = qty × P1 × (FX1 − FX0)
// Identity check: assetPrice + fx = unrealizedTotal when costBase = qty×P0×FX0
// If fees changed costBase, residual = unrealizedTotal − (assetPrice+fx) reported as costBasisResidualEffect
```

### Multiple acquisitions

- Apply algorithm **per lot** if FIFO/lot mode; sum effects.
- Weighted average mode: one synthetic pool with average P0/FX0 implied by `totalInvested/qty` and stored `acquisitionFx` policy:
  - **v1 WA:** store on pool `unitCostBase` only; set P0×FX0 ≡ unitCostBase / qty semantics as single unit cost base; assetPrice+FX split uses **current quote price** and **current vs acquisition-equivalent FX** where acquisition-equivalent FX is solved only if single-quote history exists; otherwise report **total unrealized** + fee effects without forced split (flag `attributionDegraded=true`).
- Prefer lot mode when multi-quote history matters for attribution.

### Transaction currency change over time

Each **leg** stores its own `currency`, `exchangeRateToBase` / path, `priceAsOf`.  
Attribution never assumes lifetime single quote currency; each disposal/mark uses that leg’s path.

### Partial sale

CostBasisEngine releases cost for disposed qty; attribution realized runs only on that qty; remainder keeps original lot anchors.

### External cash flow effect

```text
externalCashFlowEffectBase = contributions − withdrawals (base)
// Reported beside P&L; never added into realized/unrealized investment return
```

### Algorithm versioning

```text
attributionAlgorithmVersion: "v1"
// stored on report snapshot / operation engineVersions when materializing attribution
```

---

## P0-FINAL-006 — FX Conversion Path v1

### Rate observation record

```text
FxObservation {
  fromCurrency: string
  toCurrency: string
  rate: decimal string          // multiply: amount_to = amount_from × rate
  rateDirection: "from_to"     // v1 only this direction stored; inverse = 1/rate with rounding rule
  quoteConvention: "amount_from_times_rate"
  asOf: datetime | date        // market applicability
  source: string
  sourcePriority: number       // lower = preferred
  observationTime: datetime    // when captured
  validFrom?: datetime
  validTo?: datetime
}
```

### Path

```text
ConversionPath {
  legs: [{ from, to, rate, asOf, source }]
  intermediates: currency[]
}
amountOut = amountIn × Π rates(legs)
```

### Rules (LOCKED v1)

1. **Composition:** multiply leg rates in order; each leg already `from→to`.
2. **Inversion:** if only `B→A` stored, use `rate(A→B) = 1 / rate(B→A)` then **round once** with RoundingPolicy at end of path (or per RoundingPolicy.fxIntermediate — default: **round only final** to base minor unit).
3. **Missing direct pair:** build path via configured bridge graph (e.g. EUR→USD→IRR). Path selection: lowest max(sourcePriority), then fewest hops, then stable sort by intermediate currency code — **deterministic**.
4. **As-of:** each leg rate selected by Price/FX selection policy (P0-FINAL-008) at `fxAsOf`.
5. **Audit:** persist full `path[]` on operation when hops > 1 (P0-098).

### Acceptance

Same FxObservation snapshot + same path rules → identical composed rate for two implementers.

---

## P0-FINAL-007 — PriceSelectionPolicy v1

```text
PriceSelectionPolicy {
  mode: "FAIL" | "LAST_KNOWN_BEFORE_ASOF" | "MANUAL"
  // INTERPOLATE not allowed in v1 for financial marks
  allowStale: boolean
  staleMaxAge?: duration
  perAssetClassDefaults: { crypto, stock, fund_nav, metal, … }
}
```

| Mode | Behavior |
|------|----------|
| FAIL | valuation/query returns error/stale hard fail; no silent 0 |
| LAST_KNOWN_BEFORE_ASOF | latest observation with marketDate ≤ priceAsOf |
| MANUAL | only user-provided price rows |

**Forbidden:** using **today’s** price for a historical `priceAsOf` when an older observation exists or when mode is FAIL.

Default recommendation: marks `LAST_KNOWN_BEFORE_ASOF` + stale flag; strict audit reports may `FAIL`.

Per asset class override allowed; stored on ValuationContext or settings version.

---

## P0-FINAL-008 — FxSelectionPolicy v1

Same structure as price:

```text
FxSelectionPolicy {
  mode: "FAIL" | "LAST_KNOWN_BEFORE_ASOF" | "MANUAL"
  sourcePriorityOrder: string[]   // e.g. ["user_manual","central_bank","provider_x"]
  perPairOverrides?: …
}
```

For IRR pairs, source precedence is **versioned** (settings/schema), not hardcoded in Features.

Composition after each leg selected independently at `fxAsOf`, then P0-FINAL-006 composition.

---

## P0-FINAL-009 — Settlement T+n accounting

### Timeline (buy stock example)

| When | Position | Cash available | Payable/Receivable | Net Worth |
|------|----------|----------------|--------------------|-----------|
| **tradeDate** | Position ↑ (tradeDate recognition) | Optional reserve: available ↓ if broker blocks | **Broker payable ↑** (liability) for purchase amount + fees | Asset ↑ and liability ↑ → NW ≈ equity only change from fees/premium if any |
| **settlementDate** | unchanged | Cash ↓ (bank/broker cash) | Payable ↓ | NW unchanged by settlement itself (asset cash vs liability) |

### Journal sketch (v1)

```text
Trade date:
  Dr Equity asset (position control / investment)
  Cr Broker payable (settlement)

Settlement date:
  Dr Broker payable
  Cr Cash (fin_account)

```

Sell: receivable + position ↓ on tradeDate; cash on settlementDate.

### Metrics

| Metric | Definition |
|--------|------------|
| availableCash | cash balance − reserved for pending settlements (and similar holds) |
| committedCash | amounts in broker payable not yet settled |
| netWealth | assets (incl. position at valuation) − liabilities (incl. unsettled payables) |

### Settlement failure

```text
settlement_fail operation:
  reverse or adjust settlement intent
  may reverse trade if policy cancels (Core reverse chain)
  fees/penalties as separate ops
```

Never silently drop payable without operation.

See also Stocks ST-001, Settlement-Accounting.md.

---

## P0-FINAL-010 — Dividend journal flow v1

### Amounts

```text
grossDividend
withholdingTaxAmount
netCash = gross − withholding  (or explicit net)
```

### Dates

| Event | Date field | Recognition |
|-------|------------|-------------|
| Income recognition | `exDate` or `recordDate` per market policy (instrument/market rule) — **v1 Iran default: use provided `incomeRecognitionDate` on CA/dividend event** | Dr Dividend receivable / Cr Dividend income (gross) |
| Withholding | same recognition date | Dr Tax expense or Dr Tax receivable (policy); Cr Dividend receivable reduce **or** Cr Tax payable |
| Cash settlement | `paymentDate` / effectiveCashDate | Dr Cash; Cr Dividend receivable (net); withholding already accounted |

### v1 simplified journal (brokerage cash)

```text
On incomeRecognitionDate:
  Dr Broker receivable (gross)
  Cr Dividend income (gross)
  Dr Withholding tax expense (withholding)     // or receivable if reclaimable — flag reclaimableTax
  Cr Broker receivable (withholding)

On paymentDate:
  Dr Cash / broker cash (netCash)
  Cr Broker receivable (netCash)
```

Receivable residual after payment must be 0 for that event.

Gross income **not** recognized on paymentDate if recognition date is earlier — cash date ≠ income date when they differ.

---

## Status

| ID | Status |
|----|--------|
| P0-FINAL-005 | **LOCKED** Attribution Algorithm v1 |
| P0-FINAL-006 | **LOCKED** FX Conversion Path v1 |
| P0-FINAL-007 | **LOCKED** PriceSelectionPolicy v1 |
| P0-FINAL-008 | **LOCKED** FxSelectionPolicy v1 |
| P0-FINAL-009 | **LOCKED** T+n journal + metrics |
| P0-FINAL-010 | **LOCKED** Dividend journal + dates |

## P0-FINAL-005 — attributionStatus enum

```text
exact | degraded | unavailable
```

WA multi-quote without unique FX history: `attributionStatus=degraded`; dimension fields null; total P&L still exact.  
UI must not invent synthetic FX split. Full rules: `P0-COST-BASIS-PNL-001-005-LOCK.md`.
