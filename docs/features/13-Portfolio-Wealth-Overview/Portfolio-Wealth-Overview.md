# فیچر: Portfolio & Wealth Overview (پرتفوی و نمای ثروت)

## توضیح کلی

این فیچر نمای یکپارچه و تخصصی از **کل دارایی‌ها و سرمایه‌گذاری‌های** کاربر را ارائه می‌دهد.  
تمرکز اصلی آن روی پرتفوی سرمایه‌گذاری و ثروت است، نه جریان نقدی روزمره.

شامل:
- ارزش کل پرتفوی سرمایه‌گذاری
- تفکیک بین انواع دارایی‌ها (کریپتو، سهام، صندوق، فلزات، دارایی فیزیکی)
- سود و زیان تحقق‌یافته و تحقق‌نیافته
- روند ارزش پرتفوی در طول زمان
- مقایسه عملکرد نسبت به ریال و تتر

این فیچر مکمل Reports و Dashboard است:
- **Dashboard** → خلاصه سریع
- **Reports** → گزارش‌های تحلیلی و خروجی
- **Portfolio** → تمرکز عمیق روی ثروت و سرمایه‌گذاری‌ها

---

## User Stories

### Must Have
- مشاهده ارزش کل پرتفوی
- مشاهده تفکیک دارایی‌ها به تفکیک نوع (کریپتو، سهام ایران، صندوق درآمد ثابت، فلزات، دارایی فیزیکی)
- مشاهده سود و زیان کل (تحقق‌یافته و تحقق‌نیافته)
- مشاهده روند ارزش پرتفوی در بازه‌های زمانی مختلف
- مشاهده ارزش به ریال و معادل تتری
- مشاهده جزئیات هر بخش با امکان ورود به فیچر مربوطه

### Should Have
- مقایسه بازده بخش‌های مختلف
- نمایش وزن هر دارایی در پرتفوی (درصد)
- فیلتر بر اساس نوع دارایی یا پلتفرم
- نمایش کارمزدهای تجمعی پرداخت‌شده
- ذخیره Snapshot دوره‌ای از ارزش پرتفوی

---

## Business Rules

1. ارزش پرتفوی از جمع ارزش روز دارایی‌های سرمایه‌گذاری و فیزیکی محاسبه می‌شود.
2. حساب‌های بانکی نقدی می‌توانند به صورت اختیاری در محاسبه ثروت کل لحاظ شوند (با کنترل `includeCashInWealth` در تنظیمات پرتفوی).
3. بدهی‌ها و وام‌ها برای محاسبه **ثروت خالص (Net Wealth)** کسر می‌شوند.
4. سود و زیان تحقق‌نیافته بر اساس قیمت/ارزش فعلی در مقابل میانگین خرید محاسبه می‌شود.
5. سود و زیان تحقق‌یافته از تراکنش‌های فروش استخراج می‌شود.
6. تمام مقادیر قابلیت نمایش با نرخ تتر تاریخی را دارند.
7. داده‌های اصلی در فیچرهای تخصصی نگهداری می‌شوند؛ این فیچر فقط تجمیع و نمایش می‌دهد.

> **نکته مهم - جلوگیری از تکرار در محاسبه موجودی نقدی**:  
> - موجودی نقدی ریال/تتر در صرافی‌ها و کارگزاری‌ها از طریق فیچرهای Investment مدیریت می‌شود  
> - برای جلوگیری از تکرار در محاسبه ثروت:  
>   - در Investment-Crypto: برای IRR/USDT، `totalInvested = 0` و `totalFeesPaidUSDT = 0` در `inv_crypto_holdings`  
>   - در Investment-Stocks-Iran: موجودی نقدی کارگزاری به‌صورت Snapshot در `inv_stocks_iran_brokerages.cashBalance` نگهداری می‌شود (جدول `inv_stocks_iran_brokerage_transactions` فقط لاگ تراکنش‌های نقدی است، نه محل نگهداری موجودی)  
>   - در Accounts & Banking: موجودی واقعی در `acc_accounts.currentBalance` ذخیره می‌شود  
> - تابع `getPortfolioOverview()` با کنترل `includeCashInWealth` امکان انتخاب لحاظ نکردن این موجودی‌ها را فراهم می‌کند  
> - اگر `includeCashInWealth = false` (پیش‌فرض)، فقط سرمایه‌گذاری‌ها (سهام، رمزارز و ...) در محاسبه ثروت لحاظ می‌شوند

---

## ساختار ثروت و پرتفوی

**ثروت کل (Total Wealth)**
├── دارایی‌های نقدی (حساب‌های بانکی)
├── پرتفوی سرمایه‌گذاری
│   ├── کریپتو
│   ├── سهام ایران
│   ├── صندوق‌های درآمد ثابت
│   │   ├── ETF (معامله در بورس)
│   │   └── issuance_redemption (صدور/ابطال مستقیم)
│   └── فلزات (طلا، نقره، مس)
└── دارایی‌های فیزیکی
    ├── طلا و سکه فیزیکی
    ├── خودرو
    ├── املاک
    └── سایر
