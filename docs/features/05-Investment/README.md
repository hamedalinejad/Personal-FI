# Investment — مشخصات (نه پوشه خالی)

| زیرفیچر | فایل مشخصات (Spec) |
|---------|-------------------|
| Crypto | [05-01-Investment-Crypto/Investment-Crypto.md](./05-01-Investment-Crypto/Investment-Crypto.md) |
| Stocks Iran | [05-02-Investment-Stocks-Iran/Investment-Stocks-Iran.md](./05-02-Investment-Stocks-Iran/Investment-Stocks-Iran.md) |
| FIF | [05-03-Fixed-Income-Funds/Fixed-Income-Funds.md](./05-03-Fixed-Income-Funds/Fixed-Income-Funds.md) |
| Metals | [05-04-Metals/Investment-Metals.md](./05-04-Metals/Investment-Metals.md) |

مکمل: Iran-Market-Rules · Settlement-Accounting · Corporate-Actions-Spec · Cost-Basis-Engine · Fee-Treatment-Matrix · Price-Fetching

---

## cash_side اختیاری (Standalone Investment)

هر زیرفیچر (Crypto / Stocks / Funds / Metals) می‌تواند بدون Accounts کار کند:

| حالت | رفتار |
|------|--------|
| با cash_side / Banking | SettlementPort → به‌روزرسانی cash ledger |
| بدون (مثلاً طلا دستی) | فقط lots / holdings / realized PnL از domain ledger + journal؛ **بدون** الزام account_snapshot بانکی |

همان الگوی Loan: Integrated vs Standalone.
