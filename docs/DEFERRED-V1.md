# Personal-FI — Explicit V1 Deferred Items

These are **not accidental gaps**. Do not implement casually.

## Loan (deferred)
- borrower role in standalone v1
- custom interval, grace, penalty accrual
- fee tier taxonomy, early-payment recalculation, overpayment policy
- multi-currency loan FX, mid-loan reschedule, variable rate
- day-count: actual/365, 30/360

Each requires: command contract, schema, formula, fixture, journal effect, reversal/rebuild, report, edition test.

## Crypto (deferred)
- deposit, withdrawal, swap/C2C, airdrop, opening balance

## Stocks (deferred until complete semantics)
- full corporate actions runtime
- official versioned Iranian settlement calendar + commission/tax policy data

## Funds (deferred)
- reinvest Boolean (REJECTED in v1 until economic model complete)
- distribution tax, full fee taxonomy

## Reports (deferred)
- TWR / MWR / IRR

## Platform (out of MVP)
- multi-device sync
- native Android/iOS/Windows proof

## Iran policy data
- full fee-policy tables: provenance/version ready, data partial