بدهی‌ها
└── وام‌ها و مطالبات منفی

**ثروت خالص = ثروت کل − بدهی‌ها**
---

## Domain Entities

> این فیچر بیشتر تجمیعی است. جداول زیر برای عملکرد بهتر و تاریخچه پیشنهاد می‌شوند.

### ۱. Portfolio Snapshot (جدول: `port_snapshots`)

- `id` → UUID
- `date` → datetime
- `totalInvestments` → decimal
- `totalPhysicalAssets` → decimal
- `totalCash` → decimal
- `totalLiabilities` → decimal
- `totalWealth` → decimal
- `netWealth` → decimal
- `totalWealthBase` → decimal (معادل ارز پایه کاربر — سازگار با نام‌گذاری `Base` در سایر فیچرها)
- `netWealthBase` → decimal (معادل ارز پایه کاربر)
- `schemaVersion` → integer (نسخه ساختار `breakdown` — برای backward compatibility؛ پیش‌فرض: `1`)
- `breakdown` → JSON typed به `PortfolioBreakdown` (تعریف کامل در `core/types/types.md` — بخش `portfolio.ts`)

> ⚠️ **هشدار backward compatibility**: ساختار `breakdown` هرگز بدون افزایش `schemaVersion` تغییر نکند. هنگام خواندن snapshot قدیمی، `schemaVersion` را چک کنید و در صورت نیاز migration اعمال کنید. ساختار فعلی (`schemaVersion=1`) در `core/types/types.md` تعریف شده است.

---

### ⚠️ فیلدهای اجباری برای Historical Valuation (بدون اینها Portfolio تاریخی قابل اعتماد نیست)

هنگام ساخت یک Snapshot، **هر چهار بردار تاریخی** باید در همان لحظه Snapshot شوند. بدون این فیلدها، `getPortfolioTrend()` مجبور می‌شود از قیمت فعلی، نرخ FX فعلی، یا کوانتیتی فعلی استفاده کند — که برای نمودار روند تاریخی کاملاً اشتباه است.

فیلدهای الزامی اضافه‌شده به `port_snapshots`:

- `fxRateAtSnapshot` → decimal (نرخ تبدیل baseCurrency ← USDT در **لحظه دقیق Snapshot**، از `cur_exchange_rates`)
- `fxTimestamp` → datetime (لحظه‌ای که این FX Rate از `cur_exchange_rates` گرفته شده — ممکن است با `date` اختلاف داشته باشد اگر نرخ قدیمی باشد)
- `pricesUsed` → JSON — Map از `{assetCategory}:{symbol}` به `{price, priceCurrency, priceTimestamp}` برای **هر دارایی‌ای که در این Snapshot ارزش‌گذاری شده**:
  ```json
  {
    "crypto:BTC":  { "price": "65000", "priceCurrency": "USDT", "priceTimestamp": "2024-01-15T10:30:00Z" },
    "crypto:ETH":  { "price": "3200",  "priceCurrency": "USDT", "priceTimestamp": "2024-01-15T10:30:00Z" },
    "metal:gold_18k": { "price": "2850000", "priceCurrency": "IRR", "priceTimestamp": "2024-01-15T09:00:00Z" }
  }
  ```
- `quantitiesAtSnapshot` → JSON — Map از `{assetCategory}:{symbol}:{holdingId}` به `quantity` در **لحظه Snapshot**:
  ```json
  {
    "crypto:BTC:<holdingId>": "0.45",
    "crypto:ETH:<holdingId>": "2.1",
    "metal:gold_18k:<holdingId>": "10000"
  }
  ```

> **چرا این فیلدها حیاتی هستند**:
> اگر کاربر در تاریخ X مقداری BTC داشته و بعداً بخشی را فروخته، `getPortfolioTrend()` باید بتواند ارزش تاریخی را با **کوانتیتی همان روز** و **قیمت همان روز** محاسبه کند. بدون `quantitiesAtSnapshot` و `pricesUsed`، سیستم ناچار است از `inv_crypto_holdings.quantity` فعلی استفاده کند که دیگر آن روز را نشان نمی‌دهد.
>
> **Corporate Actions (برای سهام ایران)**: تغییرات سرمایه (افزایش سرمایه، سود سهام جایزه) که تعداد سهام را تغییر می‌دهند، در `inv_stocks_iran_transactions` با `type='capital_increase'`/`'bonus_shares'` لاگ می‌شوند. `quantitiesAtSnapshot` باید **بعد از اعمال تمام Corporate Actions تا آن تاریخ** محاسبه و ذخیره شود — نه quantity خام Holding.

- `createdAt` → datetime

### ۲. Portfolio Setting (جدول: `port_settings`)

- `id` → UUID
- `includeCashInWealth` → boolean (`false` پیش‌فرض - جلوگیری از تکرار در موجودی نقدی صرافی/کارگزاری)
- `includeLiabilities` → boolean
- `defaultDisplayCurrency` → string (`IRR` یا `USDT`)
- `updatedAt` → datetime

