# P0-PRICE + P0-LOAN Status

| ID | Status | Evidence |
|----|--------|----------|
| P0-PRICE-002 | **FIXED** | mappingConflict.js (instrument+source+market) |
| P0-PRICE-003 | **LOCKED** | P0-PRICE-IDENTITY-LOCK.md |
| P0-LOAN-001 | **FIXED** | scheduleFlat uses normalizeRatePercentage |
| P0-LOAN-002 | **FIXED** | scheduleQarz uses normalizeRatePercentage |
| P0-LOAN-003 | **FIXED** | flatConvention = annual_times_term_years |
| P0-LOAN-004 | **FIXED** | residual on last row |
| P0-LOAN-005 | **FIXED** | schema day_count_convention = period_based\|monthly only |
| P0-LOAN-006 | **FIXED** | normalizeDayCount returns period_based |
| P0-LOAN-007 | **FIXED** | assertFixedRateV1 rejects rate history |
| P0-LOAN-008 | **FIXED** | golden asserts totalInterest 144 |
| P0-LOAN-009 | **FIXED** | golden uses toDecimal only |
| P0-LOAN-010 | **FIXED** | fixtures/LOAN-FLAT.json populated |
| P0-LOAN-011 | **PARTIAL** | schema has mapped fields; keep disposition docs in sync |

### Flat product equation (locked)

```
totalInterest = principal × normalizeRatePercentage(annualRate) × (periods / periodsPerYear)
```

Snapshot must store `flatConvention: "annual_times_term_years"`.
