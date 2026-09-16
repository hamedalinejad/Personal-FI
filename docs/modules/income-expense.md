# Income / Expense

**Module owner.** Shared: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.
**Template reference:** [loan.md](./loan.md)

## 1. Purpose
Record income and expense events with categories; journal posts to Core.

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

## 14. State machine
Posted vs voided via Core operation lifecycle.

## 15. Validation
Reject missing required fields; no silent financial defaults.

## 19. Tax behavior
No silent tax; tax module owns obligations when linked.

## 20. Accounting / journal mapping
Dr/Cr per category and cash settlement accounts via Core

## 21. Cost basis / valuation
Per feature cost/valuation rules; snapshots not SoT.

## 27. Reports
P&L via REPORTING; category activity queries

## 30. Edge cases
Missing rate/price → reject or mark missing; never zero-fill.

## 31. Error codes
VALIDATION_ERROR:* · OP_OPERATION_ID_REQUIRED · domain-specific codes.

## 32. Fixtures
fixtures/ and feature tests.

## 33. Tests / proof
src/features/<name>/tests + acceptance as applicable.

## Fields
category · counterparty? · account · currency · FX · attachment · recurrence · source · reversal  
Journal is the financial truth.
## 28. Standalone edition behavior
Income/Expense ship with **Full** (and money surfaces). Not a separate licensed vertical in v1; always uses Core journal.

## Completion checklist (Full edition)
Must specify before RELEASE for this module:
- category ownership · payee/counterparty
- recurring rule vs actual transaction
- attachment/document lineage · tax linkage
- source/provenance · reversal · import dedupe

UI: sheets under `/money` and `/transactions` only — no extra routes.


## Recurrence (LOCKED)
`planned recurring item ≠ actual financial operation`.  
Occurrence generation creates draft/plan rows; posting creates fin_operations + journal. Never auto-post from recurrence without explicit user/system post command.
