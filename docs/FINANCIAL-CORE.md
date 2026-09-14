# FINANCIAL-CORE (sole finance owner)

**Status:** CURRENT

Absorbs: Accounting-Core, Accounting-Calculation-Invariants, Financial-Invariants, Canonical-Financial-Operation, Canonical-Cash-Model, Fee-Treatment-Matrix, Cost-Basis-Engine, Money-Decimal-Policy, Precision-Policy, Unit-Policy, JSON-Policy, Date-Semantics-Matrix, Rebuild-API-Contract, Reconciliation-Order, Opening-Balance, Reversal specs, Journal contracts.

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
CanonicalFeeEvent: `feeAmount`, `feeCurrency`, `feeInstrumentId?`, `feeTreatment`, `feeFundingKind` (`cash|asset`).  
Treatments: expense | capitalize_inventory | reduce_proceeds | equity_adjustment — **one** treatment per event.  
Feature selects policy; Core Fee Engine applies.

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
- **Crypto economic_kind:** acquisition|disposal|transfer_internal|swap_economic|fee.  
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

