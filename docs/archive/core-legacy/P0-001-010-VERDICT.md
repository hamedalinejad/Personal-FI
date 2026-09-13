# P0-001 … P0-010 Verdict

| ID | Topic | Status | Evidence |
|----|-------|--------|----------|
| P0-001 | fin_accounts/journal vocabulary | **GREEN** | schema.sql + Accounting-Core + P0-SCHEMA-VOCABULARY-LOCK |
| P0-002 | acc_transactions projection | **GREEN** | Option A locked; Accounts-Banking banner |
| P0-003 | related_feature enum | **GREEN** | schema CHECK + lock doc |
| P0-004 | Crypto ghost cash table | **GREEN** | omission + feature banner + cash port |
| P0-005 | Stocks ghost cash table | **GREEN** | same |
| P0-006 | Metals ghost cash table | **GREEN** | same |
| P0-007 | inv_crypto_cash | **GREEN** | schema comment: snapshot only; hidden fin_account |
| P0-008 | price instrument identity | **GREEN** | price_history.instrument_id + banner |
| P0-009 | amount_in_base posted | **GREEN** | invariants + acceptance tests |
| P0-010 | operation_id posted | **GREEN** | CFO + schema comments on domain tables |

**Production ship:** still separate (CI/release). These P0 doc/schema conflicts are closed.
