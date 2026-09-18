# Funds

**Module owner.** Shared: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.
**Template reference:** [loan.md](./loan.md)

## 1. Purpose
Fund subscribe/redeem with NAV ≠ transaction price discipline.

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
subscribe · redeem · distribution · units + amount consistency

## 4. Unsupported / Deferred behavior
NAV as transaction price · silent fee path without Fee Engine when claimed integrated

## 5. Actors / roles
End user (book owner).

## 6. UI pages
Primary surface under product IA for Funds.

## 7. Sheets / drawers
Create / edit / detail sheets as product IA defines.

## 8. Entities
inv_fif_* / fund holdings & transactions · journal

## 9. Field ownership
Feature RAW fields owned here; journal owned by FINANCIAL-CORE.

## 10. Identity
Feature entity ids + operationId on mutations.

## 11. Commands
funds.subscribe · funds.redeem · funds.distribute

## 12. Queries
Queries: module-local reads where listed below; otherwise Core/Reporting readers only.

## 14. State machine
Posted vs voided via Core operation lifecycle.

## 15. Validation
Reject missing required fields; no silent financial defaults.

## 19. Tax behavior
No silent tax; tax module owns obligations when linked.

## 20. Accounting / journal mapping
All statement effects via Core journal.

## 21. Cost basis / valuation
Cost basis on units; NAV for valuation only

## 27. Reports
Module statements + REPORTING from journal.

## 30. Edge cases
Missing rate/price → reject or mark missing; never zero-fill.

## 31. Error codes
VALIDATION_ERROR:* · OP_OPERATION_ID_REQUIRED · domain-specific codes.

## 32. Fixtures
FUND-* fixtures · STANDALONE-FUND

## 33. Tests / proof
src/features/funds/tests

## 9.3 Pricing triad (LOCKED)

Never collapse:
```
NAV
transactionPrice
liquidationPrice
```

Pricing modes (explicit — no silent NAV→transactionPrice):
| Mode | Rule |
|------|------|
| explicit transaction price | required for cost |
| explicit nav mode | only when command says so |
| amount-based | units derived from amount ÷ transactionPrice |

NAV observation = **price observation** (`price_history` / asOf), never a transaction fact by itself.

## 9.4 Still required before Funds “complete”
| Topic | Status |
|-------|--------|
| redeem pricing contract | PARTIAL |
| distribution dates (ex / record / payment) | PARTIAL / document in card |
| reinvestment semantics | **DEFERRED** |
| tax on distribution | PARTIAL |
| management / brokerage / subscription / redemption fees | PARTIAL — Fee Engine treatments |
| current NAV as observation only | LOCKED direction |

Supported v1 mutations: `funds.subscribe` · `funds.redeem` · `funds.distribute`.
## 28. Standalone edition behavior (LOCKED)
**Funds-only** (fixed-income / mutual) without Accounts UI.

| Requirement | Rule |
|-------------|------|
| Pricing | NAV ≠ transactionPrice ≠ liquidationPrice |
| Commands | `funds.subscribe` · `funds.redeem` · `funds.distribute` |
| Cost | always transactionPrice (never silent NAV) |
| Reports | units · cost · TB subset |
| Forbidden | cross-feature internal imports |

Proof path: `src/features/funds/tests/standalone.test.js`

## Fee defaults (v1 — LOCKED)
| Context | Default treatment |
|---------|-------------------|
| Subscribe fee | `capitalize_inventory` |
| Redeem fee | `expense` |

Cost always uses **transactionPrice**, never silent NAV.

## Distribution / reinvestment contract (PARTIAL → must complete before RELEASE)
Command card / implementation must define:
```
ex-date · record-date · payment-date
cash distribution · reinvestment distribution
units created from reinvestment
transaction price for reinvestment
NAV observation (context only)
income vs return-of-capital treatment
tax treatment · fees
```
A boolean `reinvest?` alone is **not** a full economic contract.

Pricing lock remains: **NAV ≠ transactionPrice ≠ liquidationPrice**.

## liquidationPrice observation (LOCKED)
Canonical store for market/liquidity observations is **price_history** with `quote_type` including `liquidation` (extend enum when implemented).

| Concept | Store |
|---------|--------|
| NAV | price_history quote_type=`nav` and/or tx.nav as snapshot of observation used |
| transactionPrice | inv_fif_transactions.transaction_price (economic price of the op) |
| liquidationPrice | price_history quote_type=`liquidation` (or explicit command input required by card) |

Never copy NAV → transactionPrice or liquidationPrice silently.

## Price observations (LOCKED)
| Concept | Storage |
|---------|---------|
| NAV | price_history.quote_type = nav |
| liquidationPrice | price_history.quote_type = liquidation |
| transactionPrice | inv_fif_transactions.transaction_price only |

Never auto-copy between these three.


## funds.distribute v1 (LOCKED)

**Cash distribution only.**  
`reinvest` field: **REJECTED** at API boundary in v1 (do not accept).  
Full reinvest economics (ex/record/payment dates, units, transaction price, RoC) = **DEFERRED** until complete contract + golden.


## Queries (v1)
This package exposes **commands** via public-api. List/detail/holdings reads use **Core/Reporting readers**, not package-local query exports (`queries = {}` is intentional).


## Subscribe / redeem pricing (LOCKED)
**Subscribe:** `quantity` (alias `units`) required. Price modes:
- explicit `transactionPrice`
- `pricingMode=nav` + `nav` (never silent NAV)
- `pricingMode=amount_based` + `amount` (unit price = amount/qty)
Currency: `transactionCurrency` or `currency`.

**Redeem:** `units` + `currency` required; **`transactionPrice` OR `proceedsTotal`** (one required).
