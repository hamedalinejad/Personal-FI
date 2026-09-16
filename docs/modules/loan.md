# Loan

**Vertical reference module** — other modules should mirror this structure.  
**Shared rules:** FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE

## 1. Purpose
Record lender receivables, schedules, payments, and journal effects offline-first.

## Shared contracts
Money / FX / journal / fee / reversal / rebuild → [FINANCIAL-CORE.md](../FINANCIAL-CORE.md)  
API envelope / idempotency shape → [API.md](../API.md)  
Layers / public-api → [ARCHITECTURE.md](../ARCHITECTURE.md)  
Offline / backup / recovery → [OFFLINE-RELEASE.md](../OFFLINE-RELEASE.md)  
Process / freeze → [DEVELOPMENT.md](../DEVELOPMENT.md)  
Command cards → `docs/core/registry/command-catalog.json`

## 2. Scope
Personal lending books; fixed-rate v1 schedules; Core journal as cash/accounting truth.

## 3. Supported v1 behavior
| Item | Value |
|------|--------|
| role | **lender** only |
| methods | declining_balance · flat_rate · qarz_al_hasaneh · bullet |
| dayCount | period_based |
| frequency | monthly · weekly · quarterly · annual |
| annualRate | percentage points (`12` → 0.12) |
| payment waterfall | penalty → fee → interest → principal |

## 4. Unsupported / Deferred
borrower role · variable rate · actual/365 · 30/360 · mid-loan reschedule as supported · penalty accrual engine (allocation still accepts penalty outstanding)

## 5. Actors / roles
Lender (user of app). Counterparty optional metadata only in v1.

## 6. UI pages
`/loans` list · loan detail · schedule view

## 7. Sheets / drawers
Create loan · Record payment · Reverse payment

## 8. Entities
`ln_loans` · `ln_schedule_snapshots` · `ln_transactions` · `ln_loan_fees` / tiers · Core `fin_operations` / journal

## 9. Field ownership
| Field | Kind | Owner |
|-------|------|--------|
| principal, annualRate, method, role | RAW / STATUS | Loan module |
| schedule snapshot_json | SNAPSHOT | Loan + engine version |
| journal lines | RAW financial | FINANCIAL-CORE |
| remaining balance | DERIVED | rebuild from ledger |

## 10. Identity

## Identity: role vs direction (LOCKED)

| Field | Status | Rule |
|-------|--------|------|
| `role` | **CANONICAL** | `borrower` \| `lender` — v1 writers use this only |
| `direction` | **LEGACY** | `borrowed` \| `lent` — migration alias only; new writers leave NULL |
| Agreement | if both present: borrowed↔borrower, lent↔lender | conflict → reject |

v1: `role = lender` only; `borrower` DEFERRED.

`loanId` · `operationId` per mutation · schedule snapshot id/version

## 11. Commands
`loan.create` · `loan.recordPayment` · `loan.reversePayment` · schedule generate/preview (non-posting)

## 12. Queries
`listLoans` · `getLoan` · `getStatement`

## 14. State machine
Loan: active → (payments) → closed. Operations: draft/pending durability vs posted/voided financial status (FINANCIAL-CORE).

## 15. Validation
Positive principal · integer periods · supported method/frequency/dayCount · reject variable rate · purity N/A

## 19. Tax behavior
None by default; no silent tax posting.

## 20. Accounting / journal mapping
**create:** Dr receivable / Cr settlement cash  
**payment:** Dr cash / Cr receivable + income components as allocated  
All via Core operation + journal — no parallel cash ledger.

## 21. Cost basis / valuation
N/A for pure loan receivable (not investment inventory).

## 27. Reports
Loan statement (module) · GL/TB via REPORTING from journal

## 30. Edge cases
Overpayment policy explicit · last installment residual conservation · empty fixture not release proof

## 31. Error codes
`OP_OPERATION_ID_REQUIRED` · `VALIDATION_ERROR:*` · `LOAN_METHOD_UNKNOWN` · `LOAN_VARIABLE_RATE_UNSUPPORTED_V1` · `FX_RATE_REQUIRED`

## 32. Fixtures
Canonical: `fixtures/LOAN-FLAT.json` · `fixtures/LOAN-BULLET.json` · `fixtures/LOAN-QARZ.json` · `fixtures/STANDALONE-LOAN.json`

## 33. Tests / proof
`src/features/loan/tests/*` · `src/core/acceptance/loan*.js` · recovery roundtrip · golden schedule (Decimal assertions)

## V1 schedule conventions (LOCKED)

Methods: `declining_balance` · `flat_rate` · `qarz_al_hasaneh` · `bullet`.

