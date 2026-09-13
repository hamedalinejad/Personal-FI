# BUG-FINAL-021…040 Re-verify (HEAD 2026-09-13)

| ID | Verdict | Evidence |
|----|---------|----------|
| 021 | FIXED | trialBalance uses bookBaseCurrency / rejects REPORT_MIXED_BASE_CURRENCY |
| 022 | FIXED | balanceSheet passes bookBase to TB |
| 023 | FIXED | REPORT_ACCOUNT_KIND_MISSING (no default asset) |
| 024 | FIXED | cash via role / local_settlement_cash* prefix |
| 025 | FIXED | ACCOUNT_ARCHIVE_MISSING_AMOUNT_IN_BASE |
| 026 | DOCUMENTED | post_state = cache; domain owns; no SQLite trigger yet |
| 027 | PARTIAL | domain rejects incomplete posted lines; SQL stays nullable for draft |
| 028 | DOCUMENTED | Core writers require operation_id; NULL only draft tooling |
| 029 | FIXED | FUND_PRICE/NAV/AMOUNT_NONPOSITIVE |
| 030 | FIXED | installments filtered by dueDate ≤ asOf |
| 031 | FIXED | penalty DEFERRED_V1 explicit |
| 032 | FIXED | fee outstanding from ln_loan_fees only |
| 033 | FIXED | settle buy+sell sides |
| 034 | FIXED | outstanding from journal; partial flag |
| 035 | FIXED | source_reference / related_operation_id (not result_json) |
| 036 | FIXED | valuationContext + fxRates |
| 037 | FIXED | typed price objects |
| 038 | PARTIAL | mappingConflict.js runtime; SQL trigger deferred |
| 039 | PARTIAL | uq_ref_instr_isin for stock; crypto indexes exist |
| 040 | FIXED | SOURCE-VOCABULARY + source_channel on journal lines + lint |

**Stale audits listing 021–040 as OPEN against this HEAD are obsolete for FIXED rows.**
