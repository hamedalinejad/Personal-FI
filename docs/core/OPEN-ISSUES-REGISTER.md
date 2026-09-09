# Open Issues Register — LIVE

## Think-tank sequence (must stay ordered)

1. CI green (local + GitHub Actions)  
2. One canonical SQLite schema (no second runtime schema)  
3. One atomic persistence path  
4. Correct idempotency  
5. Strict Decimal everywhere  
6. Journal SoT  
7. Schema/migration manifest agreement  
8. Loan-only executable vertical  
9. Golden + recovery proof  
10. Repeat Feature pattern  

## Closed foundation (HEAD)

| Item | Evidence |
|------|----------|
| worker uses schema.sql | src/core/persistence/worker.js |
| persist default sqlite | operationEngine |
| command_hash not global UNIQUE | schema |
| journal load from lines | loadOperation |
| npm test local | 53 pass |
| Loan scaffold | src/features/loan |

## Open

| ID | Work | Blocks |
|----|------|--------|
| CI-GH | Confirm Actions green on main | release confidence |
| ACC-CORE | void/reverse/correct/opening/fiscal | accounting GO |
| LOAN-VERT | full Loan acceptance (partial pay, reverse, backup) | Feature expansion |
| OPEN-004 | Golden family CI | release |
| Gate F/G/H | recovery + rebuild + field disposition | production |

## Explicit

Repo = engine + specification + Loan scaffold. **Production NO-GO.**
