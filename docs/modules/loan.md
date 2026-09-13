# Loan

**Vertical reference module** — other modules should mirror this structure.  
**Shared rules:** FINANCIAL-CORE · DATA-MODEL · API · REPORTING · OFFLINE-RELEASE

## 1. Purpose
Record lender receivables, schedules, payments, and journal effects offline-first.

## 2. Scope
Personal lending books; fixed-rate v1 schedules; Core journal as cash/accounting truth.

## 3. Supported v1 behavior
| Item | Value |
|------|--------|
| role | **lender** only |
| methods | declining_balance · flat_rate · qarz_al_hasaneh · bullet |
| dayCount | period_based |
| frequency | monthly · weekly · quarterly · annual |
| annualRate | percentage points (`12` → 0.12) |
| payment waterfall | penalty → fee → interest → principal |

## 4. Unsupported / Deferred
borrower role · variable rate · actual/365 · 30/360 · mid-loan reschedule as supported · penalty accrual engine (allocation still accepts penalty outstanding)

## 5. Actors / roles
Lender (user of app). Counterparty optional metadata only in v1.

## 6. UI pages
`/loans` list · loan detail · schedule view

## 7. Sheets / drawers
Create loan · Record payment · Reverse payment

## 8. Entities
`ln_loans` · `ln_schedule_snapshots` · `ln_transactions` · `ln_loan_fees` / tiers · Core `fin_operations` / journal

## 9. Field ownership
| Field | Kind | Owner |
|-------|------|--------|
| principal, annualRate, method, role | RAW / STATUS | Loan module |
| schedule snapshot_json | SNAPSHOT | Loan + engine version |
| journal lines | RAW financial | FINANCIAL-CORE |
| remaining balance | DERIVED | rebuild from ledger |

## 10. Identity
`loanId` · `operationId` per mutation · schedule snapshot id/version

## 11. Commands
`loan.create` · `loan.recordPayment` · `loan.reversePayment` · schedule generate/preview (non-posting)

## 12. Queries
`listLoans` · `getLoan` · `getStatement`

## 13. API contract
Envelope: API.md. Money/qty: decimal strings. `operationId` required on mutations.

## 14. State machine
Loan: active → (payments) → closed. Operations: draft/pending durability vs posted/voided financial status (FINANCIAL-CORE).

## 15. Validation
Positive principal · integer periods · supported method/frequency/dayCount · reject variable rate · purity N/A

## 16. Money / quantity semantics
Decimal strings only. Rate = percentage points via `normalizeRatePercentage`.

## 17. FX behavior
If transaction currency ≠ base: require locked `exchangeRateToBase` on post (FINANCIAL-CORE).

## 18. Fee behavior
Optional fee tiers; payment may allocate fee component. Generic fee engine semantics in FINANCIAL-CORE.

## 19. Tax behavior
None by default; no silent tax posting.

## 20. Accounting / journal mapping
**create:** Dr receivable / Cr settlement cash  
**payment:** Dr cash / Cr receivable + income components as allocated  
All via Core operation + journal — no parallel cash ledger.

## 21. Cost basis / valuation
N/A for pure loan receivable (not investment inventory).

## 22. Persistence impact
SQLite control plane: loan rows + operations + journal in one transaction.

## 23. Transaction boundary
`runAtomicFinancialOperation` — domain writes inside same txn as journal.

## 24. Idempotency
Same `operationId` + economic identity → replay, not double post.

## 25. Reversal / correction
`loan.reversePayment` → reversing operation linked to original; no in-place amount rewrite.

## 26. Historical / asOf behavior
Statement/query may filter by asOf; rebuild schedule from snapshot + engine version.

## 27. Reports
Loan statement (module) · GL/TB via REPORTING from journal

## 28. Standalone edition behavior
Loan-only edition uses local settlement adapter + Core accounts; no Accounts UI required.

## 29. Licensing / capabilities
Commands gated by capability; historical rows remain readable on downgrade.

## 30. Edge cases
Overpayment policy explicit · last installment residual conservation · empty fixture not release proof

## 31. Error codes
`OP_OPERATION_ID_REQUIRED` · `VALIDATION_ERROR:*` · `LOAN_METHOD_UNKNOWN` · `LOAN_VARIABLE_RATE_UNSUPPORTED_V1` · `FX_RATE_REQUIRED`

## 32. Fixtures
Canonical: `fixtures/LOAN-FLAT.json` · `fixtures/LOAN-BULLET.json` · `fixtures/LOAN-QARZ.json` · `fixtures/STANDALONE-LOAN.json`

## 33. Tests / proof
`src/features/loan/tests/*` · `src/core/acceptance/loan*.js` · recovery roundtrip · golden schedule (Decimal assertions)

## 34. Machine-file references
`docs/core/db/schema.sql` (ln_*) · `docs/core/json-schemas/schedule-snapshot.schema.json` · registry status · `fixtures/LOAN-*`

### Algorithms (v1) — implementation: `scheduleEngine.js`
- **Rate:** rateFraction = annualRate / 100  
- **Flat:** totalInterest = P × rateFraction × (n / periodsPerYear); residual last row  
- **Declining / Qarz / Bullet:** see engine; conservation assert Σ principal = P  
