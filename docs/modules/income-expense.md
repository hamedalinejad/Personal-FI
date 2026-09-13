# Income / Expense

**Module owner.** Shared: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.
**Template reference:** [loan.md](./loan.md)

## 1. Purpose
Record income and expense events with categories; journal posts to Core.

## 2. Scope
Personal offline edition; Core journal is cash/accounting truth.

## 3. Supported v1 behavior
Income · expense · categories · optional recurring link to bills (planning only)

## 4. Unsupported / Deferred behavior
Using projections as cash truth · silent tax

## 5. Actors / roles
End user (book owner).

## 6. UI pages
Primary surface under product IA for Income / Expense.

## 7. Sheets / drawers
Create / edit / detail sheets as product IA defines.

## 8. Entities
inc_* / exp_* domain rows + fin_operations/journal

## 9. Field ownership
Feature RAW fields owned here; journal owned by FINANCIAL-CORE.

## 10. Identity
Feature entity ids + operationId on mutations.

## 11. Commands
income.create · expense.create · reverse (as implemented)

## 12. Queries
List / get / statement-style reads as applicable.

## 13. API contract
API.md envelope; decimal strings; operationId on mutations.

## 14. State machine
Posted vs voided via Core operation lifecycle.

## 15. Validation
Reject missing required fields; no silent financial defaults.

## 16. Money / quantity semantics
Decimal strings for money/qty; units explicit.

## 17. FX behavior
Non-base currency requires locked exchangeRateToBase (FINANCIAL-CORE).

## 18. Fee behavior
Fees via Fee Engine / FINANCIAL-CORE treatments.

## 19. Tax behavior
No silent tax; tax module owns obligations when linked.

## 20. Accounting / journal mapping
Dr/Cr per category and cash settlement accounts via Core

## 21. Cost basis / valuation
Per feature cost/valuation rules; snapshots not SoT.

## 22. Persistence impact
SQLite + feature tables inside atomic operation txn.

## 23. Transaction boundary
runAtomicFinancialOperation boundary.

## 24. Idempotency
operationId idempotency.

## 25. Reversal / correction
Reversal operation; no in-place rewrite of posted amounts.

## 26. Historical / asOf behavior
asOf queries rebuild from ledger; no live price required for history.

## 27. Reports
P&L via REPORTING; category activity queries

## 28. Standalone edition behavior
Standalone edition uses local settlement + Core; no second cash ledger.

## 29. Licensing / capabilities
Capability/license gates UI and commands only.

## 30. Edge cases
Missing rate/price → reject or mark missing; never zero-fill.

## 31. Error codes
VALIDATION_ERROR:* · OP_OPERATION_ID_REQUIRED · domain-specific codes.

## 32. Fixtures
fixtures/ and feature tests.

## 33. Tests / proof
src/features/<name>/tests + acceptance as applicable.

## 34. Machine-file references
docs/core/db/schema.sql · registry · fixtures.