### declining_balance = equal-principal (NOT annuity)
```
principalPart = P / n
interest_i = openingBalance_i × periodRate
payment_i = principalPart + interest_i
```
Final period conserves residual principal. Do not document as generic “amortizing annuity”.

### Explicit v1 must define (module + fixtures)
borrower | lender · rate period · payment frequency · custom interval · grace · holiday policy · penalty · fee tiers · early payment · recalculation · FX · rounding · residual.

Rate unit: percentage points (`12` = 12%).

## 9.5 declining_balance math (LOCKED)

Interpretation: **equal-principal** (not generic annuity).

```
rateFraction = annualRate / 100

principalPart = P / n

interest_i = openingBalance_i × periodRate

payment_i = principalPart + interest_i
```

Final row must conserve principal (residual zero in Decimal policy).

Payment allocation order (LOCKED):
```
penalty → fee → interest → principal
```

## 9.6 Remaining before Loan “complete”
| Topic | v1 status |
|-------|-----------|
| role = lender | LOCKED |
| role = borrower | DEFERRED |
| custom interval | PARTIAL / DEFERRED if not in engine |
| grace period + grace interest policy | DEFERRED |
| penalty accrual engine | DEFERRED (allocation may still accept outstanding penalty) |
| fee tiers full taxonomy | PARTIAL |
| early payment / recalculation | PARTIAL |
| overpayment | PARTIAL |
| rounding residual distribution | must match engine + fixtures |
| FX multi-currency loans | PARTIAL |
| residual / closure criteria | PARTIAL |
| reschedule mid-loan | DEFERRED |
| variable rate | DEFERRED |
| day-count actual/365, 30/360 | DEFERRED |

Loan remains the **vertical reference** for module template quality — not automatically RELEASE-PROVEN for every policy row above.
## 28. Standalone edition behavior (LOCKED)
**Loan-only** boots without Accounts UI and without other feature packages.

| Requirement | Rule |
|-------------|------|
| Core | Journal + operation engine always available |
| Settlement | `CashSettlementPort` + local settlement accounts |
| Commands | `loan.create` · `loan.recordPayment` · `loan.reversePayment` · schedule generate/preview |
| Reports | Loan schedule/statement · trial balance subset · export |
| Forbidden | Import `features/stocks/**` or any other feature internals |
| License | capability `loan` only |

Proof path: `src/features/loan/tests/standalone-boot.test.js`

## Policy completeness matrix (v1)
| Policy | Status |
|--------|--------|
| equal-principal / declining_balance schedule | **SUPPORTED** |
| flat / bullet / qarz as implemented in engine | **SUPPORTED** where fixtures green |
| payment waterfall penalty→fee→interest→principal | **SUPPORTED** |
| rate as percentage-points (18 = 18%) | **SUPPORTED** |
| borrower role (as counterparty mode) | **DEFERRED** |
| custom interval beyond engine | **DEFERRED** |
| grace period + grace interest | **DEFERRED** |
| penalty **accrual** engine | **DEFERRED** (allocation may accept outstanding penalty) |
| complete fee tier taxonomy | **DEFERRED** / PARTIAL |
| early payment + recalculation | **DEFERRED** |
| overpayment policy | **DEFERRED** |
| multi-currency loan FX | **DEFERRED** |
| residual/closure criteria beyond residual principal row | **PARTIAL** |
| mid-loan reschedule | **DEFERRED** |
| variable rate | **DEFERRED** |
| day-count actual/365, 30/360 | **DEFERRED** (v1 period_based/monthly only) |

No ambiguous “maybe later” — only SUPPORTED / DEFERRED / REJECTED.

## loan.create economic kinds (LOCKED)
| Kind | Meaning | Journal sketch |
|------|---------|----------------|
| `disburse_now` | Cash actually leaves settlement now | Dr receivable · Cr settlement cash |
| `record_outstanding` | Historical/already-outstanding receivable; **no new cash movement** | **v1 lender-only canonical:** Dr Loan Receivable · Cr Opening Balance Equity — **not** Cr settlement cash. Alternate source accounts only via explicit config path, not developer choice. |

Default for greenfield “new loan cash out” = `disburse_now`.  
Recording an existing receivable without fabricating cash requires `record_outstanding` (or explicit opening-balance path). Command card must carry `originationKind`.

## installment_frequency (schema aligned)
```
monthly · weekly · quarterly · annual · custom
```
Engine + schema both support `annual`.

### Field kinds (LOCKED)
- `fixed_installment_amount` → RAW (user-entered)
- `calculated_installment` → SNAPSHOT (engine result at schedule generation)
