> **SUPERSEDED as independent authority** — use docs/PRODUCT.md, ARCHITECTURE.md, FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, DEVELOPMENT.md, modules/*.

# Loan / Accounting / Offline Lock

## LOAN-001 — Role vocabulary

Canonical SQL + runtime:

```
role ∈ { borrower, lender }
```

API aliases: `borrowed` → `borrower`, `lent` → `lender` via `normalizeLoanRole`.  
v1 release path: **lender** (receivable) only unless liability COA proven.

## LOAN-002 — Schedule snapshot schema

```json
{
  "snapshotSchemaVersion": "1.0.0",
  "engineVersion": "1.0.0-period_based-equal-principal",
  "calendarVersion": "none",
  "roundingVersion": "money2-half-up",
  "rateVersion": "pct-points-annual",
  "method": "declining_balance",
  "startDate": "YYYY-MM-DD",
  "dayCount": "period_based",
  "rows": [ { "period": 1, "payment": "...", "principal": "...", "interest": "..." } ]
}
```

Validate with `wrapScheduleSnapshot` / `parseScheduleSnapshot` before persist.

## LOAN-003 — Fee tier policy

Prefer:

```
calculation_method, calculation_base, rate, fixed_amount, min_amount, max_amount,
period, application_moment, priority
```

`rate_or_amount` is **legacy**; do not invent new meanings by fee_kind alone.

## LOAN-004 — Early settlement matrix (v1)

| method | earlyPaymentMode | rateType | feePolicy | graceState | effect |
|--------|------------------|----------|-----------|------------|--------|
| declining_balance | reduce_principal | fixed | none | none | apply waterfall; residual schedule unchanged periods |
| declining_balance | reamortize | fixed | none | none | **DEFERRED** — reject or explicit reschedule op |
| any | * | variable | * | * | **DEFERRED** until rate-history engine |
| flat_rate | reduce_principal | fixed | none | none | waterfall; no silent interest rebate unless policy |
| qarz | reduce_principal | n/a | service_fee | none | principal only + separate fee |

## LOAN-005 — Outstanding reconstruction

```
principalOutstanding = principal − Σ principal_portion (non-reversed)
interestOutstanding  = scheduled interest − Σ interest_portion
feeOutstanding       = amount_due − amount_paid − amount_waived
penaltyOutstanding   = same pattern
```

Never use a boolean `paid` flag as SoT.

---

## ACCOUNTING-001 — Account code

```
UNIQUE(code) WHERE code IS NOT NULL
```

(index `uq_fin_accounts_code`)

## ACCOUNTING-002 — Pre-commit journal balance

1. Normalize decimal strings  
2. Convert each line to base with locked rates (amount_in_base)  
3. `sumDecimalStrings` / Decimal sum debit vs credit  
4. Exact equality  
5. Reject **before** COMMIT  
6. Optional non-financial audit only if policy allows  

## ACCOUNTING-003 — Aggregation helper

All report/financial aggregation: `sumDecimalStrings` from `canonicalDecimal.js`.  
No feature-local loops over parseFloat.

## ACCOUNTING-004 — Reversal identity

```
SoT: fin_operations.reverses_operation_id (+ corrects_operation_id)
```

Feature `reverses_*_id` columns = **convenience projections** only.

---

## OFFLINE-001 — Browser adapter

Status: `PROTOCOL_PROVEN_NODE_HARNESS` (`sqlJsIndexedDbAdapter.js`).  
Full in-browser sql.js + IndexedDB binary still required for RELEASE-PROVEN multi-tab proof.

## OFFLINE-002 — State vocabularies

| Layer | Values |
|-------|--------|
| Business (`fin_operations.status`) | draft \| posted \| voided \| failed |
| Durability (db_meta / durability_state) | pending \| sql_committed \| persisted \| persist_failed |
| Transport (internal only) | temp_written \| swapped — **never** public API |

## OFFLINE-003 — price_history uniqueness

```
UNIQUE(instrument_id, market_date, source_id, quote_type)
UNIQUE(instrument_id, market_date, quote_type) WHERE source_id IS NULL
```

## OFFLINE-004 — Wallet primary address

```
UNIQUE(network_id) WHERE is_primary = 1
```
