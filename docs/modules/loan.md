# Loan (module owner)

**Status:** CURRENT

# Module: Loan

**Owner:** this file · Shared math conventions → FINANCIAL-CORE

## 1. Purpose
Lender receivables: schedule, payment allocation, journal.

## 2. Scope (v1 SUPPORTED)
* role: **lender only** (borrower = DEFERRED)
* methods: declining equal-principal, flat, qarz, bullet
* dayCount: **period_based** only
* frequency: monthly | weekly | quarterly | annual
* rate input: percentage points (`12` → 0.12 internal)
* payment waterfall: penalty → fee → interest → principal
* penalty accrual: **DEFERRED** (policy fields may exist; operational effect 0)

## 3. Non-goals / UNSUPPORTED v1
actual/365, 30/360, custom frequency, full borrower liability path, silent annuity formula change.

## 4. Commands
`loan.create` · `loan.recordPayment` · `loan.reversePayment` · queries list/get/schedule/statement (as implemented).

## 5. Journal
Create: Dr receivable / Cr cash. Payment: Dr cash / Cr receivable + interest (+ fee).

## 6. Rounding
Full Decimal internal; display money2; last installment residual so Σ principal = original.

## 7. Golden authority
Fixtures/tests — not prose examples.

## 8. Standalone
Loan-only edition uses LocalSettlementAdapter + Core journal.

## 9. Acceptance
Atomic txn includes ln_loans + schedule + operation + journal; idempotent replay; overpayment policy explicit.


## Mathematical formulas (v1)

### Rate
Business: `annualRate=12` means 12%.  
Math: `rateFraction = annualRate / 100`.

### Declining equal-principal
`principalPortion = P / n`  
`interest_i = remainingBalance * (rateFraction / periodsPerYear)`  
Last row residual-corrects so Σ principal = P.

### Flat
`totalInterest = P * rateFraction * years`  
`payment = (P + totalInterest) / n`

### Qarz
Interest 0; optional fee percent normalized like rates; never silent interest conversion.

### Golden authority
Executable fixtures/tests — not prose alone.


---
## Template checklist
All 34 sections required; expand TBD before RELEASE_PROVEN.
