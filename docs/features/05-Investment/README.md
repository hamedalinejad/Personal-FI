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

---

## قرارداد Canonical زیرفیچرها

این README علاوه بر index، مرز مشترک زیرفیچرهای سرمایه‌گذاری را قفل می‌کند. در صورت تعارض با متن قدیمی یک زیرفیچر، قراردادهای Core و سپس این بخش بر مثال/متن قدیمی مقدم هستند.

### Identity
- هویت دارایی فقط `ref_instruments.id` (`instrumentId`) است.
- `symbol` فقط label نمایشی است و هرگز SoT یا کلید rebuild نیست.
- `assetKey` فقط convenience/mapping index است مگر Core برای دامنه‌ای صریحاً خلاف آن را اعلام کند.
- registry موازی feature-local به‌عنوان SoT هویت ممنوع است.

### Operation / Ledger
هر عملیات مالی یک `operationId` دارد و می‌تواند چند leg داشته باشد:
```text
Investment Operation
  ├─ domain transaction / lots / holdings
  ├─ journal
  └─ optional cash settlement (Accounts یا Standalone adapter)
```
Holding و summaryها projection هستند؛ ledger/domain events منبع rebuild هستند.

### Cash independence
وجود Accounts برای صحت Crypto/Stocks/Funds/Metals اجباری نیست. هر زیرفیچر باید بتواند با `CashSettlementPort` به Accounts متصل شود یا در حالت standalone از settlement محلی/خارجی استفاده کند. FK اجباری به `fin_accounts`/`acc_transactions` برای مسیر standalone ممنوع است.

### Cost Basis
Cost basis فقط توسط Core Cost-Basis Engine تعیین می‌شود. Featureها نباید فرمول موازی برای WAC/FIFO/transfer/bridge بسازند. داده تاریخی لازم برای rebuild باید حفظ شود؛ valuation لحظه‌ای آینده جای historical cost را نمی‌گیرد.

### Fees
هر Feature باید gross/net/fee را جدا نگه دارد وقتی fee روی quantity یا proceeds اثر می‌گذارد. `feeCurrency` و نرخ/ارزش تاریخی fee باید حفظ شوند. اثر fee بر quantity/cost/proceeds فقط طبق policy canonical است.

### Reversal
Reversal فقط از مسیر Core Financial Operation انجام می‌شود. الگوریتم feature-local برای `UPDATE isVoided + INSERT` به‌تنهایی ممنوع است. Domain reversal، journal reversal و cash reversal باید یک operation اتمیک باشند.

### Offline
Price fetching و providerهای خارجی optional هستند. نبود شبکه نباید مانع ثبت داده تاریخی، محاسبات محلی یا گزارش قابل بازسازی شود. قیمت remote هیچ‌وقت SoT historical transaction نیست.

### UI
مدل داده می‌تواند غنی باشد اما UI باید progressive disclosure داشته باشد: عملیات اصلی ساده و جزئیات network/fee/cost/tax در Advanced Details. Feature نباید برای هر entity یک صفحه مستقل بسازد مگر نیاز واقعی UX وجود داشته باشد.

---

## Audit gate

جزئیات ممیزی فعلی و موارد P0/P1 در `FEATURE-AUDIT-2026-09-01.md` و قراردادهای اصلاحی در `FEATURE-CANONICAL-CONTRACT.md` ثبت شده‌اند.
