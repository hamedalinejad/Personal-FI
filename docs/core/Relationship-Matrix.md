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

## P1-DOC-015 — Required columns (schema freeze)

Every edge must eventually list:

```text
source table | source column | reference table | reference column
cardinality | nullable | ON DELETE | unique | index | semantic owner
```

Coverage required before Gate D: CA, loan schedule/payments, fees, documents, price observations, tax links, provenance/import, polymorphic links, feature→core.

ER diagrams **generated from this matrix**, not hand-maintained duplicates.
