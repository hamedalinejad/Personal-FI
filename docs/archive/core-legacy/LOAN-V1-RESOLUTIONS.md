> **SUPERSEDED as independent authority** — use docs/PRODUCT.md, ARCHITECTURE.md, FINANCIAL-CORE.md, DATA-MODEL.md, API.md, REPORTING.md, OFFLINE-RELEASE.md, DEVELOPMENT.md, modules/*.

# Loan v1 Master Resolutions

## Formula
`declining_balance` = **equal-principal** (`1.0.0-period_based-equal-principal`).  
Annuity text in older feature docs is a **v1 documentation defect** — do not implement annuity silently.

## Role
Only **`lent`** (Dr receivable / Cr cash) is RELEASE-supported.  
`borrowed` → `LOAN_ROLE_DEFERRED` until liability COA exists.

## Atomicity
create/pay/reverse use `withinTransaction` inside the same SQLite COMMIT as journal.

## Schema path
Prefer **extend schema via migrations** over silently shrinking the Loan contract.  
v1 columns on `ln_loans` / `ln_transactions` expanded for operation_id, portions, day_count, engine version.

## Day count
Only `period_based` for first vertical.


## Rate unit (FINAL)

API `annualRate` uses **percentage points**: `18` = 18%.  
Engine: `normalizeRatePercentage` → fractional `0.18` once, then internal math.

## Snapshot JSON (FINAL)

Canonical object with `engineVersion`, `dayCount`, `rate`, `rateInput`, `currency`, `residual`, `generatedAt`, `installments[]`.

## Create command (FINAL)

Required: operationId, role, principal, currency, annualRate, periods, method, startDate, businessDate, dayCount.  
No silent defaults. Multi-currency → LOAN_MULTI_CURRENCY_DEFERRED.

## Payment (FINAL)

Overpayment → OVERPAYMENT_NOT_SUPPORTED.  
Outstanding recalculated inside SQLite transaction.  
Double reverse → ALREADY_REVERSED.

## Annuity / non-v1 reference vectors (NOT runtime acceptance)

These are **periodic annuity (fixed-PMT)** reference numbers for a future engine version.
They must **not** be used as v1 equal-principal acceptance.

| Case | Annuity reference (non-v1) | Status |
|------|----------------------------|--------|
| 100m, 18%, weekly, 52 | ≈ 2,104,660.886 / payment | NON-V1 reference only; old ≈2,115,000 = STALE |
| 100m, 24%, quarterly, 8 | ≈ 16,103,594.265 | NON-V1 reference only |
| 50m, 18%, 45-day, 8 periods (365-day simple) | ≈ 6,890,118.148 | NON-V1; old ≈6,956,000 = STALE |
| 100m, 12%, monthly, 18 | ≈ 6,098,204.79 | NON-V1; ≈6,098,000 only as rounded prose |

## v1 equal-principal locked vectors (executable)

| Case | Input | Expected |
|------|-------|----------|
| Zero interest | P=1200, r=0%, n=12, declining | each principal=100, interest=0 |
| 12% annual monthly | P=1200, r=12, n=12 | interest 12…1; payments 112…101; total interest=78 |
| Flat 100000 @ 12% one-year | method=flat_rate | total interest=12000 before product duration rules |
| Qarz 4% fee on 100000 | if fee policy=4% of principal | fee=4000 |

Engine version: `1.0.0-period_based-equal-principal`