> **نکته**: پیش‌فرض `includeCashInWealth = false` است تا از تکرار در محاسبه موجودی نقدی جلوگیری شود. موجودی نقدی ریال/تتر در صرافی‌ها (Crypto) و کارگزاری‌ها (Stocks) به صورت جداگانه در جداول آن‌ها ذخیره می‌شود.

---

## APIهای داخلی

### Portfolio APIs
- `getPortfolioOverview()` → خلاصه کامل پرتفوی و ثروت (فقط از داده‌های محلی، بدون شبکه)
- `getInvestmentBreakdown()` → تفکیک سرمایه‌گذاری‌ها
- `getPhysicalAssetsBreakdown()` → تفکیک دارایی‌های فیزیکی
- `getProfitLossSummary()` → سود/زیان کل و به تفکیک بخش
- `getPortfolioTrend(startDate, endDate)` → روند ارزش در طول زمان — **فقط از `port_snapshots` می‌خواند** (نه از Holdingهای فعلی)؛ بنابراین دقت نتیجه مستقیماً به تعداد و کیفیت Snapshotهای ذخیره‌شده بستگی دارد
- `getAllocationPercentages()` → درصد وزن هر بخش از پرتفوی

### Snapshot APIs
- `createPortfolioSnapshot()` → ثبت وضعیت کامل لحظه جاری — **باید همه چهار بردار تاریخی را یک‌جا Snapshot کند**: (۱) `fxRateAtSnapshot` از جدیدترین رکورد `cur_exchange_rates`، (۲) `fxTimestamp` همان لحظه، (۳) `pricesUsed` از جدیدترین `price_history` برای هر دارایی، (۴) `quantitiesAtSnapshot` از Holdingهای فعلی (بعد از Corporate Actions). می‌تواند Job دوره‌ای (روزانه/هفتگی) باشد.
- `getPortfolioSnapshots(startDate, endDate)` → دریافت Snapshotهای تاریخی

### Settings APIs
- `getPortfolioSettings()` → دریافت تنظیمات پرتفوی
- `updatePortfolioSettings(data)` → به‌روزرسانی تنظیمات

---

## خروجی پیشنهادی `getPortfolioOverview`

> **قانون**: همه مقادیر مالی در خروجی باید `string` (نه `number`) باشند تا با `decimal.js` در UI قابل استفاده باشند. هرگز `number`/`float` برای مبالغ مالی.

```ts
{
  totalWealth: string,           // Decimal string — به baseCurrency
  netWealth: string,
  totalWealthBase: string,       // معادل ارز پایه (baseCurrency)
  netWealthBase: string,
  changePercent: string,         // نسبت به Snapshot قبلی
  snapshotDate?: string,         // تاریخ Snapshot پایه برای changePercent
  investments: {
    total: string,
    profitLoss: string,
    unrealized: string,
    realized: string,
    sections: {
      crypto:      { value: string, profitLoss: string },
      stocksIran:  { value: string, profitLoss: string },
      fixedIncome: { value: string, profitLoss: string },
      metals:      { value: string, profitLoss: string }
    }
  },
  physicalAssets: {
    total: string,
    profitLoss: string
  },
  cash: {
    total: string
  },
  liabilities: {
    total: string
  },
  allocation: Array<{
    key: string,
    label: string,
    value: string,
    percent: string
  }>
}
```

---

## روابط با سایر فیچرها

- **Crypto**: ارزش و سود/زیان رمزارز
- **Stocks Iran**: ارزش و سود/زیان سهام
- **Fixed Income Funds**: ارزش صندوق‌های درآمد ثابت
- **Metals**: ارزش طلا، نقره و مس در پلتفرم‌ها
- **Physical Assets**: ارزش دارایی‌های فیزیکی
- **Accounts & Banking**: موجودی نقدی
- **Debt & Loan**: مانده بدهی‌ها
- **Currency**: تبدیل به تتر
- **Reports**: گزارش‌های تحلیلی عمیق‌تر
- **Dashboard**: خلاصه برای صفحه اصلی

---

## نکات طراحی

- این فیچر باید دید «ثروت» را به کاربر بدهد، نه فقط تراکنش‌های روزمره.
- تفکیک واضح بین ارزش فعلی، سود تحقق‌نیافته و سود تحقق‌یافته ضروری است.
- Snapshot روزانه باعث می‌شود روند تاریخی دقیق و سریع قابل نمایش باشد.
- درصد تخصیص (Allocation) به کاربر کمک می‌کند ترکیب دارایی‌هایش را بهتر درک کند.
- در موبایل، نمای ساده با امکان Drill-down به جزئیات هر بخش مناسب‌تر است.
- نرخ تتر تاریخی ذخیره‌شده در تراکنش‌ها و Snapshotها برای مقایسه واقعی قدرت خرید استفاده می‌شود.
