# Loan (module owner)

**Status:** LOCKED for v1 scope · Shared math: FINANCIAL-CORE

## 1. Purpose
Lender receivables: create loan, generate schedule, record payments, reverse payments, journal via Core.

## 2. Scope (v1)
| Item | Value |
|------|--------|
| role | **lender** only (borrower = DEFERRED) |
| methods | declining, flat, qarz, bullet |
| dayCount | **period_based** only |
| frequency | monthly \| weekly \| quarterly \| annual |
| annualRate | **percentage points** (`12` → 0.12) |
| variable rate | **rejected** |
| penalty accrual | **DEFERRED** (waterfall still allocates penalty if outstanding) |

## 3. Non-Goals
actual/365, 30/360, custom frequency, borrower liability path, silent annuity formula change, mid-loan reschedule as supported.

## 4. User Stories
As lender, create fixed-rate loan with schedule; record payment applying penalty→fee→interest→principal; reverse a payment; export statement.

## 5. Pages / Sheets / Drawers
`/loans`; create sheet; payment sheet; schedule view.

## 6. Entities
`ln_loans`, `ln_schedule_snapshots`, `ln_transactions`, `ln_loan_fees`, `ln_loan_fee_tiers`, `ln_rate_history` (v1 unused for variable), Core `fin_operations` / journal.

## 7–9. Fields / Kinds / Ownership
| Field | Kind | Notes |
|-------|------|--------|
| principal | RAW | decimal string |
| annualRate | RAW | percentage points |
| method | STATUS | enum |
| role | STATUS | lender |
| schedule snapshot_json | SNAPSHOT | versioned engine |
| portions on payment | DERIVED | allocation engine |

Owner: this module for ln_*; FINANCIAL-CORE for journal.

## 10. Commands
| Command | Purpose |
|---------|---------|
| loan.create | Create loan + schedule + journal |
| loan.recordPayment | Allocate payment + journal |
| loan.reversePayment | Reverse payment operation |

## 11. Queries
getLoan, listLoans, getSchedule, getStatement (read-model; journal remains SoT).

## 12–13. API I/O
Envelope: API.md. Money fields decimal strings. operationId required on mutations.

## 14. Normalization
- `rateFraction = annualRate / 100` via `normalizeRatePercentage`
- periods: positive integer (Decimal parse then integer count)
- dates: ISO businessDate

## 15. Validation
Reject: non-positive principal; unsupported dayCount; variable rate; unsupported frequency; empty schedule methods.

## 16. State Machine
Loan: draft/active → payments → closed. Payment ops: posted or voided via reverse.

## 17–19. Accounting / Journal / Cash
**create:** Dr receivable / Cr cash (settlement).  
**payment:** Dr cash / Cr receivable + interest (+ fee/penalty income as allocated).  
Cash only via CashSettlementPort.

## 20–22. Fee / Tax / FX
Fee tiers optional; tax N/A default; FX if multi-currency settlement (rate locked on post).

## 23. Date Semantics
businessDate on operations; schedule startDate; installment due dates derived.

## 24. Identity
loanId; operationId on each financial effect; schedule snapshot id/version.

## 25. Reversal
reversePayment → reversing operation linked to original; no in-place amount edit.

## 26. Rebuild
Schedule from snapshotSchemaVersion + engineVersion + inputs; holdings N/A.

## 27. Reports
Statement read-model; GL via REPORTING.

## 28–30. Offline / Standalone / License
Full offline; Loan-only edition + Core settlement; license gates commands only.

## 31–32. Edge Cases / Errors
Overpayment policy explicit; `LOAN_VARIABLE_RATE_UNSUPPORTED_V1`; schedule conservation assert.

## 33. Golden / Recovery
Fixtures under `fixtures/LOAN-*` and tests `golden-schedule.test.js`. Empty expected ⇒ DEFERRED.

## 34. Acceptance Criteria
- Atomic create includes ln_loans + snapshot + operation + journal  
- Flat 12% uses /100 not ×12  
- Σ principal portions = original principal (residual last row)  
- Idempotent operationId replay  

---

## Algorithms (v1)

### ALG-LOAN-RATE
- **Inputs:** annualRate (percentage points)  
- **Formula:** rateFraction = annualRate / 100  
- **Unsupported:** treating 12 as 12.0 interest multiple  

### ALG-LOAN-DECLINING
- principalPortion = P / n  
- interest_i = remaining × (rateFraction / periodsPerYear)  
- residual last row  

### ALG-LOAN-FLAT
- termYears = n / periodsPerYear  
- totalInterest = P × rateFraction × termYears  
- payment components split; last row residual for interest/principal conservation  

### ALG-LOAN-QARZ
- interest = 0  
- feeTotal = P × normalizeRatePercentage(feePercent) when fee used  
- principal portions P/n  

### ALG-LOAN-BULLET
- interest per period on outstanding; principal at end (see scheduleEngine)  

### ALG-LOAN-PAYMENT-WATERFALL
Order: penalty → fee → interest → principal.

### Proof
Executable tests + fixtures — prose examples are not stronger than fixtures.
