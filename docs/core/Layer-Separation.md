# جداسازی لایه‌ها (P0)

```text
Api DTO  ≠  Domain Entity  ≠  DB Row
```

SQLite schema = **persistence model** نه Domain Model.

```text
UI → Feature API → Application → Domain → Repository → DB
```

نام‌گذاری:

| اصطلاح | معنی |
|--------|------|
| FinancialOperation | واحد اقتصادی اتمیک |
| JournalEntry / JournalLine | دفترکل |
| DomainTransaction / *\_transactions | ردیف subledger |
| SQLite BEGIN/COMMIT | تراکنش فنی DB — **≠** Financial Operation |

Portfolio = aggregation view · Wealth/Net Worth = Cash+Investments+Physical+Receivables−Liabilities  
Generic position projection ≠ SoT (domain ledger SoT است).

Custody/location ≠ ownership.

Recurring/Budget/Goal/Notification = template/plan/alert — نه ledger.
