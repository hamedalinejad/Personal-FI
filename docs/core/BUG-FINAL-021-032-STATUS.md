# BUG-FINAL-021…032 Status

| ID | Status | Evidence |
|----|--------|----------|
| 021 trialBalance baseCurrency | FIXED | bookBase filter or mixed-base reject |
| 022 BS multi-currency aggregate | FIXED | same as TB bookBase |
| 023 missing account_kind → asset | FIXED | REPORT_ACCOUNT_KIND_MISSING |
| 024 cashFlow substring | FIXED | role / local_settlement_cash prefix |
| 025 archive amount fallback | FIXED | ACCOUNT_ARCHIVE_MISSING_AMOUNT_IN_BASE |
| 026 post_state drift | DOCUMENTED | schema comment; domain owns |
| 027 journal structural checks | PARTIAL | domain enforces; SQL nullable for draft |
| 028 acc_transactions operation_id | DOCUMENTED | NULL only draft tooling |
| 029 fund subscribe price | FIXED | FUND_PRICE/NAV/AMOUNT_NONPOSITIVE |
| 030 loan outstanding due-as-of | FIXED | installments filtered by dueDate |
| 031 penalty hard-coded zero | FIXED | DEFERRED_V1 explicit |
| 032 fee double-count | FIXED | fee from ln_loan_fees projection only |
