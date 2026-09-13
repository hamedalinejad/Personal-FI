# Module: Loan

## Scope (v1)
Lender-only. Equal-principal declining, flat, qarz, bullet. period_based day count. monthly/weekly/quarterly/annual frequency.

## Deferred
Borrower/liability, actual/365, penalty accrual, custom frequency.

## Commands
* loan.create
* loan.recordPayment
* loan.reversePayment

## Journal
Create: Dr receivable / Cr cash. Payment: Dr cash / Cr receivable+interest+fee(+penalty deferred).

## Golden
Zero-interest 12×100; rate 12% equal-principal interest vector 12..1 sum 78.

## Status
IMPLEMENTED under CODING-GATE; not RELEASE-PROVEN until recovery+standalone matrix green.
