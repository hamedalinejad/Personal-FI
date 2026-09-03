# Relationship Matrix (P1-FIX-009)

> Every **actual** FK edge: cardinality, nullable, owner, write path.  
> Expand during schema freeze until coverage = 100% of schema FKs.

| From | To | FK column | Cardinality | Nullable | Owner | Write path |
|------|-----|-----------|-------------|----------|-------|------------|
| fin_journal_lines | fin_accounts | accountId / finAccountId | N:1 | NO | Accounting Core | runAtomicFinancialOperation |
| fin_journal_lines | fin_operations | operationId | N:1 | NO | Accounting Core | same |
| inv_*_transactions | ref_instruments | instrumentId | N:1 | NO* | Investment domain | Feature command → Core |
| inv_*_transactions | fin_operations | operationId | N:1 | NO | Core | same |
| acc_transactions | fin_operations | operationId | N:1 | preferred | Accounts projection | Port after journal |
| * | docs_documents | via docs_links | N:M | YES | Documents | link API |

\* Crypto/Stocks/Funds/Metals holdings and txs require instrumentId (P0 identity locks).

**Acceptance:** script lists SQLite FKs vs this matrix → zero missing edges before Gate D.
