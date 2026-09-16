# Budget / Goals / Bills

**Module owner.** Shared: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.
**Template reference:** [loan.md](./loan.md)

## 1. Purpose
Planning layer: budgets, goals, recurring bills — **not** cash truth.

## Shared contracts
Money / FX / journal / fee / reversal / rebuild → [FINANCIAL-CORE.md](../FINANCIAL-CORE.md)  
API envelope / idempotency shape → [API.md](../API.md)  
Layers / public-api → [ARCHITECTURE.md](../ARCHITECTURE.md)  
Offline / backup / recovery → [OFFLINE-RELEASE.md](../OFFLINE-RELEASE.md)  
Process / freeze → [DEVELOPMENT.md](../DEVELOPMENT.md)  
Command cards → `docs/core/registry/command-catalog.json`

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

## 14. State machine
Posted vs voided via Core operation lifecycle.

## 15. Validation
Reject missing required fields; no silent financial defaults.

## 19. Tax behavior
No silent tax; tax module owns obligations when linked.

## 20. Accounting / journal mapping
No automatic journal from plans; actual spend uses income-expense or feature ops

## 21. Cost basis / valuation
Per feature cost/valuation rules; snapshots not SoT.

## 27. Reports
Plan vs actual reports are analytical; SoT remains journal for actuals

## 30. Edge cases
Missing rate/price → reject or mark missing; never zero-fill.

## 31. Error codes
VALIDATION_ERROR:* · OP_OPERATION_ID_REQUIRED · domain-specific codes.

## 32. Fixtures
fixtures/ and feature tests.

## 33. Tests / proof
src/features/<name>/tests + acceptance as applicable.

## Role
Planning projections and links only — **never** an alternate cash ledger.
## 28. Standalone edition behavior
Planning only — no journal truth. Full edition. Does not block standalone loan/investment editions.

## Projection vs accounting (LOCKED)
Budget/goals/bills are **planning/projection only**.  
A projection **never** writes accounting truth until a financial command creates an operation/journal.


## Planning vs cash (LOCKED)
Budget/goal/bill amounts are **planning projections**. They do not move journal cash. Earmark is LABEL/plan, not a second cash ledger. Forecast formulas DEFERRED until explicit contract + fixture.
