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
2. حساب‌های بانکی نقدی **همیشه** در محاسبه ثروت کل لحاظ می‌شوند (بدون قید و شرط). سوییچ `includeCashInWealth` صرفاً کنترل می‌کند که **موجودی نقدی ریال/تتر نگهداری‌شده در صرافی‌های رمزارز و کارگزاری‌های سهام ایران** (که در جداول Investment مربوطه ذخیره می‌شود، نه در `acc_accounts`) در محاسبه ثروت کل لحاظ شود یا نه — تا از دوباره‌شماری جلوگیری شود.
3. بدهی‌ها و وام‌ها برای محاسبه **ثروت خالص (Net Wealth)** کسر می‌شوند. منطق این محاسبه در تابع `calculateNetWorth` همین فیچر متمرکز شده — `Reports-Analytics.getNetWorth` نیز از همین تابع استفاده می‌کند تا از دو پیاده‌سازی موازی و ناهماهنگ جلوگیری شود.
4. سود و زیان تحقق‌نیافته بر اساس قیمت/ارزش فعلی در مقابل میانگین خرید محاسبه می‌شود.
5. سود و زیان تحقق‌یافته از تراکنش‌های فروش استخراج می‌شود.
6. تمام مقادیر قابلیت نمایش با نرخ تتر تاریخی را دارند.
7. داده‌های اصلی در فیچرهای تخصصی نگهداری می‌شوند؛ این فیچر فقط تجمیع و نمایش می‌دهد.

> **نکته مهم - جلوگیری از تکرار در محاسبه موجودی نقدی**: 
> - موجودی نقدی ریال/تتر در صرافی‌ها و کارگزاری‌ها از طریق فیچرهای Investment مدیریت می‌شود 
> - برای جلوگیری از تکرار در محاسبه ثروت: 
> - در Investment-Crypto: برای IRR/USDT، `totalInvested = 0` و `totalFeesPaidBase = 0` در `inv_crypto_holdings` 
> - در Investment-Stocks-Iran: موجودی نقدی کارگزاری به‌صورت Snapshot در `inv_stocks_iran_brokerages.cashBalance` نگهداری می‌شود (جدول `inv_stocks_iran_brokerage_transactions` فقط لاگ تراکنش‌های نقدی است، نه محل نگهداری موجودی) 
> - در Accounts & Banking: موجودی واقعی در `acc_accounts.currentBalance` ذخیره می‌شود 
> - تابع `getPortfolioOverview` با کنترل `includeCashInWealth` امکان انتخاب لحاظ نکردن این موجودی‌ها را فراهم می‌کند 
> - اگر `includeCashInWealth = false` (پیش‌فرض)، فقط سرمایه‌گذاری‌ها (سهام، رمزارز و ...) در محاسبه ثروت لحاظ می‌شوند

---

## ساختار ثروت و پرتفوی

**ثروت کل (Total Wealth)**
├── دارایی‌های نقدی (حساب‌های بانکی)
├── پرتفوی سرمایه‌گذاری
│ ├── کریپتو
│ ├── سهام ایران
│ ├── صندوق‌های درآمد ثابت
│ │ ├── ETF (معامله در بورس)
│ │ └── issuance_redemption (صدور/ابطال مستقیم)
│ └── فلزات (طلا، نقره، مس)
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
- `totalWealthUSDT` → decimal
- `netWealthUSDT` → decimal
- `breakdown` → JSON (جزئیات هر بخش — هم‌ساختار با خروجی `getPortfolioOverview`)
 ```json
 {
 "investments": {
 "total": number,
 "profitLoss": number,
 "unrealized": number,
 "realized": number,
 "sections": {
 "crypto": { "value": number, "profitLoss": number },
 "stocksIran": { "value": number, "profitLoss": number },
 "fixedIncome": { "value": number, "profitLoss": number },
 "metals": { "value": number, "profitLoss": number }
 }
 },
 "physicalAssets": {
 "total": number,
 "profitLoss": number
 },
 "cash": {
 "total": number
 },
 "liabilities": {
 "total": number
 },
 "allocation": Array<{
 "key": string,
 "label": string,
 "value": number,
 "percent": number
 }>
 }
 ```
- `createdAt` → datetime

### ۲. Portfolio Setting (جدول: `port_settings`)

- `id` → UUID
- `includeCashInWealth` → boolean (`false` پیش‌فرض - جلوگیری از تکرار در موجودی نقدی صرافی/کارگزاری)
- `includeLiabilities` → boolean
- `defaultDisplayCurrency` → string (`IRR` یا `USDT`)
- `updatedAt` → datetime

> **نکته**: پیش‌فرض `includeCashInWealth = false` است تا از تکرار در محاسبه موجودی نقدی جلوگیری شود. موجودی نقدی ریال/تتر در صرافی‌ها (Crypto) و کارگزاری‌ها (Stocks) به صورت جداگانه در جداول آن‌ها ذخیره می‌شود.
> **تفاوت عمدی با `getNetWorth` گزارش‌ها**: `getPortfolioOverview` با `includeCashInWealth = false` فراخوانی می‌کند (تمرکز بر پرتفوی سرمایه‌گذاری)؛ `Reports-Analytics.getNetWorth` با `includeCashInWealth = true` فراخوانی می‌کند (تصویر کامل ثروت). این تفاوت عمدی است و هر دو از `calculateNetWorth` می‌خوانند — کاربر ممکن است دو عدد متفاوت ببیند که در UI باید با برچسب مناسب («ارزش پرتفوی» در برابر «ثروت خالص کل») تفکیک شوند.

