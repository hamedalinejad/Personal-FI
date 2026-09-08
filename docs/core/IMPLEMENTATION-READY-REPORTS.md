# Implementation-Ready — Accounting Reports

All reports project from **journal** (+ domain ledgers for subsidiary detail).

| Query | Source |
|-------|--------|
| reports.trialBalance(asOf) | fin_journal_lines |
| reports.generalLedger(accountId, from, to) | journal lines |
| reports.accountActivity(accountId, from, to) | journal + op meta |
| reports.balanceSheet(asOf) | trial balance by account_kind |
| reports.incomeStatement(from, to) | income/expense accounts |
| reports.cashFlow(from, to) | cash fin_accounts lines |
| reports.journalBook(from, to) | fin_journal_entries |
| reports.subsidiary(id) | domain ledger + ops |

Optional rpt_snapshots with calculation_context_hash; rebuild must match.

## Acceptance

| # | Test |
|---|------|
| R1 | Balanced journal ⇒ TB debits = credits |
| R2 | Income/expense on P&L for period |
| R3 | Cash payment affects BS cash |
| R4 | Snapshot rebuild = live report |
| R5 | UI never queries other feature tables directly |
