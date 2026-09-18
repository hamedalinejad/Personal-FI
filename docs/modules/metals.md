# Metals

**Module owner.** Shared: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.
**Template reference:** [loan.md](./loan.md)

## 1. Purpose
Bullion/coin metals with purity, fine weight, premium/fee separation, delivery.

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
| Item | Rule |
|------|------|
| quantityMg | canonical mass |
| purityRatio | required unless fixed_1 policy |
| fineWeight | DERIVED = qty × purity |
| premium vs fee | separate |
| delivery fee | ≠ trade fee; not auto-capitalize unless policy |
| gold_coin | own instrument identity |

## 4. Unsupported / Deferred behavior
Default purity=1 on non-pure · mixing coin with bullion price blindly

## 5. Actors / roles
End user (book owner).

## 6. UI pages
Primary surface under product IA for Metals.

## 7. Sheets / drawers
Create / edit / detail sheets as product IA defines.

## 8. Entities
inv_metals_* · platform scope · journal

## 9. Field ownership
Feature RAW fields owned here; journal owned by FINANCIAL-CORE.

## 10. Identity
Feature entity ids + operationId on mutations.

## 11. Commands
metals.buy · sell · delivery

## 12. Queries
List / get / statement-style reads as applicable.

## 14. State machine
Posted vs voided via Core operation lifecycle.

## 15. Validation
Reject missing required fields; no silent financial defaults.

## 19. Tax behavior
No silent tax; tax module owns obligations when linked.

## 20. Accounting / journal mapping
All statement effects via Core journal.

## 21. Cost basis / valuation
Per feature cost/valuation rules; snapshots not SoT.

## 27. Reports
Module statements + REPORTING from journal.

## 30. Edge cases
Missing rate/price → reject or mark missing; never zero-fill.

## 31. Error codes
VALIDATION_ERROR:* · OP_OPERATION_ID_REQUIRED · domain-specific codes.

## 32. Fixtures
STANDALONE-METALS · metals tests

## 33. Tests / proof
src/features/metals/tests

## Mass / purity (LOCKED)
```
quantityMg (canonical gross mass)
purityRatio
fineWeight = quantityMg × purityRatio
```
Preserve: gross · purity · fine · price basis (quoteBasis) · premium · trade fee · delivery fee · serial/certificate/location when supplied.
## Fee treatment (LOCKED)
- Core: `FEE_TREATMENT_REQUIRED` if treatment missing at Fee Engine.
- Module policy v1: trade fee → `expense`; premium → `capitalize_inventory` (alias of capitalized_cost).

## 9.4 Mass & quote (LOCKED)

Preserve separately:
```
gross mass (quantityMg)
purityRatio
fine weight
quoteBasis
priceUnit
premium
trade fee
delivery fee
serial
certificate
location
```

Dimensional rule:
```
fineWeight = grossMass × purityRatio
```

Coins: do **not** invent pure-metal valuation from fine weight unless policy explicitly permits analytical metal-equivalent mode (user-opt-in). Instrument carries canonical unit/valuation basis for coins.

Trade fee ≠ delivery fee. Delivery does not change acquisition cost unless policy capitalizes it.

Supported v1: `metals.buy` · `metals.sell` · `metals.delivery`.
## 28. Standalone edition behavior (LOCKED)
**Metals-only** (gold/silver/coins) without Accounts UI.

| Requirement | Rule |
|-------------|------|
| Mass | fineWeight = grossMass × purityRatio |
| Commands | `metals.buy` · `metals.sell` · `metals.delivery` |
| Fees | trade fee ≠ delivery fee |
| Reports | holdings by purity · TB subset |
| Forbidden | cross-feature internal imports |

Proof path: `src/features/metals/tests/standalone.test.js`

## Fee defaults (v1 — LOCKED)
| Context | Default treatment |
|---------|-------------------|
| Premium / making | `capitalize_inventory` |
| Trade fee | `expense` |
| Delivery fee | `expense` (separate from acquisition cost unless policy capitalizes) |

`trade fee ≠ delivery fee`.

## Serial / certificate / location field policy (LOCKED direction)
| Field | Kind | Identity? | After post | Export |
|-------|------|-----------|------------|--------|
| serial | RAW optional | no (provenance) | immutable if linked to posted delivery/buy | yes |
| certificate | RAW optional | no | immutable when posted | yes |
| location | RAW optional / updatable label | no | may update via non-financial command if policy allows | yes |

Coins: valuation from **instrument unit price**, not auto fine-metal derivation, unless explicit analytical `quoteBasis=metal_equivalent`.

## purity_ratio post rule (LOCKED — Option A)
At financial post:
```
if instrument.purityPolicy == fixed_1 → persist purity_ratio = "1"
else purity_ratio required (Decimal domain validation)
```
NULL purity is allowed only on non-posted drafts. Holding identity must not use NULL as a merge bucket.  
SQLite CHECK = structural sanity only; Decimal domain = financial truth.


## Queries (v1)
This package exposes **commands** via public-api. List/detail/holdings reads use **Core/Reporting readers**, not package-local query exports (`queries = {}` is intentional).


## Carrying currency (v1 LOCKED)
```
holding.cost_currency MUST equal transaction currency
```
Mismatch → `COST_CURRENCY_MISMATCH` reject.  
Multi-currency carrying / FX attribution on metals inventory = **DEFERRED**.
