# Fixed Income Funds Locks FI-001 … FI-010 (P0)

در تعارض با prose قدیمی Feature، این سند برنده است.

---

## FI-001 — NAV ≠ transactionPrice

| Field | Role |
|-------|------|
| `transactionPrice` | subscription/redemption (or trade) price user actually got — cost basis / realized |
| `nav` / `currentNAV` | fund NAV observation — valuation / unrealized |

Separate fields; never treat as interchangeable engines.

---

## FI-002 — ETF market price vs NAV

```text
valuationMode: 'nav' | 'market_last' | 'market_close' | 'manual' | …
```

ETF may value at market while NAV is still stored for reporting. Explicit mode on valuation/report query; default documented per fund type (ETF vs issuance/redemption).

---

## FI-003 — Distribution vs unrealized

Buckets must stay separate:

| Bucket | Source |
|--------|--------|
| Distribution / distributed income | dividend (cash) |
| Reinvested income | reinvest leg (see FI-004) |
| Unrealized NAV/market return | mark vs cost |
| Realized on units | redeem/sell vs averageBuyPrice |

**Forbidden:** summing distribution income into unrealized return as one number without labels (P0-059).

---

## FI-004 — Reinvest = one operation, two legs

```text
operationId shared:
  (1) income recognition leg (dividend / distribution)
  (2) acquisition leg (units from reinvest)
```

- **No** second bank cash movement for the same economic distribution when reinvested in-kind.
- Duplicate income+ cash deposit for same event = forbidden.

---

## FI-005 — Management fee treatment

Explicit `feeTreatment` / FeeTreatment mapping, e.g.:

- reduce NAV only (embedded; no user cash leg), or
- explicit fee expense / unit cancellation, or
- cash fee from account

Ambiguous “management fee” that sometimes hits cost basis and sometimes P&L without declaration = invalid. One economic effect (X-011).

---

## FI-006 — Subscription / redemption dates

Capture as applicable:

```text
applicationDate / tradeDate
settlementDate
navDate / priceAsOf
cutoff metadata (if fund rule)
```

Cash and unit recognition follow documented date roles (parallel to ST-001).

---

## FI-007 — predictedProfit

- `predictedProfit` / forecast = **EXTERNAL_REPORTED** or forecast metadata only.
- Never overwrite or substitute calculated economic P&L / distribution actuals.

---

## FI-008 — ETF brokerage cash

- ETF cash uses **shared** brokerage cash via CashSettlementPort / Stocks venue account.
- **Forbidden:** parallel `cashBalance` SoT inside FIF that drifts from broker ledger (P0-058).

---

## FI-009 — Historical NAV observations

```text
price_history / nav observations:
  value, priceAsOf | marketDate, source, quoteType='nav'|…, fetchedAt provenance
```

Immutable once stored; corrections via new observation or explicit amend policy — not silent overwrite of raw.

---

## FI-010 — Period return bridge

Period performance is **not** “current unrealized only”:

```text
openingValue
+ purchases / subscriptions (flows in)
- redemptions (flows out)
+ distribution income (cash)
± reinvest (units; income recognized per FI-004)
+ realized on disposals
+ closingValue − closingCost  (unrealized component)
```

Align with BATCH-2 §8 investment P&L bridge.

---

## Status

| ID | Status |
|----|--------|
| FI-001 … FI-010 | **LOCKED** 2026-09-02 |
