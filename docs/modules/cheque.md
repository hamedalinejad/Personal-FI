# Cheque

**Module owner.** Shared: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.
**Template reference:** [loan.md](./loan.md)

## 1. Purpose
Cheque lifecycle with journal/cash impact on clear/bounce transitions.

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
| State | Meaning |
|-------|--------|
| issued/received | registered |
| deposited | in transit |
| cleared | cash effect |
| bounced/cancelled/returned | explicit transitions |

## 4. Unsupported / Deferred behavior
Implicit clear without operation · balance without journal

## 5. Actors / roles
End user (book owner).

## 6. UI pages
Primary surface under product IA for Cheque.

## 7. Sheets / drawers
Create / edit / detail sheets as product IA defines.

## 8. Entities
Feature tables + Core fin_operations / journal.

## 9. Field ownership
Feature RAW fields owned here; journal owned by FINANCIAL-CORE.

## 10. Identity
Feature entity ids + operationId on mutations.

## 11. Commands
cheque.register · deposit · clear · bounce · cancel (as implemented)

## 12. Queries
List / get / statement-style reads as applicable.

## Transition matrix (LOCKED)

| From | To | Status | Journal | operationId |
|------|-----|--------|---------|-------------|
| (new) | issued/received | SUPPORTED | forbidden | optional |
| issued/received | deposited | SUPPORTED | forbidden | optional |
| deposited | cleared | SUPPORTED | Dr Cash Cr Receivable | required |
| deposited | bounced | SUPPORTED | bounce journal | required |
| * | cancelled | SUPPORTED | none if never cleared | required if prior financial |
| cleared | rewrite | REJECTED | use reversal op only | required |

No DEFERRED/DEFERRED in implementation contracts.

## 14. State machine
issued/received → deposited → cleared | bounced | cancelled | returned

## 15. Validation
Reject missing required fields; no silent financial defaults.

## 19. Tax behavior
No silent tax; tax module owns obligations when linked.

## 20. Accounting / journal mapping
Clear/bounce create Core operations; cash only via journal

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
src/features/<name>/tests + acceptance as applicable.

## 28. Standalone edition behavior
Cheque ships with **Full**. No separate edition in v1. Journal legs via Core only.

## Transition accounting matrix (must be explicit)
| Transition | Informational only? | Payable/receivable reclass? | Cash movement? | Reversal/correction? |
|------------|---------------------|----------------------------|----------------|----------------------|
| issued/received → deposited | often no | DEFERRED | DEFERRED | no |
| → cleared | no | yes | yes (typical) | no |
| → bounced | no | yes | DEFERRED reverse prior | possible correction op |
| → cancelled | DEFERRED | yes | no new cash if never cleared | correction if needed |
| → returned | no | yes | DEFERRED | possible |

Each transition command card must mark which of the four columns apply. Pure status-only transitions that skip journal when cash actually moved are forbidden.

