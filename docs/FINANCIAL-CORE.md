# FINANCIAL-CORE (sole finance owner)

**Status:** CURRENT · Absorbs legacy accounting/fee/FX/cost-basis/journal prose (history in Git).

## 0. Scope / SoT
```
fin_accounts + fin_journal_entries + fin_journal_lines = accounting & cash truth
Feature balances / holdings = rebuildable projections
```
No feature parallel cash ledger. UI never builds journal lines.

## 1. Money & units
| Rule | Detail |
|------|--------|
| Representation | API + DB = **decimal strings**; arithmetic = Decimal.js only |
| Forbidden | JS Number / IEEE float for money, qty, rate, price |
| Ledger currency | **IRR**; Toman = presentation only |
| Rates | Percentage points (`12` → 0.12) unless labeled fraction |
| Quantity | Explicit unit (shares, crypto base units, **mg** for metals) |
| JSON | Money fields are strings; no silent null in canonical arrays |

## 2. Book base & FX
| Rule | Detail |
|------|--------|
| Book base | `db_meta.book_base_currency` (default IRR) — never transaction currency |
| Snapshot | `fin_operations.base_currency` = immutable base resolved at **normalize**; later settings changes never rewrite posted ops |
| Equation | `amountInBase = amount × exchangeRateToBase` (basePerTxnUnit) |
| Base line | rate = 1, amountInBase = amount |
| Non-base posted | rate + amountInBase + conversionPath (when multi-hop) **required** |
| Fail-closed | Missing/stale rate without explicit override → **no financial post**; never zero-fill |
| Provenance | Direct / inverse / multi-hop + asOf + source pinned for rebuild |

## 3. Operation & idempotency
| Rule | Detail |
|------|--------|
| Identity | `operationId` + canonical **economic hash** |
| Same ID + same economics | idempotent replay |
| Same ID + different economics | **conflict** |
| Business status | `draft` \| `posted` \| `voided` \| `failed` |
| Durability | `pending` → `sql_committed` → `persisted` (or `persist_failed`) — separate from business status |
| Hash boundary | Normalize (incl. same-currency base fill) **before** hash; no caller-supplied hash trust; no unsafe Number in economic payload |

### Economic hash proof cases
1. Equivalent decimal formatting → same hash  
2. Same ID + same economics → replay  
3. Same ID + changed economics → conflict  
4. Key reorder → same hash  
5. Optional omit consistent  
6. null vs omit only if contract says economic  
7. Deterministic journal line order  
8. Line numbers structural, not money  

## 4. Journal
| Rule | Detail |
|------|--------|
| Balance | `Σ debit(amountInBase) = Σ credit(amountInBase)` exact Decimal |
| Posted | ≥ 2 lines; no empty posted journal |
| Pipeline | canonicalize → account/currency → FX → base → balance → domain → commit |
| Line currency | Must match account currency policy |
| post_state | Cache of operation status only; reports use `fin_operations.status` |

## 5. Fees (single taxonomy)
Canonical treatments only:
```
expense | capitalize_inventory | reduce_proceeds
| reduce_received_quantity | embedded_in_gross_cash | equity_adjustment
```
| Treatment | Economics |
|-----------|-----------|
| expense | Dr fee_expense · Cr cash/payable |
| capitalize_inventory | increases inventory/carrying |
| reduce_proceeds | **classification only for result.netProceeds** (= gross − fee). Journal still posts fee **once** as expense (Dr fee_expense Cr cash). Realized P&L = **gross proceeds − cost released − allocated fee** — never subtract fee again from already-net proceeds |
| reduce_received_quantity | **quantity** (`feeQuantity`) only — never feeAmount as qty |
| embedded_in_gross_cash | fee inside gross cash move |
| equity_adjustment | equity/capital path |

- Treatment **required** (no silent default to expense at Core).  
- Module defaults only if listed in command-catalog + module doc, normalized before Core.  
- Capitalized fee must still produce balanced journal legs.  
- Fee Engine is the only fee calculator.

## 6. Cost basis
WAC v1: deterministic, versioned, reversible, asOf-reproducible. Disposal releases quantity + carrying. Holdings are projections, not unaudited cost SoT.

## 7. Dates (never collapse)
```
businessDate | tradeDate | settlementDate | cashDate | eventAt
| marketDate | priceAsOf | fxAsOf | settlementPolicyVersion
```
Stocks: position on trade semantics; cash on settlement semantics.

## 8. Opening & reversal
- Opening balance = controlled event with provenance.  
- Reversal = **new** operation + inverse journal + link to original.  
- No in-place rewrite of posted amounts.

## 9. Rebuild
```
rebuildProjection({ asOf, engineVersions, sourceLedger, priceContext, fxContext, policyVersions, watermark })
```
No live providers. Same inputs → same outputs.

## 10. Domain locks (pointers)
| Domain | Lock |
|--------|------|
| Loan | declining = equal-principal; `rateFraction = annualRate/100`; residual exact; pay waterfall penalty→fee→interest→principal; **role** canonical (`lender` v1); `direction` LEGACY |
| Metals | `fineWeight = grossMass × purityRatio`; purity required at post; trade fee ≠ delivery fee |
| Funds | NAV ≠ transactionPrice ≠ liquidationPrice (`price_history` quote types nav/liquidation) |
| Crypto | economic_kind: acquisition\|disposal\|transfer_internal\|swap_economic\|fee\|income\|adjustment; `exchange_id` = venue/container |
| Tax | source_operation_id vs payment_operation_id; paid DERIVED from payments |
| Accounts | `fin_accounts.account_kind` = class only; operational kinds on `acc_accounts` |

## 11. Hard invariants
1. No float money arithmetic  
2. Posted journal base-balanced exactly  
3. Book base ≠ silent transaction currency  
4. No parallel feature cash SoT  
5. No NAV→transactionPrice silent copy  
6. No purity-unknown holding merge  
7. No provider symbol as instrument PK  
8. Tax not “paid” by status alone  

## 12. Anti-patterns (FORBIDDEN)
Feature cash ledger as truth · holding as unaudited cost SoT · UI journal · live price in historical rebuild · Toman as ledger currency · optional journal on register-only commands without effectClass · inventing economics outside this doc + command-catalog  

## 13. Proof requirements
Goldens for journal/FX/fee/loan/investments; recovery matrix; standalone packs. See QUALITY-STATUS + fixtures.

## 14. Rounding (v1)
Store at policy precision; residual absorption only on **final eligible** schedule/allocation row; conservation asserts **exact** equality of stored sums vs original principal (and interest where required).
