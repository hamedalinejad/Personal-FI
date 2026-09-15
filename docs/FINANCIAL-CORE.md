# FINANCIAL-CORE (sole finance owner)

**Status:** CURRENT

Absorbs: Accounting-Core, Accounting-Calculation-Invariants, Financial-Invariants, Canonical-Financial-Operation, Canonical-Cash-Model, Fee-Treatment-Matrix, Cost-Basis-Engine, Money-Decimal-Policy, Precision-Policy, Unit-Policy, JSON-Policy, Date-Semantics-Matrix, Rebuild-API-Contract, Reconciliation-Order, Opening-Balance, Reversal specs, Journal contracts.

## Formula index (quick reference)
| Topic | Rule |
|-------|------|
| Money | API/DB decimal **strings**; arithmetic Decimal.js; never JS Number |
| FX | `amountInBase = amount × exchangeRateToBase` |
| Book base | `db_meta.book_base_currency` default **IRR** |
| Journal | `Σ debit(base) = Σ credit(base)`; posted ≥ 2 lines |
| Fee | treatment required (or explicit module default); Fee Engine only |
| Cost basis | WAC v1; disposal releases quantity + carrying |
| Reversal | new operation + inverse journal + link; no in-place edit |
| Tax paid | only after `tax.pay` + journal |
| Metals | `fineWeight = grossMass × purityRatio` |
| Loan declining | equal-principal; `rateFraction = annualRate/100` |
| Loan pay waterfall | penalty → fee → interest → principal |
| Toman | display only; ledger = IRR |


## 1. Money & Decimal
- All money, quantity, rate, price: **decimal strings** in API and DB.
- Arithmetic: Decimal library only — never IEEE float for financial truth.
- Display rounding ≠ storage precision; last residual may absorb display gaps when policy says so.

## 2. Units
- Currency codes explicit (IRR ledger storage; Toman is presentation only).
- Quantity units explicit (e.g. mg for metals, shares, crypto base units).
- Rates: percentage points (`12` → 0.12) unless labeled otherwise.

## 3. JSON policy
- Financial payloads use decimal strings, not JSON numbers, for money fields.
- `undefined` in arrays rejected in canonical serialization (no silent null).

## 4. Cash truth
```
CASH IS DERIVED FROM CORE JOURNAL TRUTH.
```
`fin_journal_lines` + `fin_accounts` are cash/accounting SoT. Feature balances are projections.

## 5. Operation
- Identity: `operationId` globally stable in DB scope.
- Status: `draft | posted | voided | failed` (business).
- Durability: separate `pending | sql_committed | persisted | persist_failed`.
- Economic identity hash: type, dates, settlementDate, eventAt, provenance, amounts, accounts, rates, journal legs.
- Caller-supplied hash must match recomputed hash.
- One operation may create 1..N journal entries when policy requires (never assume 1:1 unless stated).

## 6. Journal pre-commit
1. Normalize decimal strings  
2. Account identity + currency match  
3. FX → `amount_in_base`  
4. Sum debits/credits in base (Decimal)  
5. Exact equality or reject  
6. Commit  

Posted lines require `amount_in_base`; non-base requires `exchange_rate_to_base`.

## 7. Fee
CanonicalFeeEvent:
- money: `feeAmount`, `feeCurrency`, `feeExchangeRateToBase?`
- quantity (only `reduce_received_quantity`): `feeQuantity`, `feeQuantityUnit?`, `feeInstrumentId`
- `treatment` **required** in Core (`FEE_TREATMENT_REQUIRED` if missing)

Canonical treatments only:
```
expense | capitalize_inventory | reduce_proceeds | reduce_received_quantity | embedded_in_gross_cash | equity_adjustment
```
API aliases (normalize only): `capitalized_cost` → capitalize_inventory · `fee_from_received` → reduce_received_quantity · `from_cash` → embedded_in_gross_cash.  
Never subtract monetary `feeAmount` from asset quantity. One treatment per event. Feature selects policy; Core applies.

## 8. Cost basis
WAC v1 unless module policy says otherwise. Cost pool currency must be consistent (transaction vs base) per module. Disposal reduces quantity and carrying.

## 9. Dates
Distinct when meaning differs: `businessDate`, `tradeDate`, `settlementDate`, `eventAt`, `marketDate`, `priceAsOf`, `fxAsOf`.  
Stocks: position on tradeDate; cash on settlementDate.

