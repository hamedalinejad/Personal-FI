# Stocks (Iran)

**Module owner.** Shared: FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE.
**Template reference:** [loan.md](./loan.md)

## 1. Purpose
Iran equity trades with tradeDate vs settlementDate separation.

## 2. Scope
Personal offline edition; Core journal is cash/accounting truth.

## 3. Supported v1 behavior
| Item | Rule |
|------|------|
| buy/sell | implemented |
| settle | T+n payable/receivable |
| dividend | income journal |
| dates | trade ≠ settlement ≠ cash |


## 4. Unsupported / Deferred behavior
T+0 cash as if settled when settlement future · corporate actions full set until specified

## 5. Actors / roles
End user (book owner).

## 6. UI pages
Primary surface under product IA for Stocks (Iran).

## 7. Sheets / drawers
Create / edit / detail sheets as product IA defines.

## 8. Entities
inv_stocks_* · brokerage scope · journal

## 9. Field ownership
Feature RAW fields owned here; journal owned by FINANCIAL-CORE.

## 10. Identity
Feature entity ids + operationId on mutations.

## 11. Commands
stocks.buy · sell · settle · dividend

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
Fees via Fee Engine / FINANCIAL-CORE treatments.

## 19. Tax behavior
No silent tax; tax module owns obligations when linked.

## 20. Accounting / journal mapping
Trade: inventory vs payable; Settle: payable vs cash (FINANCIAL-CORE settlement)

## 21. Cost basis / valuation
WAC on disposal; valuation asOf

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
STANDALONE-STOCKS · stock-related fixtures

## 33. Tests / proof
src/features/stocks/tests

## 34. Machine-file references
docs/core/db/schema.sql · registry · fixtures.


### Settlement calendar (versioned)
- Current default: `iran-equity-T2-v2` — business days **Sat–Wed**; weekend **Thu–Fri** (TSE-oriented package).
- Legacy `iran-equity-T2-v1` (Fri–Sat skip) retained only for replay of ops that stored that version.
- Official holiday calendars must be data packages, not hard-coded Core constants beyond this deterministic weekend set.
- Every equity trade must persist `settlement_policy_version` with the op.

## Date fields (never collapse)
`tradeDate` · `settlementDate` · `cashDate` · `marketDate` · `priceAsOf` · `fxAsOf`  
Settlement uses versioned market calendar (Iran equity T+n). Corporate actions need explicit event semantics before production.

## Fee treatment (LOCKED)
- **Core** never invents treatment (`FEE_TREATMENT_REQUIRED` if missing at Fee Engine).
- **Module defaults** (applied in command before Core):
  - `stocks.buy`: omitted fee treatment → `capitalize_inventory`
  - `stocks.sell`: omitted fee treatment → `expense`
Sell persists `fee_commission`, `fee_tax`, `fee_other`, `fee_treatments_json` (no field loss).

## 9.2 Iranian stocks dates (LOCKED)

Must remain separate fields (never collapse):
```
tradeDate
settlementDate
cashDate
marketDate
priceAsOf
fxAsOf
settlement_policy_version
```

Semantics:
| Event | Effect |
|-------|--------|
| Trade | Position/quantity on **trade** semantics |
| Settlement | Cash / payable / receivable on **settlement** semantics |
| Cash date | Actual cash movement when different from settlement |

Calendar:
- Business days: **Sat–Wed**
- Weekend: **Thu–Fri**
- Policy is **data-driven / versioned** (`settlement_policy_version`); official holidays = versioned policy package, not hard-coded Core forever.
- Legacy calendar versions retained for deterministic replay.

## 9.3 Corporate actions — status
Schema may reserve a wide family. **None** of the following are RELEASE-PROVEN / complete command+fixture+rebuild contracts in v1:

bonus · split · reverse split · rights · rights exercise · rights sale · capital increase · merger · spin-off · symbol change · ISIN change · transfer

Do **not** call Stocks module complete until each **supported** action has: command card · fixture · rebuild path.

Supported v1 mutations: `stocks.buy` · `stocks.sell` · `stocks.settle` · `stocks.dividend` only.
## 28. Standalone edition behavior (LOCKED)
**Stocks-only** (Iran equity) without full Accounts navigation.

| Requirement | Rule |
|-------------|------|
| Dates | tradeDate ≠ settlementDate ≠ cashDate |
| Commands | `stocks.buy` · `stocks.sell` · `stocks.settle` · `stocks.dividend` |
| Settlement | T+n payable/receivable then settle |
| Reports | positions · dividends · TB subset |
| CA family | deferred until command+fixture+rebuild exist |
| Forbidden | cross-feature internal imports |

Proof path: `src/features/stocks/tests/standalone.test.js`


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
| Buy commission / tax / otherFee | `capitalize_inventory` |
| Sell commission / tax / otherFee | `expense` |

Override only with explicit `treatment` on CanonicalFeeEvent. Same fee vocabulary on buy and sell.

## Iran policy data (LOCKED approach)
| Layer | Rule |
|-------|------|
| Weekend / T+n engine | Versioned in `settlementPolicy` (`iran-equity-T2-v1` legacy Fri/Sat; `v2` Thu/Fri weekend) |
| Exchange holidays | **Machine policy package** (e.g. `iran-equity-calendar-YYYY-version.json`) — not hardcoded in Financial Core |
| Operation | Must persist `settlement_policy_version` used |
| Fee/tax percentages | Versioned **policy data** with effective dates — not frozen into Core |

## Corporate actions (v1)
All of the following are **DEFERRED** until command + fixture + rebuild exist:  
bonus · split · reverse split · rights · rights exercise · rights sale · capital increase · merger · spin-off · symbol change · ISIN change · transfer.  
Schema may reserve columns; reserved ≠ supported.

## Transaction date/context columns (LOCKED)
`inv_stocks_iran_transactions` persists:
```
trade_date · settlement_date · cash_date · market_date
price_as_of · fx_as_of · settlement_policy_version
```
Do not substitute trade_date for market_date. `settlement_policy_version` required when settlement engine is used.
