# معماری نهایی (خلاصه قفل)

```text
UI / PWA  +  Feature Public APIs
        ↓
   Feature Layer (Accounts, Loans, Crypto, Stocks, Funds, …)
        ↓
   Financial Core (Operation · Journal · Audit)
        ↓
   Domain Ledgers
        ↓
   SQLite / sql.js → IndexedDB
```

| | |
|--|--|
| Price API | Valuation only |
| Internet | Optional enhancement |
| License | Separate from financial data |
| Report | Ledger → calc → report |
| Snapshot | Cache only |

## اولویت Documentation (وضعیت)

### P0 — قبل از Feature implementation
| مورد | وضعیت تقریبی |
|------|----------------|
| Crypto Cash SoT | ✅ SoT Matrix + crypto cash |
| Gross/Fee/Net qty | ✅ Fee matrix + crypto |
| Asset Registry یکسان | ✅ ref_instruments only |
| Account layers تفکیک | ✅ Account-Layers |
| Standalone Feature Contract | ✅ Feature-Independence |
| Dependency Matrix | ✅ Domain-Dependency |
| Raw/Derived/Snapshot | ✅ Field-Level-SoT |
| Data Preservation | ✅ + attachments |
| Currency vs Asset | ✅ economicKind |

### P1
| مورد | وضعیت |
|------|--------|
| Loan Schedule + Calendar | ✅ در Loan doc |
| Iran business dates | ✅ Iran Core + Date matrix |
| Accounting Core / Journal | ✅ Accounting-Core |
| Reversal مشترک | ✅ Canonical Operation |
| Import/Export | ✅ Import + backup docs |
| Backup/Restore | ✅ 06-migration-backup |
| Document preservation | ✅ این سند |

جزئیات: SPEC-FREEZE.md
