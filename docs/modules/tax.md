# Tax

**Module owner.** Shared: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.
**Template reference:** [loan.md](./loan.md)

## 1. Purpose
Tax obligations and payment events separate from fees.

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

## 14. State machine
Posted vs voided via Core operation lifecycle.

## 15. Validation
Reject missing required fields; no silent financial defaults.

## 19. Tax behavior
This module owns tax; features must not invent tax legs silently

## 20. Accounting / journal mapping
Payment: Dr liability / Cr cash via Core

## 21. Cost basis / valuation
Per feature cost/valuation rules; snapshots not SoT.

## 27. Reports
Module statements + REPORTING from journal.

## 30. Edge cases
Missing rate/price → reject or mark missing; never zero-fill.

## 31. Error codes
VALIDATION_ERROR:* · OP_OPERATION_ID_REQUIRED · domain-specific codes.

## 32. Fixtures
fixtures/ and feature tests.

## 33. Tests / proof
src/core/tax · acceptance tax/provenance-tax

## Tax vs fee (LOCKED)
Tax is separate from fee. Status `paid` is allowed only after a successful **payTax** operation with journal legs — never a free status mutation.
## 28. Standalone edition behavior
Tax ships with **Full**. `tax.pay` is the only path to paid. Standalone investment editions may omit Tax UI.

## Jurisdiction policy (LOCKED)
Core tax engine is **generic** (assess → obligation → payTax → journal → paid).  
Iran-specific rates/calendars/rules live in **versioned module/policy data**, not hardcoded Financial Core.

## Obligation vs payment (LOCKED)
| Field | Meaning |
|-------|---------|
| tax_events.source_operation_id | source obligation op |
| tax_events.payment_operation_id | tax.pay only |
| tax_records.payment_operation_id | payTax path |
| paid | DERIVED from posted payments |

operation_id on tax_events is LEGACY alias of source_operation_id.
