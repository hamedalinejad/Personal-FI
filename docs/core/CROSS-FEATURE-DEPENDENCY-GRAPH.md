# Cross-Feature Dependency Graph (P0-20)

```
UI / Sheets
  → Feature Public API only
    → Domain engines (loan/costBasis/CA/FX/price)
      → CanonicalFinancialOperation
        → Journal + CashSettlementPort
          → SQLite persist
```

**Allowed:** Feature → Core; Feature → other Feature **Public API** only.  
**Forbidden:** Feature A → Feature B repository/domain/ledger internals; Core → Feature.

Editions share Accounting Core; UI may hide Accounts.

```
Loan ──┐
Crypto ┤
Stocks ┼─→ CashSettlementPort → fin_accounts + fin_journal_*
Funds  ┤
Metals ┘
Tax ─→ tax_events/records + payTax operation → same journal path
Reports ─→ queries only (no write to feature ledgers)
Import ─→ import_batches → normalize → operation
```