## 10. FX
`exchangeRateToBase` = base per 1 transaction unit.  
`amountInBase = amount × rate` (Decimal).  
Historical rebuild never uses “latest now”. Missing rate → fail closed (no zero).

## 11. Opening balance
Controlled financial operation with provenance — not silent property write.

## 12. Reversal
Core link: `originalOperationId → reversalOperationId`. Inverse journal. Feature reverse ids are convenience only. No in-place overwrite of posted amounts.

## 13. Rebuild
`same ledger + engineVersions + asOf/context → same output`. No live provider in historical path.

## 14. Reconciliation order
Local intent → journal → positions/holdings rebuild → external broker state (when integrated) → differences classified.

## 15. Domain locks (summary)
- **Stocks T+n:** trade posts inventory vs payable; settle posts payable vs cash.  
- **Tax:** paid only after payTax operation.  
- **Metals:** purity RAW; fineWeight DERIVED; delivery fee ≠ trade fee by default.  
- **Crypto economic_kind:** acquisition|disposal|transfer_internal|swap_economic|fee|income|adjustment (not tx_type).  
- **Funds:** NAV ≠ transactionPrice ≠ liquidationPrice.  

## 16. Loan math (v1)
rateFraction = annualRate/100. Methods: declining, flat, qarz, bullet. dayCount period_based. Variable rate rejected. Residual last row conserves principal.

## 17. Machine proof
schema.sql · fixtures · tests · scheduleEngine · operationEngine · worker.


## Money / unit table (global)
| Type | API/DB | Arithmetic | Notes |
|------|--------|------------|-------|
| money | decimal string | Decimal | currency required |
| quantity | decimal string | Decimal | unit required |
| price | decimal string | Decimal | per unit |
| rate (FX) | decimal string | Decimal | base per 1 txn unit |
| percentage | decimal string points | /100 for fraction | e.g. 12 → 12% |
| weight | decimal string | Decimal | e.g. mg |
| purity | decimal string | Decimal | (0,1] |
| fine weight | DERIVED | qty × purity | not RAW input |

No IEEE float in domain logic.

## FX
`exchangeRateToBase` = base units per 1 transaction-currency unit.  
`amountInBase = amount × exchangeRateToBase`.  
Historical rebuild uses **stored** rates, never “latest now”. Missing rate → fail-closed.


## Deterministic rebuild
```
rebuild(asOf, engineVersions, sourceLedger) → projections
```
Same ledger + same engineVersions + same asOf/context ⇒ same output.  
No live provider calls during historical reconstruction.

## Book base currency (P0)
- Canonical book base from `db_meta.book_base_currency` (product default **IRR**).
- `resolveBookBaseCurrency` never defaults book base to transaction currency.
- Cross-currency writes require `exchangeRateToBase`; `amountInBase = amount × rate`.

## 20. Final calculation / ledger grammar (LOCKED)

### 20.1 Monetary representation
| Layer | Rule |
|-------|------|
| API | decimal **string** |
| DB | TEXT decimal |
| Arithmetic | Decimal.js only |
| Forbidden | JavaScript `Number` for money/quantity/rate/price |

### 20.2 Base conversion
```
exchangeRateToBase = base units per 1 transaction-currency unit
amountInBase = amount × exchangeRateToBase
```
- Base currency line: `exchangeRateToBase = 1`, `amountInBase = amount`.
- Non-base posted line: rate **mandatory**.
- Historical path: rate carries as-of / source / context when reproducibility matters.

### 20.3 Journal balance
Posted operation:
```
Σ debit(amountInBase) = Σ credit(amountInBase)
```
Exact Decimal equality after policy rounding. No ad-hoc tolerance unless explicitly specified with mathematical justification.

### 20.4 Accounting SoT
```
fin_accounts + fin_journal_entries + fin_journal_lines
```
Feature cash balances are **projections only**.

### 20.5 Operation identity
```
operationId + canonical economic hash
```
| Case | Result |
|------|--------|
| Same ID + same economics | idempotent replay |
| Same ID + different economics | conflict |

### 20.6 Reversal
No in-place rewrite of posted amounts. Correction = **new** operation linked to original + inverse journal legs.

