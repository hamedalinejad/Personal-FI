# Personal-FI Product Principle (P0)

```text
The system may be internally sophisticated,
but every user-facing operation must remain simple,
direct, and understandable.

Complexity belongs to the Domain,
not to the User Interface.
```

**فارسی:** سیستم از داخل می‌تواند بسیار دقیق و حرفه‌ای باشد؛ کاربر نباید مجبور باشد پیچیدگی داخلی (journal, operation, cost pool, adapter, snapshot) را بفهمد.

## پیامدها

| لایه | قانون |
|------|--------|
| UI | فرم ساده؛ Advanced اختیاری |
| Domain | کامل، دقیق، multi-engine |
| Pages | حداکثر ۹؛ نه انفجار route |
| Feature flags | Navigation Visibility جدا از پیچیدگی داخلی |

### مثال Crypto

کاربر می‌بیند: صرافی، رمزارز، مقدار، قیمت، کارمزد، منبع پرداخت، تاریخ، یادداشت.  
سیستم می‌سازد: Operation · Domain event · Cash settlement · Journal · Cost basis · Audit · Snapshot.

### مثال Loan

فرم پایه: نوع، طرف، مبلغ، نرخ، روش، اقساط، تاریخ‌ها، کارمزد، حساب.  
Advanced: Day Count، Allocation، Early Payment، Variable Rate، Fee Policies.
