# Schema Freeze Coverage Checklist (OPEN-001)

> **Gate D blocker.** Every table that appears in feature/core docs must have a full column row before Feature coding beyond Core math helpers.

## Required columns per field

```text
table
column
sqlType          // TEXT | INTEGER | REAL forbidden for money
nullable
default
pk / unique / index
fk → table.column
onDelete         // RESTRICT preferred for financial parents
fieldKind        // RAW | DERIVED | SNAPSHOT | EXTERNAL_REPORTED | LABEL | SYSTEM_INDEX
owner
sot              // which ledger/engine owns truth
precisionPolicy  // money | qty | rate | n/a
migration        // preserve | rebuild | map
```

## Priority tables (must be 100% before first Feature command code)

| Table | Owner | Status |
|-------|-------|--------|
| fin_accounts | Accounting Core | REQUIRED |
| fin_operations | Accounting Core | REQUIRED |
| fin_journal_entries | Accounting Core | REQUIRED |
| fin_journal_lines | Accounting Core | REQUIRED |
| ref_instruments | Identity | REQUIRED |
| acc_accounts | Accounts projection | REQUIRED |
| acc_transactions | Accounts event/projection | REQUIRED |
| inv_crypto_holdings | Crypto | REQUIRED |
| inv_crypto_transactions | Crypto | REQUIRED |
| inv_stocks_iran_holdings | Stocks | REQUIRED |
| inv_stocks_iran_transactions | Stocks | REQUIRED |
| inv_fif_funds | FIF | REQUIRED — must FK instrumentId |
| inv_fif_holdings | FIF | REQUIRED |
| inv_fif_transactions | FIF | REQUIRED |
| ln_loans | Loan | REQUIRED |
| ln_transactions | Loan | REQUIRED |
| price_history | Price | REQUIRED |
| cur_exchange_rates | Currency | REQUIRED |

## OPEN-011 Fund identity schema lock

```sql
-- inv_fif_funds
id            TEXT PRIMARY KEY  -- fundId (entity)
instrumentId  TEXT NOT NULL REFERENCES ref_instruments(id)
UNIQUE(instrumentId)            -- one fund product row per instrument in v1
-- holdings / txs / price_history use instrumentId, never fundId alone as investment identity
```

## Drift test (Gate D)

```text
documented tables/columns  ↔  schema.sql
documented FKs             ↔  Relationship-Matrix.md
undocumented financial fields → FAIL
```

Placeholder harness: `src/architecture/schemaCoverage.test.ts` (documents expectation until schema.sql lands).

## B-001

Executable skeleton: `docs/core/db/schema.sql`. Drift test target: docs checklist ↔ this file ↔ schema.sql = 0.
