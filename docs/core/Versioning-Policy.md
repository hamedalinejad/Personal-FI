# نسخه‌ها — تفکیک اجباری (P0)

| Version | نقش |
|---------|-----|
| **schemaVersion** | ساختار جداول / migration DB |
| **calculationVersion** | الگوریتم‌ها (loan schedule, cost basis, …) |
| **policyVersion** | rounding, tax, fee, allocation waterfall |
| **dataModelVersion** | معنای دامنه در سطح قرارداد |

مثال همزمان:

```text
DB schema = v12
Loan algorithm = v3
Rounding policy = v2
```

تغییر formula وام ≠ الزاماً schema migration.

گزارش historical با calculationVersion زمان operation؛ بازنویسی با الگوریتم جدید فقط با درخواست صریح recalculate.

---

## When a formula changes

1. Old records **unchanged** (locked calculationVersion on operation)
2. New calculation version introduced
3. Historical recalculation **explicit** only
4. Schema migration does **not** rewrite financial history amounts