### 20.7 Book base currency
Book base is authoritative (`db_meta` / settings). Commands must not default base to transaction currency. Use `resolveBookBaseCurrency`.

## 21. Fee capitalization journal rule
If `feeTreatment = capitalize_inventory` (or equivalent), Fee Engine **must** emit balanced journal legs (e.g. Dr inventory / Cr cash or payable). Subledger cost change without journal legs is forbidden.

## 22. Rounding policy table (v1)
| Context | Rule |
|---------|------|
| Money storage | full decimal string; no silent float |
| Loan schedule intermediate | Decimal; residual absorbed on final period |
| Display | presentation only; does not rewrite stored values |
| Journal balance | exact equality in base after conversion |

## 30. Hard accounting rules (LOCKED — never dilute)

| Rule | Statement |
|------|-----------|
| A | Posted journal: Σ debit(amountInBase) = Σ credit(amountInBase) exact Decimal |
| B | Non-base posted line: amountInBase + exchangeRateToBase required |
| C | No IEEE float for money/qty/rate/price |
| D | Posted amounts immutable; correction = new op + inverse legs + link |
| E | Cash derives from journal only |
| F | Feature cash cache never SoT |
| G | Historical rebuild never calls “latest” provider |
| H | No silent zero-fill of financial values |
| I | Book base from db_meta/settings — never default to transaction currency |

### SoT split
- **Accounting:** fin_accounts + fin_journal_entries + fin_journal_lines  
- **Operation:** operationId · commandHash · status · durability_state (independent axes)  
- **FX:** amountInBase = amount × exchangeRateToBase  
- **Fees:** every event states economic meaning + cash effect + carrying/P&L effect  
- **Cost basis WAC v1:** deterministic, reversible, asOf-reproducible  
- **Dates never collapsed:** businessDate · tradeDate · settlementDate · cashDate · eventAt · marketDate · priceAsOf · fxAsOf

## FX observation resolver (LOCKED)
Table: `cur_exchange_rates` with unique observation key `(from_currency, to_currency, as_of, ifnull(source,''))`.

Resolver (implementation: `src/core/domain/fx/resolveStoredRate.js`):
1. `from == to` → rate `"1"` (identity)
2. require `asOf` (historical path never uses wall-clock "latest now")
3. candidates: `as_of <= requested asOf`
4. order: `source_priority ASC`, then `as_of DESC`
5. if `is_stale=1` and `allowStale=false` → fail closed (`FX_RATE_STALE`)
6. if no candidate → `FX_RATE_NOT_FOUND`

`post_state` on `fin_journal_entries` is a **cache** of `fin_operations.status`. Reports must filter on `fin_operations.status = 'posted'`, never on `post_state` alone.

Legacy column `fin_operations.source` is **non-authoritative**; writers leave it NULL. Use `source_channel` + `source_type` + `source_reference`.

## Category hierarchy
`cat_categories.parent_id` must not form a cycle (`assertNoCategoryCycle`).

## 40. Pre-code accounting locks (single owner — never fork)

### 8.1 Journal
```
Σ debit(amountInBase) = Σ credit(amountInBase)
```
Exact Decimal equality after conversion/rounding policy. Posted ops require ≥ 2 lines.

### 8.2 FX
```
amountInBase = amount × exchangeRateToBase
```
`exchangeRateToBase` = base units per 1 transaction unit. Historical rates via `resolveStoredRate(asOf)` — never wall-clock latest.

### 8.3 Base currency
Book base from `db_meta.book_base_currency` (product default **IRR**).  
Transaction currency must **never** silently become book base.

### 8.4 Fees
Every fee event must state:
```
economic meaning · cash effect · P&L/carrying effect · currency · amount|quantity · treatment
```
Core rejects missing treatment (`FEE_TREATMENT_REQUIRED`). Module defaults must be explicit and versioned.

### 8.5 Cost basis
WAC v1: deterministic, versioned, reversible, asOf-reproducible; quantity and carrying conservation tested.

### 8.6 Reversal
Never mutate posted historical amounts. Correct only by:
```
new operation + inverse journal + link to originalOperationId
```

### 8.7 Tax
Tax cannot become paid by status mutation alone:
```
assessment → payable/obligation → tax.pay operation → journal → paid
```

