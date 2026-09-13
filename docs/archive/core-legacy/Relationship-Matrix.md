# Relationship Matrix (P1-FIX-009 / OPEN-002)

> Every **actual** FK edge: cardinality, nullable, ON DELETE, owner, write path.  
> Expand until coverage = 100% of schema FKs (Gate D).

| Source table | Source column | Ref table | Ref column | Card. | Nullable | ON DELETE | Unique/Index | Owner | Write path |
|--------------|---------------|-----------|------------|-------|----------|-----------|--------------|-------|------------|
| fin_journal_lines | accountId | fin_accounts | id | N:1 | NO | RESTRICT | INDEX | Accounting Core | runAtomicFinancialOperation |
| fin_journal_lines | operationId | fin_operations | id | N:1 | NO | RESTRICT | INDEX | Accounting Core | same |
| fin_journal_lines | journalEntryId | fin_journal_entries | id | N:1 | NO | CASCADE | INDEX | Accounting Core | same |
| fin_journal_entries | operationId | fin_operations | id | N:1 | NO | RESTRICT | INDEX | Accounting Core | same |
| fin_operations | reversesOperationId | fin_operations | id | N:1 | YES | RESTRICT | INDEX | Accounting Core | reverseOperation |
| inv_crypto_transactions | instrumentId | ref_instruments | id | N:1 | NO | RESTRICT | INDEX | Crypto | Feature → Core |
| inv_crypto_transactions | operationId | fin_operations | id | N:1 | NO | RESTRICT | INDEX | Crypto | same |
| inv_crypto_holdings | instrumentId | ref_instruments | id | N:1 | NO | RESTRICT | UNIQUE(exchangeId,instrumentId[,networkId]) | Crypto | rebuild from ledger |
| inv_crypto_holdings | exchangeId | inv_crypto_exchanges | id | N:1 | NO | RESTRICT | — | Crypto | createHolding path |
| inv_stocks_iran_transactions | instrumentId | ref_instruments | id | N:1 | NO | RESTRICT | INDEX | Stocks | Feature → Core |
| inv_stocks_iran_transactions | operationId | fin_operations | id | N:1 | NO | RESTRICT | INDEX | Stocks | same |
| inv_stocks_iran_holdings | instrumentId | ref_instruments | id | N:1 | NO | RESTRICT | UNIQUE(brokerageId,instrumentId) | Stocks | rebuild |
| inv_stocks_iran_brokerage_transactions | operationId | fin_operations | id | N:1 | preferred | RESTRICT | INDEX | Stocks | Port |
| inv_fif_funds | instrumentId | ref_instruments | id | N:1 | NO | RESTRICT | **UNIQUE(instrumentId)** OPEN-011 | FIF | createFund |
| inv_fif_transactions | instrumentId | ref_instruments | id | N:1 | NO | RESTRICT | INDEX | FIF | Feature → Core |
| inv_fif_transactions | fundId | inv_fif_funds | id | N:1 | NO | RESTRICT | INDEX | FIF | metadata link |
| inv_fif_transactions | operationId | fin_operations | id | N:1 | NO | RESTRICT | INDEX | FIF | same |
| inv_fif_transactions | accountId | acc_accounts | id | N:1 | YES | RESTRICT | INDEX | FIF | integrated bank only |
| inv_fif_holdings | instrumentId | ref_instruments | id | N:1 | NO | RESTRICT | UNIQUE per custody scope | FIF | rebuild |
| ln_transactions | loanId | ln_loans | id | N:1 | NO | RESTRICT | INDEX | Loan | Feature → Core |
| ln_transactions | operationId | fin_operations | id | N:1 | NO | RESTRICT | INDEX | Loan | same |
| ln_loans | instrumentId? | — | — | — | — | — | — | Loan | N/A unless productized |
| acc_transactions | operationId | fin_operations | id | N:1 | preferred | RESTRICT | INDEX | Accounts projection | Port after journal |
| acc_transactions | accountId | acc_accounts | id | N:1 | NO | RESTRICT | INDEX | Accounts | same |
| price_history | instrumentId | ref_instruments | id | N:1 | NO | RESTRICT | INDEX (with asOf, source) | Price | setManual / fetch |
| cur_exchange_rates | — | — | — | — | — | — | UNIQUE(from,to,asOf,source) | Currency | rate API |
| docs_links | documentId | docs_documents | id | N:1 | NO | CASCADE | INDEX | Documents | link API |
| tax_events | operationId | fin_operations | id | N:1 | preferred | RESTRICT | INDEX | Tax | Core tax path |
| inv_*_transactions | relatedCorporateActionId | inv_corporate_actions / engine row | id | N:1 | YES | RESTRICT | INDEX | CA Engine | CA apply |

\* Holdings/txs for Crypto/Stocks/Funds/Metals: `instrumentId` required (P0 identity).

**Polymorphic** `relatedFeature+relatedId`: not a SQLite FK — mitigated by `acc_transaction_links` (Must) + domain validate + reconcile orphan.

## P1-DOC-015 — Required edge metadata

```text
source table | source column | reference table | reference column
cardinality | nullable | ON DELETE | unique | index | semantic owner | write path
```

**Acceptance (Gate D):** script lists SQLite FKs vs this matrix → zero missing edges.

ER diagrams **generated from this matrix**, not hand-maintained duplicates.
