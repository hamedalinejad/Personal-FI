# Loan v1 Master Resolutions

## Formula
`declining_balance` = **equal-principal** (`1.0.0-period_based-equal-principal`).  
Annuity text in older feature docs is a **v1 documentation defect** — do not implement annuity silently.

## Role
Only **`lent`** (Dr receivable / Cr cash) is RELEASE-supported.  
`borrowed` → `LOAN_ROLE_DEFERRED` until liability COA exists.

## Atomicity
create/pay/reverse use `withinTransaction` inside the same SQLite COMMIT as journal.

## Schema path
Prefer **extend schema via migrations** over silently shrinking the Loan contract.  
v1 columns on `ln_loans` / `ln_transactions` expanded for operation_id, portions, day_count, engine version.

## Day count
Only `period_based` for first vertical.


## Rate unit (FINAL)

API `annualRate` uses **percentage points**: `18` = 18%.  
Engine: `normalizeRatePercentage` → fractional `0.18` once, then internal math.
