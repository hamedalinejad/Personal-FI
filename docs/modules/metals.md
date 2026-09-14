# Metals

**Module owner.** Shared: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.
**Template reference:** [loan.md](./loan.md)

## 1. Purpose
Bullion/coin metals with purity, fine weight, premium/fee separation, delivery.

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
Premium often capitalized_cost; trade fee expense unless policy says otherwise

## 19. Tax behavior
No silent tax; tax module owns obligations when linked.

## 20. Accounting / journal mapping
All statement effects via Core journal.

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


## 29. Licensing / capabilities
Capability/license gates UI and commands only.

## 30. Edge cases
Missing rate/price → reject or mark missing; never zero-fill.

## 31. Error codes
VALIDATION_ERROR:* · OP_OPERATION_ID_REQUIRED · domain-specific codes.

## 32. Fixtures
STANDALONE-METALS · metals tests

## 33. Tests / proof
src/features/metals/tests

## 34. Machine-file references
docs/core/db/schema.sql · registry · fixtures.


### Physical fields
gross weight (quantityMg RAW) · purityRatio RAW · fineWeight DERIVED · optional serial/certificate/location · delivery fee ≠ trade fee.

### Holding identity (P0)
`platform_id + instrument_id + purity_ratio` — incompatible purities never share one aggregate row without an explicit product policy.

### Quote basis (required semantics)
| quoteBasis | pricePurityBasis | meaning |
|------------|------------------|---------|
| pure_metal | fine | price × fineWeightMg |
| gross_weight | gross | price × gross mg |
| coin_market / bar | explicit policy | no silent pure-metal derivation |

`priceUnit`: `per_mg` | `per_g`.

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


## 35. Implementer checklist (this module)
1. Read FINANCIAL-CORE (money, FX, journal, fee, reversal).
2. Read this module + `command-catalog.json` cards for each command.
3. Implement only `public-api` exports; UI calls public-api only.
4. Every mutation: normalize → validate → book base → FX → fees → domain → journal → invariants → one transaction.
5. Standalone: no imports from other `features/*` internals.
6. Prove with fixture/test before claiming GOLDEN/STANDALONE_GREEN.

## Fee defaults (v1 — LOCKED)
| Context | Default treatment |
|---------|-------------------|
| Premium / making | `capitalize_inventory` |
| Trade fee | `expense` |
| Delivery fee | `expense` (separate from acquisition cost unless policy capitalizes) |

`trade fee ≠ delivery fee`.

