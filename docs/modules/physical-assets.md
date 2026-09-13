# Physical Assets

**Module owner.** Shared: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.
**Template reference:** [loan.md](./loan.md)

## 1. Purpose
Non-financial or physical asset register with optional valuation; not investment inventory.

## 2. Scope
Personal offline edition; Core journal is cash/accounting truth.

## 3. Supported v1 behavior
Register · ownership · condition · valuation note · documents link

## 4. Unsupported / Deferred behavior
Treating physical asset value as journal cash · silent depreciation without policy

## 5. Actors / roles
End user (book owner).

## 6. UI pages
Primary surface under product IA for Physical Assets.

## 7. Sheets / drawers
Create / edit / detail sheets as product IA defines.

## 8. Entities
Feature tables + Core fin_operations / journal.

## 9. Field ownership
Feature RAW fields owned here; journal owned by FINANCIAL-CORE.

## 10. Identity
Feature entity ids + operationId on mutations.

## 11. Commands
asset.register · update · dispose (as implemented)

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
Purchase/disposal may post journal when treated as financial events; otherwise metadata-only

## 21. Cost basis / valuation
Valuation EXTERNAL_REPORTED / SNAPSHOT — not transaction cost rewrite

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
Module statements + REPORTING from journal.

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
