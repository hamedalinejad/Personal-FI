# Tax

**Module owner.** Shared: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.
**Template reference:** [loan.md](./loan.md)

## 1. Purpose
Tax obligations and payment events separate from fees.

## 2. Scope
Personal offline edition; Core journal is cash/accounting truth.

## 3. Supported v1 behavior
TaxRecord = obligation · TaxEvent = assessment/payment/adjustment · paid only after payment operation

## 4. Unsupported / Deferred behavior
changeStatus(... paid) without payment op · feeTax confusion

## 5. Actors / roles
End user (book owner).

## 6. UI pages
Primary surface under product IA for Tax.

## 7. Sheets / drawers
Create / edit / detail sheets as product IA defines.

## 8. Entities
tax tables + journal for payments

## 9. Field ownership
Feature RAW fields owned here; journal owned by FINANCIAL-CORE.

## 10. Identity
Feature entity ids + operationId on mutations.

## 11. Commands
tax.assess · pay · adjust (as implemented)

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
This module owns tax; features must not invent tax legs silently

## 20. Accounting / journal mapping
Payment: Dr liability / Cr cash via Core

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
src/core/tax · acceptance tax/provenance-tax

## 34. Machine-file references
docs/core/db/schema.sql · registry · fixtures.
