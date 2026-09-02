# P0-FINAL-006 … 015 — Period return, field kinds, costCurrency, dates, T+n fee, selection

---

## P0-FINAL-006 — Period Return v1 (no double-count)

**Two separate outputs only.**

### Wealth bridge
```text
endWealth = startWealth
          + externalContributions
          - externalWithdrawals
          + investmentReturn
          + cashFxTranslation
          + liabilityFxTranslation
          + otherPolicyEffects
```

### Investment return bridge
```text
investmentReturn = realizedPnl
                 + unrealizedChange
                 + recognizedInvestmentIncome
                 - recognizedInvestmentExpenses
```

Asset price / FX decomposition = **child attribution** of these terms — **never** an extra top-level additive term alongside realized+unrealized+flows.

**Forbidden bridge (void):**
```text
start + purchases - sales + income + realized + unrealized + fees = end
```
(mixes flows and return components → double-count risk)

### Denominator-zero
```text
if periodReturnDenominator = 0 → status = undefined  (not Infinity / NaN)
```

**Acceptance:** contribution-only period → wealth Δ = external flow; investmentReturn = 0; period return = undefined if denom 0.

---

## P0-FINAL-007 — 036–040 file

Canonical index: **`P0-FINAL-036-040-LOCKS.md`** (exists). CODING-GATE must reference it.

---

## P0-FINAL-008 — Field Kind enum (single set)

```text
RAW | DERIVED | SNAPSHOT | EXTERNAL_REPORTED | LABEL | SYSTEM_INDEX
```

All of Field-Level-SoT, P1-GLOBAL §20.1, P0-015-020 matrices **must** use this exact set.  
`assetKey` / provider index helpers → **SYSTEM_INDEX** (not RAW identity).

---

## P0-FINAL-009 — costCurrency (global single rule)

```text
costCurrency = chosen at cost-pool creation
  default = baseCurrencyAtFirstCostBearingEvent
  immutable for that pool for its lifetime
future acquisitions into pool → converted into costCurrency at event
user later changes baseCurrency → does NOT rewrite pool costCurrency or historical amountInBase
```

Internal engine may *value* in user base for reports via FX; **book cost pool currency stays costCurrency**.

---

## P0-FINAL-010 — CR-005 C2C

```text
economic_trade_or_swap → destination basis from trade consideration (not transferredCost)
internal_transfer | same_owner_bridge → transferred / carried cost
```

See `P0-COST-BASIS-PNL-001-005-LOCK.md`.

---

## P0-FINAL-011 — businessDate storage

```text
DB businessDate = Gregorian DATE-only YYYY-MM-DD
UI display = Jalali and/or Gregorian by locale/profile
createdAt / eventAt / fetchedAt = UTC instants
```

Boundary: profile timezone local midnight → that Gregorian DATE.  
No alternate “civil calendar string” storage type.

---

## P0-FINAL-012 — T+n fee journal timing

At **trade date** (deterministic):

| Fee treatment | Journal at trade date |
|---------------|----------------------|
| capitalized | Dr security / carrying · Cr broker payable (or increase cost + payable) |
| fee expense | Dr fee expense · Cr broker payable |
| tax/withholding | tax event + payable/receivable per tax rules |

**Settlement date:** clears payable/receivable to cash only (no re-booking fee expense).  
Settlement failure: reverse/adjust **same intent lines** — no orphan payable.

---

## P0-FINAL-013 — Observation selection tie-break

For price and FX observations when multiple candidates apply:

```text
1. applicability timestamp (as-of match quality)
2. sourcePriorityRank (integer, lower = higher priority)
3. observationTime (fetchedAt / observedAt)
4. sourceId / providerId
5. stable observation id ASC
```

Persist selected observation IDs in calculation metadata.

---

## P0-FINAL-014 — sourcePriority representation

```text
sourcePriorityOrder = versioned ordered list of source ids (config)
sourcePriorityRank  = integer index derived from that order (0 = highest)
```

Comparisons **only** on `sourcePriorityRank`. Never compare a free-form numeric from one doc against a string array from another.

---

## P0-FINAL-015 — Snapshot / input status vocabulary

Canonical status set (price, FX, report snapshot, valuation):

```text
VALID
STALE
MISSING_INPUT
DEGRADED
FAILED
```

`attributionStatus` (exact|degraded|unavailable) remains the **P&L attribution** axis; map:
- exact → often accompanies VALID valuation
- degraded → DEGRADED
- unavailable → MISSING_INPUT or FAILED
