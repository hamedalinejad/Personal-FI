# Loan v1 Schema Disposition (FINAL for v1)

**Resolution of D-007 / A11:** v1 does **not** silently drop the rich Loan contract.  
v1 **freezes** a minimal executable column set; richer fields are **DEFERRED** to versioned migrations before RELEASE-PROVEN claim for those fields.

## ln_loans — v1 REQUIRED (must exist)

| Column | Kind | Notes |
|--------|------|-------|
| id | RAW | PK |
| party_id | RAW | nullable |
| role | RAW | v1 only `lent` |
| calculation_method | RAW | declining_balance \| flat_rate \| qarz_al_hasaneh \| bullet |
| principal | RAW | decimal string |
| currency | RAW | e.g. IRR |
| interest_rate | RAW | annual, decimal string |
| status | RAW | draft\|active\|paid_off\|defaulted\|restructured\|cancelled |
| created_at | RAW | ISO timestamp |
| start_date | RAW | DATE |
| maturity_date | RAW | nullable |
| operation_id | RAW | create operation |
| total_installments | RAW | integer |
| day_count | RAW | v1: period_based only |
| schedule_engine_version | RAW | 1.0.0-period_based-equal-principal |
| notes | RAW | nullable |

## ln_loans — DEFERRED (v1.1+ migration before use)

name, loanType, dayCountDenominator, exchangeRateToBase, firstPaymentDate,  
irregularFirstPeriod, firstPeriodEndDate, paymentHolidayCalendarId, interestType,  
interestRatePeriod, installmentFrequency, customIntervalDays, graceMode,  
gracePeriods, graceStartDate, graceEndDate, graceInterestPolicy, account linkage  

**Rule:** API must reject payloads requiring deferred fields with `LOAN_FIELD_DEFERRED` until migration lands.  
No silent ignore.

## ln_transactions — v1 REQUIRED

id, loan_id, operation_id, tx_type, business_date, amount, currency, created_at,  
payment_date, exchange_rate_to_base, principal_portion, interest_portion,  
fee_portion, penalty_portion, reverses_transaction_id  

## ln_schedule_snapshots — v1 REQUIRED

id, loan_id, version, snapshot_json, effective_from, operation_id  

snapshot_json must include engineVersion in future writes (domain responsibility).

## Acceptance

- Coding against **REQUIRED** columns only = compliant for Loan v1.  
- Using DEFERRED fields without migration = **forbidden**.  
- Full feature-spec field parity = post-v1 work, tracked as migrations not as silent schema drift.
