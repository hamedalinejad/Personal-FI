# Funds

**Module owner.** Shared: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.
**Template reference:** [loan.md](./loan.md)

## 1. Purpose
Fund subscribe/redeem with NAV ≠ transaction price discipline.

## 2. Scope
Personal offline edition; Core journal is cash/accounting truth.

## 3. Supported v1 behavior
subscribe · redeem · distribution (as implemented) · units + amount consistency

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
List / get / statement-style reads as applicable.

## 13. API contract
API.md envelope; decimal strings; operationId on mutations.

## 14. State machine
Posted vs voided via Core operation lifecycle.

## 15. Validation
Reject missing required fields; no silent financial defaults.

## 16. Money / quantity semantics
units decimal; amount and transactionPrice consistency checks

## 17. FX behavior
Non-base currency requires locked exchangeRateToBase (FINANCIAL-CORE).

## 18. Fee behavior
Fees via Fee Engine / FINANCIAL-CORE treatments.

## 19. Tax behavior
No silent tax; tax module owns obligations when linked.

## 20. Accounting / journal mapping
All statement effects via Core journal.

## 21. Cost basis / valuation
Cost basis on units; NAV for valuation only

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
FUND-* fixtures · STANDALONE-FUND

## 33. Tests / proof
src/features/funds/tests

## 34. Machine-file references
docs/core/db/schema.sql · registry · fixtures.


### Price fields
NAV · transactionPrice · liquidationPrice are distinct. **NAV must never** auto-fill transaction or liquidation price.
Distribution vs reinvestment: explicit commands; cash vs units effects via journal.

### Pricing modes (P0)
- Explicit `transactionPrice`, or `pricingMode=nav` with nav, or `pricingMode=amount_based` with amount.
- **Silent NAV → transactionPrice is forbidden** (`FUND_TRANSACTION_PRICE_REQUIRED`).

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
| reinvestment semantics | PARTIAL |
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
| Subscribe fee | `capitalize_inventory` |
| Redeem fee | `expense` |

Cost always uses **transactionPrice**, never silent NAV.