### Relationship (accounting truth)
```
fin_operations → fin_journal_entries → fin_journal_lines → fin_accounts
```
Feature transactions link via `operationId`. Holdings are rebuildable projections — not unaudited cost SoT.

## Core relationship (LOCKED)
```
fin_operations
    ↓
fin_journal_entries
    ↓
fin_journal_lines
    ↓
fin_accounts
```
Feature event → `operationId` → `fin_operations` → journal.  
Holding/cost tables are **rebuildable projections**, not unaudited cost SoT.

```
instrument → feature transactions → cost basis / rebuild → holding projection
```

## Anti-patterns (FORBIDDEN — LOCKED)
A programmer or AI must **not** implement any of the following:

| Forbidden | Correct |
|-----------|---------|
| Feature-specific cash ledger as accounting truth | Journal + `fin_accounts` only |
| Holding table as unaudited cost-basis SoT | Rebuild from feature transactions + WAC policy |
| Tax “paid” via status mutation only | `tax.pay` → journal → paid derived |
| In-place edit of posted amounts | New operation + inverse journal + link |
| Current price rewriting historical acquisition cost | Valuation uses asOf price context only |
| “Latest” provider call during historical rebuild | Pinned price/FX asOf + engineVersions |
| Toman as ledger currency | Ledger = IRR; Toman = presentation |
| NAV silently used as transaction price | Explicit `transactionPrice`; NAV is valuation context |
| Merge different purities into one holding without policy | Identity includes purity (or explicit lot policy) |
| Broker/exchange symbol as unique economic identity | `ref_instruments.id` + venue/network/account scope |

These are not suggestions; violating them breaks Financial Core invariants.

## Economic hash proof cases (LOCKED)
Core hashes **canonical economic meaning** after `normalizeCommand` (and feature payload canonicalization at the public-api boundary).

Required proofs (see `economicHash.test.js` / idempotency tests):
1. equivalent decimal formatting → same hash  
2. same ID + same economics → replay  
3. same ID + changed economics → conflict  
4. reordered object keys → same hash  
5. omitted optional fields consistent with null where contract says null ≡ omit  
6. journal line order does not change economic hash (identity sorts lines; `line_number` excluded)  
7. structural integers (`line_number`) are not money  

Feature commands must canonicalize their payload **before** Core hash; Core also canonicalizes same-currency journal lines and decimal strings.

## Fee taxonomy (LOCKED) — single enum
Canonical set (must match `CANONICAL_FEE_TREATMENTS` in feeEngine.js):
```
expense
capitalize_inventory
reduce_proceeds
reduce_received_quantity
embedded_in_gross_cash
equity_adjustment
```
No other list in this document may omit members of this set.

| Treatment | Economics (v1) |
|-----------|----------------|
| expense | Dr fee_expense · Cr cash/payable — period cost |
| capitalize_inventory | increases carrying / inventory cost |
| reduce_proceeds | **sell-side presentation**: net proceeds = gross − fee; journal still Dr fee_expense · Cr cash (same legs as expense) so P&L sees the fee; domain `netProceeds` is reduced. Distinct **name** for feature result semantics, not a second silent journal family |
| reduce_received_quantity | **quantity only** (`feeQuantity`); never treat `feeAmount` as quantity |
| embedded_in_gross_cash | fee embedded in gross cash movement |
| equity_adjustment | equity/capital adjustment path |

Aliases normalize at boundary; never become permanent internal vocabulary.  
Module defaults live in command-catalog `feeTaxonomy` + module Fee defaults tables.

## FX fail-closed (LOCKED)
No rate → **no financial post**. Never convert missing FX to zero.  
Multi-hop paths must store or deterministically reconstruct `conversionPath` + observation provenance when historical rebuild requires it.

## Account classification vs operational cash kind
`fin_accounts.account_kind` = accounting class only (asset/liability/equity/income/expense).  
Operational kinds (bank, card, …) live on Accounts feature entities — see `modules/accounts.md`.  
Archive never deletes posted history.

## Unit policy (PARTIAL → complete for R-M06)
Canonical dimensions: money (currency code) · quantity (instrument unit) · mass (`mg` for metals) · rate (percentage-points or fraction — explicit) · pure ratio (0–1).  
Every field card must state unit; mixing money and quantity without treatment is forbidden.
