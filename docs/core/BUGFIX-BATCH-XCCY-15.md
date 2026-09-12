# Cross-currency / residual batch (items 1–15)

| # | Issue | Status |
|---|--------|--------|
| 1 | Stocks FX carrying unit mix | FIXED — feeCarryTx + grossBase |
| 2 | Metals FX fee/cash mix | FIXED — dimensional carrying; cash TX-only |
| 3 | Fee engine BASE_ONLY_LEGACY | FIXED — carryingDeltaTx / carryingDeltaBaseDim |
| 4 | Crypto transfer fee_funding_kind | FIXED |
| 5 | Fund redeem multi-holding | FIXED — HOLDING_AMBIGUOUS |
| 6 | Loan schedule conservation | FIXED — assertScheduleConservation |
| 7 | Tax outside atomic + negative | PARTIAL — negative rejected; atomic via op preferred |
| 8 | Migration chain 0→1 only | DOCUMENTED — append-only required before prod |
| 9 | result_json / result_hash | FIXED — hash written; journal from relational |
| 10 | JSON vs SQLite parity | OPEN — prefer SQLite path |
| 11 | Report heuristics | PARTIAL — BS requires account_kind; CF uses meta |
| 12 | Investment valuation context | OPEN |
| 13 | Freeze status contradiction | FIXED — SCHEMA-FREEZE-STATUS.md |
| 14 | Browser persistence | OPEN |
| 15 | Investment reversal complete | OPEN (not equal IMPLEMENTED) |
