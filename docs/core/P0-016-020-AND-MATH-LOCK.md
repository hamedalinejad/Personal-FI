# P0-016…020 + MATH-001…009 Lock (FINAL)

## P0-016 — Stocks CA model

**Canonical:** keep a compact `tx_type` set that includes `corporate_action` **and** explicit CA kinds where already in schema.
Authoritative CA payload lives in `inv_stocks_iran_corporate_actions` (versioned, idempotent by `operation_id` + CA identity).

Recommended write path:

```
CA command → fin_operations
  → inv_stocks_iran_corporate_actions (payload, version, provenance)
  → inv_stocks_iran_transactions (tx_type = corporate_action | specific kind)
  → holdings mutation via CA engine only
```

Replay: same operationId + commandHash = no double apply.

---

## P0-017 — Funds product + holding fields

**RAW on `inv_fif_funds`:** name, symbol, fund_kind, profit_kind, predicted_annual_rate, distribution_period, base_price, platform, url, description, is_active, …

**DERIVED on holdings:** quantity, total_invested, averageBuyPrice (= total_invested/quantity)

**EXTERNAL_REPORTED / SNAPSHOT:** currentNAV, last subscription/redemption prices (as_of + source)

Never treat NAV snapshot as transaction price.

---

## P0-018 — Loan field mapping (v1)

| Feature field | SQL | Kind | Notes |
|---------------|-----|------|-------|
| name | ln_loans.name | RAW | |
| loanType | loan_type | RAW | |
| direction/role | direction + role | RAW | lent only release-supported |
| principalAmount | principal | RAW | |
| dayCountConvention | day_count_convention | RAW | **v1: period_based only in engine** |
| dayCountDenominator | day_count_denominator | RAW | deferred for custom_days |
| disbursementDate | disbursement_date / start_date | RAW | |
| firstPaymentDate | first_payment_date | RAW | |
| endDate | end_date / maturity_date | RAW | |
| irregularFirstPeriod | irregular_first_period | RAW | rejected by engine if true in v1 unless implemented |
| firstPeriodEndDate | first_period_end_date | RAW | |
| paymentHolidayCalendarId | payment_holiday_calendar_id | RAW | deferred runtime |
| interestType | interest_type | RAW | fixed v1; variable needs rate history |
| interestRatePeriod | interest_rate_period | RAW | |
| installmentFrequency | installment_frequency | RAW | |
| customIntervalDays | custom_interval_days | RAW | |
| grace* | grace_mode, grace_periods, … | RAW | partial runtime |
| engineVersion | schedule_engine_version | SYSTEM | |

Engine acceptance remains `1.0.0-period_based-equal-principal` for declining.

---

## P0-019 — Crypto exchange/wallet metadata

**RAW on exchanges/networks/addresses:** type/venue_kind, url, description, is_active, updated_at, address, derivation_path, account_index, address_type, labels.

Extension tables allowed if 1:1 to master row; do not drop derivation path.

---

## P0-020 — Accounts Iran/banking fields

**Identity:** id, name, account_number, iban  
**Bank metadata:** bank_name, branch_name, bank_product_type  
**Security:** card_last4, card_token (**never PAN**)  
**Classification:** account_kind, role  
**Snapshot:** current_balance (rebuildable from journal)  
**Provenance:** notes, external_ref_json  

---

## MATH locks

| ID | Rule |
|----|------|
| MATH-001 | Weekly annuity reference PMT ≈ **2104660.886** (not 2115000). Annuity ≠ v1 equal-principal acceptance. |
| MATH-002 | 45-day simple PMT ≈ **6890118.148** (not 6956000). |
| MATH-003 | `actual_actual` **DEFERRED** in v1 runtime; reject or map to error; do not promise leap-aware with fixed 365. |
| MATH-004 | flat_rate v1 = **period-based regular** only; irregular/day-count variants rejected. |
| MATH-005 | Variable rate: future intervals use **rate history effective rate**, not frozen origination rate. |
| MATH-006 | Fund realized P&L **only** from CostBasisEngine + fee/FX context — no alternate simple formula. |
| MATH-007 | Net Worth cash = **journal only**; platform/broker cashBalance = cache. |
| MATH-008 | Crypto transfer-like ops require `economicKind` (internal_transfer \| bridge \| economic_swap) + fee funding. |
| MATH-009 | Fee conversion: feeAmount, feeCurrency, feeToLegRate?, feeToBaseRate, conversionPath when multi-hop — never re-infer from live FX. |
