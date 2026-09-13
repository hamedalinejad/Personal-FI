# GAP-014…040 Status

Generated: 2026-09-13. Honest inventory — not a promise of implementation.

## Feature completeness

| ID | Topic | Status | Why not GREEN |
|----|-------|--------|----------------|
| GAP-014 | Stocks commission/tax policy versioned | OPEN | fees parsed in command; no effective-date policy table |
| GAP-015 | Corporate Action runtime engine | OPEN | docs locked; no CA apply/rebuild engine in src |
| GAP-016 | Fund distribution/reinvest lifecycle | PARTIAL | distribution command exists; dates/reinvest incomplete |
| GAP-017 | Metals physical identity | PARTIAL | delivery moves carrying; serial/assay schema incomplete |
| GAP-018 | Loan fee taxonomy runtime | PARTIAL | ln_loan_fees table; full lifecycle API incomplete |
| GAP-019 | Loan schedule frequency | PARTIAL | v1 period_based locked; custom rejected or incomplete |
| GAP-020 | Loan day-count full set | PARTIAL | only period_based equal-principal proven |
| GAP-021 | Installment first-class state | PARTIAL | snapshot rows; not full paid/remaining subledger |
| GAP-022 | Borrower edition | DEFERRED | v1 lender-only; LOAN_ROLE_DEFERRED |
| GAP-023 | Investment full reversal suite | PARTIAL | loan reverse exists; investment reverse incomplete |
| GAP-024 | API registry complete | PARTIAL | public-api modules; generated registry incomplete |
| GAP-025 | Standalone edition proof | PARTIAL | some standalone tests; not all editions recovery |
| GAP-026 | License entitlement runtime | OPEN | docs; capability gate not central |
| GAP-027 | Nav IA shell | OPEN | product IA locked; UI shell not in this repo phase |

## Data integrity / dimension

| ID | Topic | Status | Why not GREEN |
|----|-------|--------|----------------|
| GAP-028 | Unit/dimension table | OPEN | Decimal strings; no formal dimension registry |
| GAP-029 | Book base currency | PARTIAL | operation base + report bookBase filter; book setting not formal |
| GAP-030 | Historical FX provenance | PARTIAL | path resolver exists; full observation store incomplete |
| GAP-031 | Price quote contract | PARTIAL | price_history + typed valuation; not all paths |
| GAP-032 | No-field-loss complete | PARTIAL | inventory STRICT; command matrix incomplete |
| GAP-033 | Snapshot integrity full | PARTIAL | result_hash path; verification suite incomplete |
| GAP-034 | SQL corruption audit | OPEN | no comprehensive integrity:audit |
| GAP-035 | Query purity semantic | PARTIAL | syntactic lint; no before/after snapshot suite |
| GAP-036 | Dimensional money types | OPEN | Decimal only; no USD+IRR compile-time barrier |

## Security / ops

| ID | Topic | Status | Why not GREEN |
|----|-------|--------|----------------|
| GAP-037 | Secrets/data-protection | OPEN | policy incomplete |
| GAP-038 | TZ/date uniform enforcement | PARTIAL | ISO dates; no central TZ policy everywhere |
| GAP-039 | Policy version on ops | PARTIAL | some domainResult; not required on all ops |
| GAP-040 | Release evidence computed | OPEN | skeleton RELEASE-EVIDENCE.json |

## Rule for coding AI

- Do **not** mark any of the above RELEASE-PROVEN without executable evidence.
- Explicit DEFER is preferred over silent PARTIAL for out-of-scope v1 items (borrower, full CA engine, browser sql.js if Node-first).
