# Loan (module owner)

**Status:** CURRENT

Shared: FINANCIAL-CORE · DATA-MODEL · API · REPORTING.

## 1. Purpose

Lender receivables: schedules, payments, journal integration.

## 2. Scope

role lender only; methods declining, flat, qarz, bullet; dayCount period_based; rate percentage points.

## 3. Non-Goals

Borrower path, actual/365, variable rate, annuity silent change.

## 4. User Stories

N/A or DEFERRED — do not invent.


## 5. Pages / Sheets / Drawers

N/A or DEFERRED — do not invent.


## 6. Entities

N/A or DEFERRED — do not invent.


## 7. Fields

principal, rate, method, schedule snapshot_json, role lender|borrower(deferred).

## 8. Field Kinds

N/A or DEFERRED — do not invent.


## 9. Field Ownership

N/A or DEFERRED — do not invent.


## 10. Commands

loan.create, recordPayment, reversePayment.

## 11. Queries

N/A or DEFERRED — do not invent.


## 12. API Input

N/A or DEFERRED — do not invent.


## 13. API Output

N/A or DEFERRED — do not invent.


## 14. Normalization

annualRate 12 → 0.12; feePercentPoints same; period count integer Decimal.

## 15. Validation

Reject variable rate / unsupported dayCount.

## 16. State Machine

Loan active → payments → closed; schedule snapshot versioned.

## 17. Accounting Effects

N/A or DEFERRED — do not invent.


## 18. Journal Effects

Create Dr receivable Cr cash; payment waterfall penalty→fee→interest→principal.

## 19. Cash Effects

CashSettlementPort.

## 20. Fee Effects

N/A or DEFERRED — do not invent.


## 21. Tax Effects

N/A or DEFERRED — do not invent.


## 22. FX Effects

N/A or DEFERRED — do not invent.


## 23. Date Semantics

N/A or DEFERRED — do not invent.


## 24. Identity

N/A or DEFERRED — do not invent.


## 25. Reversal / Correction

N/A or DEFERRED — do not invent.


## 26. Rebuild

Schedule from snapshotSchemaVersion + engine versions.

## 27. Reports

N/A or DEFERRED — do not invent.


## 28. Offline Behavior

N/A or DEFERRED — do not invent.


## 29. Standalone Edition

Loan-only reference vertical.

## 30. Licensing / Capabilities

N/A or DEFERRED — do not invent.


## 31. Edge Cases

N/A or DEFERRED — do not invent.


## 32. Errors

LOAN_* , LOAN_VARIABLE_RATE_UNSUPPORTED_V1.

## 33. Golden / Recovery Fixtures

LOAN-FLAT etc.; Decimal assertions.

## 34. Acceptance Criteria

Flat 12% on 1200 / 12m → interest 144; residual last row; atomic create.

### Extra edge
Overpayment: explicit policy (reject or prepay principal). Variable rate command must error LOAN_VARIABLE_RATE_UNSUPPORTED_V1.

## Formula table (v1)

| Method | Interest | Principal pattern |
|--------|----------|-------------------|
| declining | remaining × rateFraction / periodsPerYear | P/n equal + residual last |
| flat | P × rateFraction × years | amortize total/n |
| qarz | 0 | P/n; fee separate |
| bullet | per policy | principal at end |

rateFraction = annualRate_percentage_points / 100.

## Residual policy
Last installment adjusts principal portion so Σ principal portions = original principal exactly (Decimal).

## create atomic set
ln_loans + schedule snapshot + fin_operations + journal + optional fees in one transaction.
