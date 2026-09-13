# Accounts

**Module owner.** Shared: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.
**Template reference:** [loan.md](./loan.md)

## 1. Purpose
Operational cash/bank/card accounts as projections over Core journal — not a second cash truth.

## 2. Scope
Personal offline edition; Core journal is cash/accounting truth.

## 3. Supported v1 behavior
| Item | Rule |
|------|------|
| accountClass (fin) | asset/liability/equity/income/expense |
| cashAccountKind (acc) | cash/bank/card/... operational kinds |
| balance | **DERIVED from journal** |
| transfer/deposit/withdraw | Core operations |


## 4. Unsupported / Deferred behavior
Parallel cash ledgers · treating acc balance as SoT · silent currency default

## 5. Actors / roles
End user (book owner).

## 6. UI pages
Accounts list · account detail · transfer

## 7. Sheets / drawers
Create / edit / detail sheets as product IA defines.

## 8. Entities
`acc_accounts` · related links · Core `fin_accounts` / journal

## 9. Field ownership
| Field | Kind |
|-------|------|
| name, kind, currency | RAW |
| balance | DERIVED |
| fin_account mapping | REFERENCE |


## 10. Identity
Feature entity ids + operationId on mutations.

## 11. Commands
account.create · update · archive · transfer · deposit · withdraw (as implemented)

## 12. Queries
List / get / statement-style reads as applicable.

## 13. API contract
API.md envelope; decimal strings; operationId on mutations.

## 14. State machine
active → archived (archive only if journal balance zero)

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
Transfers: balanced journal legs in settlement accounts; no domain cash table as truth

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
Other features may use local settlement without Accounts UI

## 29. Licensing / capabilities
Capability/license gates UI and commands only.

## 30. Edge cases
Missing rate/price → reject or mark missing; never zero-fill.

## 31. Error codes
VALIDATION_ERROR:* · OP_OPERATION_ID_REQUIRED · domain-specific codes.

## 32. Fixtures
Feature tests under accounts when present; Core journal fixtures

## 33. Tests / proof
Accounting/chart tests in src/core/accounting

## 34. Machine-file references
docs/core/db/schema.sql · registry · fixtures.
