# Physical Assets

**Module owner.** Shared: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.
**Template reference:** [loan.md](./loan.md)

## 1. Purpose
Non-financial or physical asset register with optional valuation; not investment inventory.

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
| Command | effectClass | Journal |
|---------|-------------|---------|
| assets.register | master_data | forbidden |
| assets.update | master_data | forbidden |
| assets.acquire | financial | required (DEFERRED until card+fixture) |
| assets.dispose | financial | required (DEFERRED until card+fixture) |

v1 ships register/update as master_data only.

## 12. Queries
List / get / statement-style reads as applicable.

## 14. State machine
Posted vs voided via Core operation lifecycle.

## 15. Validation
Reject missing required fields; no silent financial defaults.

## 19. Tax behavior
No silent tax; tax module owns obligations when linked.

## 20. Accounting / journal mapping
assets.register = metadata only. Financial purchase/disposal only via assets.acquire / assets.dispose.

## 21. Cost basis / valuation
Valuation EXTERNAL_REPORTED / SNAPSHOT — not transaction cost rewrite

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
Physical assets ship with **Full** / More. Metals-only uses metals module for bullion/coins; general assets stay Full.

## Valuation model (LOCKED direction)
Track separately where applicable:
```
acquisition cost · improvements · maintenance · insurance
fair-value / manual valuation · impairment · disposal
```
Valuation snapshots are **never cash truth**. Cash only via journal operations.