---

## APIهای داخلی

### Portfolio APIs
- `calculateNetWorth(options?: { date?: Date; includeCashInWealth?: boolean })` → **تابع Domain مشترک — منبع حقیقت واحد محاسبه ثروت خالص** (هم `getPortfolioOverview` و هم `Reports-Analytics.getNetWorth` این تابع را صدا می‌زنند)؛ خروجی: `{ totalWealth, netWealth, totalWealthUSDT, netWealthUSDT, breakdown }` — `includeCashInWealth` کنترل می‌کند موجودی نقدی صرافی/کارگزاری لحاظ شود یا نه (پیش‌فرض `false` در پرتفوی، `true` در گزارش Net Worth)
- `getPortfolioOverview` → خلاصه کامل پرتفوی و ثروت (از `calculateNetWorth({ includeCashInWealth: false })` می‌خواند)
- `getInvestmentBreakdown` → تفکیک سرمایه‌گذاری‌ها
- `getPhysicalAssetsBreakdown` → تفکیک دارایی‌های فیزیکی
- `getProfitLossSummary` → سود/زیان کل و به تفکیک بخش
- `getPortfolioTrend(startDate, endDate)` → روند ارزش در طول زمان
- `getAllocationPercentages` → درصد وزن هر بخش از پرتفوی

### Snapshot APIs
- `createPortfolioSnapshot` → ثبت وضعیت فعلی (می‌تواند Job روزانه باشد)
- `getPortfolioSnapshots(startDate, endDate)` → دریافت ساکندهای تاریخی

### Settings APIs
- `getPortfolioSettings` → دریافت تنظیمات پرتفوی
- `updatePortfolioSettings(data)` → به‌روزرسانی تنظیمات

---

## خروجی پیشنهادی `getPortfolioOverview`

```ts
{
 totalWealth: number,
 netWealth: number,
 totalWealthUSDT: number,
 netWealthUSDT: number,
 changePercent: number, // نسبت به دوره قبل
 investments: {
 total: number,
 profitLoss: number,
 unrealized: number,
 realized: number,
 sections: {
 crypto: { value: number, profitLoss: number },
 stocksIran: { value: number, profitLoss: number },
 fixedIncome: { value: number, profitLoss: number },
 metals: { value: number, profitLoss: number }
 }
 },
 physicalAssets: {
 total: number,
 profitLoss: number
 },
 cash: {
 total: number
 },
 liabilities: {
 total: number
 },
 allocation: Array<{
 key: string,
 label: string,
 value: number,
 percent: number
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

---

## راهنمای پیاده‌سازی
- `calculateNetWorth` منبع حقیقت واحد ثروت
- قیمت‌ها فقط `getLatestPrice`؛ بدون fetch شبکه در Portfolio
- `includeCashInWealth` رفتار IRR/USDT داخلی صرافی را کنترل می‌کند
- snapshot اختیاری برای روند تاریخی

---

## Valuation As-Of

هر جزء دارایی در خروجی Portfolio:

```ts
{ instrumentId, value, price, priceAsOf, marketDate?, fetchedAt, isStale, sourceId }
```

- `priceAsOf = marketDate ?? fetchedAt` (اولویت marketDate برای stock/fif)
- UI مجموع ثروت را با توضیح «بر اساس قیمت‌های as-of مختلط» نشان می‌دهد اگر تاریخ‌ها یک روز نیستند
- ممنوع نمایش NAV دیروز به‌عنوان «قیمت لحظه‌ای امروز» بدون برچسب

---

## Portfolio Engine — Source of Truth

```text
Portfolio / Net Worth  =  f( live inputs )  —  هرگز port_snapshots به‌عنوان SoT
```

| ورودی | منبع حقیقت |
|--------|------------|
| holdings qty/cost | Domain ledgers + CostBasisEngine |
| price | getLatestPrice (policy) |
| FX | convert(..., asOf) |
| bank cash | acc_transactions rebuild |
| brokerage/platform cash | ledger نقدی همان فیچر |
| liabilities | ln_loans remaining (+ سایر بدهی‌ها) |

`port_snapshots` فقط **cache/projection تاریخی** برای نمودار است؛ rebuild از ورودی‌های بالا.  
گزارش‌ها حق ندارند فقط از آخرین snapshot بخوانند مگر با برچسب «cached as-of».

---

## فرمول Net Worth (اجباری)

```text
Assets =
  Σ bank balances (acc, base currency)
  + Σ crypto holdings × price ( + exchange cash if includeCashInWealth )
  + Σ stock holdings × price ( + brokerage cash if includeCashInWealth )
  + Σ fund units × mark (nav or redemption mode)
  + Σ metals × price
  + Σ physical assets valuation
  + other receivables if modeled

Liabilities =
  Σ loan remainingBalance (borrowed)
  + credit card / debt payables if modeled
  − (optional) exclude loans where user is lender / receivable side tracked as asset

NetWorth = Assets − Liabilities
```

**ممنوع:** برچسب «Net Worth» برای فقط جمع دارایی‌ها بدون کسر بدهی.  
UI باید `totalAssets`, `totalLiabilities`, `netWorth` را جدا نشان دهد.
