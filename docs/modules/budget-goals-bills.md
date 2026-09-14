# Budget / Goals / Bills

**Module owner.** Shared: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.
**Template reference:** [loan.md](./loan.md)

## 1. Purpose
Planning layer: budgets, goals, recurring bills — **not** cash truth.

## 2. Scope
Personal offline edition; Core journal is cash/accounting truth.

## 3. Supported v1 behavior
Plan amounts · periods · optional link to actual operations after the fact

## 4. Unsupported / Deferred behavior
Using budget remaining as account balance · posting journal from forecast alone

## 5. Actors / roles
End user (book owner).

## 6. UI pages
Primary surface under product IA for Budget / Goals / Bills.

## 7. Sheets / drawers
Create / edit / detail sheets as product IA defines.

## 8. Entities
Feature tables + Core fin_operations / journal.

## 9. Field ownership
Feature RAW fields owned here; journal owned by FINANCIAL-CORE.

## 10. Identity
Feature entity ids + operationId on mutations.

## 11. Commands
budget.set · goal.create · bill.schedule (as implemented)

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
No automatic journal from plans; actual spend uses income-expense or feature ops

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
Plan vs actual reports are analytical; SoT remains journal for actuals


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

## Role
Planning projections and links only — **never** an alternate cash ledger.
## 28. Standalone edition behavior
Planning only — no journal truth. Full edition. Does not block standalone loan/investment editions.


## 35. Implementer checklist (this module)
1. Read FINANCIAL-CORE (money, FX, journal, fee, reversal).
2. Read this module + `command-catalog.json` cards for each command.
3. Implement only `public-api` exports; UI calls public-api only.
4. Every mutation: normalize → validate → book base → FX → fees → domain → journal → invariants → one transaction.
5. Standalone: no imports from other `features/*` internals.
6. Prove with fixture/test before claiming GOLDEN/STANDALONE_GREEN.

## Projection vs accounting (LOCKED)
Budget/goals/bills are **planning/projection only**.  
A projection **never** writes accounting truth until a financial command creates an operation/journal.

