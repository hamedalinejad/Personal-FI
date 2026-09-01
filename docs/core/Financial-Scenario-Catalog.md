# Financial Scenario Catalog (P0 fixtures)

| ID | Scenario | Expected |
|----|----------|----------|
| SCN-001 | Cash Expense | journal bal, cash↓ |
| SCN-002 | Split Expense | multi lines = cash |
| SCN-003 | Refund | new op, not mutate |
| SCN-004 | Bank Transfer | NW Δ=0 |
| SCN-005 | Crypto Buy | qty, cost, cash, journal |
| SCN-006 | Crypto fee in quote | fee treatment |
| SCN-007 | Crypto fee in asset | net qty |
| SCN-008 | Crypto Transfer | cost preserved |
| SCN-009 | Stock Buy | settlement fields |
| SCN-010 | Stock Sell | realized |
| SCN-011 | Dividend | income + cash |
| SCN-012 | Bonus | qty↑ cost/avg |
| SCN-013 | Rights | full lifecycle |
| SCN-014 | Fund Purchase | units, tx price |
| SCN-015 | Fund Div Reinvest | two events one op |
| SCN-016 | Fund Redemption | NAV/liquidation |
| SCN-017 | Gold Purchase | mg, purity |
| SCN-018 | Physical Delivery | custody transfer |
| SCN-019 | Loan Disbursement | principal/cash |
| SCN-020 | Loan Payment | waterfall components |
| SCN-021 | Partial Payment | remaining parts |
| SCN-022 | Early Payment | policy + scheduleVersion |
| SCN-023 | Penalty | component |
| SCN-024 | Opening Balance | source=opening |
| SCN-025 | Import unknown fields | raw preserved |
| SCN-026 | Offline full record | no network |
| SCN-027 | Crash mid-persist | recover |
| SCN-028 | Loan-only edition | standalone |
| SCN-029 | Fund-only edition | standalone |
| SCN-030 | Reversal exact inverse | INV-004 |

هر سناریو: Input → Expected Ledger → Journal → Balance → P&L → Snapshot
