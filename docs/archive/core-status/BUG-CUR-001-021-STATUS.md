# BUG-CUR-001 … 021 Status

| ID | Status | Notes |
|----|--------|-------|
| BUG-CUR-001 | **FIXED** | normalizeCommand returns settlementDate, eventAt, provenance, source* |
| BUG-CUR-002 | **FIXED** | borrower → LOAN_ROLE_DEFERRED |
| BUG-CUR-003 | **FIXED** | bootstrap only inside withinTransaction |
| BUG-CUR-004 | **FIXED** | reversal sign −1 on portions |
| BUG-CUR-005 | **FIXED** | fee outstanding from ln_loan_fees; penalty accrual still v1=0 |
| BUG-CUR-006 | **FIXED** | payment bootstrap in-transaction |
| BUG-CUR-007 | **FIXED** | reverse bootstrap in-transaction |
| BUG-CUR-008 | **FIXED** (verified) | scheduleFlat uses normalizeRatePercentage |
| BUG-CUR-009 | **FIXED** (verified) | scheduleQarz uses percentage-points normalize |
| BUG-CUR-010 | **PARTIAL** | residual on last row; full unrounded audit path still limited |
| BUG-CUR-011 | **OPEN** | golden tests still use Number in places — follow-up |
| BUG-CUR-012 | **OPEN** | LOAN-FLAT.json fill — follow-up |
| BUG-CUR-013 | **FIXED** | qty.lte(0) reject |
| BUG-CUR-014 | **FIXED** | FX_RATE_REQUIRED + amountInBase from rate |
| BUG-CUR-015 | **FIXED** | carrying tx vs base split |
| BUG-CUR-016 | **FIXED** | carryingDelta dimensions returned |
| BUG-CUR-017 | **FIXED** | FEE_UNIT_MISMATCH for fee_from_received |
| BUG-CUR-018 | **FIXED** | fee_funding_kind on crypto buy insert |
| BUG-CUR-019 | **FIXED** | fee_funding_kind on crypto sell insert |
| BUG-CUR-020 | **PARTIAL** | domain rejects missing amount_in_base; SQL remains nullable for draft |
| BUG-CUR-021 | **BY DESIGN** | operation_id via entry_id → journal entry; no denormalized line op id |

Tests: 214 green at fix commit.
