# فیچر: Reports & Analytics (گزارش‌ها و تحلیل‌ها)

## توضیح کلی

این فیچر مرکز گزارش‌گیری و تحلیل سیستم است. 
داده‌های تمام فیچرها را جمع‌آوری می‌کند و گزارش‌های مالی جامع، مقایسه‌ای و تاریخی در اختیار کاربر قرار می‌دهد.

گزارش‌ها به صورت **تجمیعی (Aggregator)** عمل می‌کنند و خودشان داده اصلی تولید نمی‌کنند، بلکه از API و داده‌های سایر فیچرها استفاده می‌کنند.

هدف اصلی:
- دید شفاف از وضعیت مالی
- تحلیل درآمد، هزینه، سرمایه‌گذاری و ثروت
- مقایسه عملکرد در بازه‌های زمانی مختلف
- پشتیبانی از نمایش به ریال و معادل تتری (با نرخ تاریخی)

---

## User Stories

### Must Have
- گزارش جریان نقدی (Cash Flow)
- گزارش درآمد و هزینه (ماهانه / سالانه)
- گزارش ارزش خالص دارایی (Net Worth)
- گزارش عملکرد سرمایه‌گذاری‌ها
- گزارش مالیات‌ها (پرداخت‌شده، در انتظار، معوق)
- گزارش بودجه در مقابل عملکرد واقعی
- فیلتر بر اساس بازه زمانی، حساب و دسته
- مشاهده روند Net Worth در طول زمان

### Should Have
- خروجی Excel و PDF
- گزارش سود و زیان سرمایه‌گذاری‌ها (تحقق‌یافته و تحقق‌نیافته)
- مقایسه ماه‌به‌ماه و سال‌به‌سال
- گزارش چک‌ها، وام‌ها و اهداف
- نمودارهای تعاملی

---

## Business Rules

1. تمام گزارش‌ها بر اساس داده‌های واقعی ثبت‌شده در سایر فیچرها ساخته می‌شوند.
2. مبالغ به صورت پیش‌فرض به **ریال** نمایش داده می‌شوند.
3. امکان نمایش معادل **تتری** با استفاده از نرخ‌های تاریخی ذخیره‌شده وجود دارد.
4. گزارش Net Worth شامل تمام حساب‌ها، سرمایه‌گذاری‌ها و دارایی‌های فیزیکی است.
5. هزینه‌ها و درآمدهای آرشیو یا لغوشده در گزارش‌ها لحاظ نمی‌شوند (مگر فیلتر خاص).
6. بازه زمانی گزارش باید توسط کاربر قابل انتخاب باشد.
7. داده‌های گزارش نباید مستقیماً در این فیچر ذخیره شوند (مگر کش موقت برای عملکرد بهتر).

---

## انواع گزارش‌های اصلی

### ۱. جریان نقدی (Cash Flow)
- ورودی‌ها (درآمدها)
- خروجی‌ها (هزینه‌ها)
- خالص جریان نقدی در بازه زمانی

### ۲. درآمد و هزینه
- مجموع درآمدها به تفکیک دسته
- مجموع هزینه‌ها به تفکیک دسته
- مقایسه با دوره قبل

### ۳. ارزش خالص دارایی (Net Worth)
- مجموع دارایی‌ها (حساب‌ها + سرمایه‌گذاری‌ها + دارایی‌های فیزیکی)
- مجموع بدهی‌ها (وام‌ها و بدهی‌ها)
- Net Worth = دارایی‌ها − بدهی‌ها
- روند تغییرات در طول زمان

### ۴. عملکرد سرمایه‌گذاری
- ارزش فعلی پرتفوی (کریپتو، سهام، صندوق، فلزات)
- سود و زیان تحقق‌یافته و تحقق‌نیافته
- بازده کل

### ۵. مالیات‌ها
- مجموع مالیات‌های پرداخت‌شده به تفکیک نوع
- مجموع مالیات‌های در انتظار
- مجموع مالیات‌های معوق
- پرداخت‌ها به تفکیک حساب بانکی

### ۶. بودجه در مقابل واقعیت
- مبلغ تخصیص‌داده‌شده هر پاکت
- مبلغ مصرف‌شده
- انحراف از بودجه

### ۷. گزارش‌های تکمیلی
- وضعیت چک‌ها
- اقساط وام و مانده بدهی‌ها
- پیشرفت اهداف مالی
- کارمزدهای پرداخت‌شده

---

## Domain Entities

> این فیچر عمدتاً داده‌محور نیست و بیشتر از داده‌های سایر فیچرها استفاده می‌کند. 
> در صورت نیاز به کش یا ذخیره تنظیمات گزارش، جداول زیر پیشنهاد می‌شود.

### ۱. Report Preset (جدول: `rep_presets`)

- `id` → UUID
- `name` → string (نام گزارش ذخیره‌شده)
- `reportType` → string
- `filters` → JSON (بازه زمانی، حساب‌ها، دسته‌ها و ...)
- `createdAt` → datetime
- `updatedAt` → datetime

### ۲. Net Worth Snapshot (جدول: `rep_net_worth_snapshots`) — اختیاری

- `id` → UUID
- `date` → datetime
- `totalAssets` → **decimal TEXT** (string) — P0-078؛ مطابق Financial-Invariants / API-Result (نه IEEE number)
- `totalLiabilities` → decimal TEXT
- `netWorth` → decimal TEXT
- `netWorthUSDT` → decimal TEXT (یا netWorthInQuote با quoteCurrency)
- هر فیلد مالی persist/API در این فیچر: decimal string؛ JSON number برای پول ممنوع.
- `createdAt` → datetime

> این جدول برای نمایش روند تاریخی Net Worth و افزایش سرعت گزارش‌گیری مفید است.

---

## APIهای داخلی

### Report APIs
- `getCashFlow(startDate, endDate, accountIds?)`
- `getIncomeExpenseReport(startDate, endDate, groupBy?)`
- `getNetWorth(date?)` → ارزش خالص as-of تاریخ — **Wrapper** روی `Portfolio-Wealth-Overview.calculateNetWorth({ date, includeCashInWealth: true })`.
>
> ### P0-079 — Historical as-of reconstruction
> - اگر `date` داده شود، **ممنوع** است از current cash/holding snapshots خام استفاده شود.
> - باید cash / asset / liability را as-of آن تاریخ از ledgerها (و snapshotهای validated تا آن تاریخ) reconstruct کند.
> - `rep_net_worth_snapshots` فقط cache rebuildپذیر است؛ SoT = ledgers + price/fx as-of.
> - Wrapper حق ندارد current balances را برای historical date برگرداند.
- `getNetWorthTrend(startDate, endDate)` → روند Net Worth
- `getInvestmentPerformance(startDate?, endDate?)`
- `getTaxSummary(year?)` → خلاصه مالیات‌ها (پرداخت‌شده، در انتظار، معوق)
- `getBudgetVsActual(budgetId)`
- `getCategoryBreakdown(type, startDate, endDate)` → درآمد یا هزینه به تفکیک دسته
- `getLoansSummary`
- `getGoalsProgress`
- `getChequesSummary`

### Export APIs
- `exportReportToExcel(reportType, filters)`
- `exportReportToPDF(reportType, filters)`

### Snapshot APIs
- `createNetWorthSnapshot` → ثبت وضعیت فعلی (می‌تواند Job روزانه باشد)
- `getNetWorthSnapshots(startDate, endDate)`

---

## روابط با سایر فیچرها

- **Accounts & Banking**: موجودی حساب‌ها
- **Income / Expense**: جریان درآمد و هزینه
- **Investment (Crypto, Stocks, Funds, Metals)**: ارزش پرتفوی و سود/زیان
- **Physical Assets**: ارزش دارایی‌های فیزیکی
- **Debt & Loan**: مانده بدهی‌ها
- **Budget**: مقایسه بودجه با عملکرد
- **Financial Goals**: پیشرفت اهداف
- **Cheque Management**: وضعیت چک‌ها
- **Tax Management**: گزارش مالیات‌ها (پرداخت‌شده، در انتظار، معوق)
- **Currency**: تبدیل و نمایش معادل تتری
- **Dashboard**: تأمین داده برای ویجت‌های اصلی
- **Reports / Dashboard**: تأمین داده برای نمایش وضعیت مالیات

---

## ساختار پیشنهادی Net Worth

### دارایی‌ها:

- موجودی حساب‌های بانکی
- ارزش پرتفوی کریپتو
- ارزش پرتفوی سهام ایران
- ارزش صندوق‌های درآمد ثابت
- ارزش فلزات (پلتفرم‌ها — holding)
- **موجودی نقدی پلتفرم‌ها/کارگزاری‌های سرمایه‌گذاری** (شرطی — فقط اگر `includeCashInWealth = true` در تنظیمات پرتفوی؛ منابع: `inv_metals_platforms.cashBalance` + `inv_stocks_iran_brokerages.cashBalance`)
- ارزش دارایی‌های فیزیکی

### بدهی‌ها:

- مانده وام‌های دریافتی
- بدهی‌ها و اقساط معوق
- **چک‌های پرداختی معلق (اختیاری)**: چک‌های صادرشده با وضعیت `pending` که هنوز از حساب کسر نشده‌اند یک تعهد مالی آتی واقعی‌اند. `getNetWorth` می‌تواند این مبلغ را (از طریق `getPendingPayableChequesByAccount`) به‌عنوان بدهی احتمالی نمایش دهد تا کاربر بین «Net Worth فعلی» و «Net Worth پس از تسویه تعهدات معلق» تمایز قائل شود. (مرتبط با مورد ۲۱ — `getAvailableBalance`)

### Net Worth = دارایی‌ها − بدهی‌ها

---

## راهنمای پیاده‌سازی
- گزارش‌ها **read-only**؛ از ledger/journal و API فیچرها — بدون SQL خام به جداول دیگران در لایه UI
- `getNetWorth` Wrapper روی `Portfolio.calculateNetWorth`
- فیلتر تاریخ روی businessDate/date؛ فقط isVoided=false
- مبالغ خروجی decimal string + تبدیل اختیاری به base
>
> ### P0-080 — Cross-currency / USDT historical conversion path
> - وقتی خروجی چندارزی یا USDT historical است و مسیر >1 hop دارد (مثلاً IRR→USDT→USD یا asset quote → bridge → base)، باید **conversionPath** (لیست نرخ‌ها + asOf هر hop) ذخیره/برگردانده شود.
> - فقط یک `exchangeRate` تکی وقتی مسیر چندمرحله‌ای است = cross-currency wrong.
> - Valuation graph از Currency-CrossRate + price as-of؛ Reports مصرف‌کننده path است نه inventor نرخ.


## فقط Query layer

Reports **Ledger جدید نمی‌سازد**. Query روی Accounting + Investment + Loan + …


---

## Report ≠ SoT مالی مستقل (P0)

```text
Query → Ledger → Engine → Report
```

جدول‌هایی مثل `profit_total` به‌عنوان حقیقت مستقل **ممنوع**اند مگر snapshot cache قابل rebuild.

Profit / Cashflow / Net Worth از ledger + engines محاسبه می‌شوند؛ cache فقط performance است.

---

## Reporting / Valuation layer (P0)

Report حسابداری را دور نمی‌زند.

```text
Journal + Subledger + Price + FX  →  Valuation / Reporting  →  UI
```

ممنوع: جمع خام `crypto.quantity` + `stock.value` + `loan.balance` بدون لایه valuation.

---

## گزارش سنگین آفلاین (P1)

گزارش‌های سنگین نباید هر بار full scan ledger روی UI thread بزنند.

ترجیح: خواندن از `account_snapshots_daily` / `portfolio_snapshots_daily` (یا معادل) که با job پس‌زمینه/زمان‌بندی محلی ساخته می‌شوند؛ SoT همچنان ledger است و snapshot rebuildپذیر.

---

## Cache گزارش + شفافیت زمان (P3)

اگر از snapshot/cache استفاده می‌شود:

- UI باید `lastRebuiltAt` (یا معادل) را نشان دهد
- در صورت stale بودن نسبت به آخرین operation → هشدار یا دکمه Rebuild
- گزارش رسمی می‌تواند اجبار به rebuild قبل از export داشته باشد

---

## Stock / Portfolio P&L زمان‌مند (P1)

P&L دوره ≠ فقط از current holding.

مرز گزارش:

```text
opening position
opening cost
period transactions
realized P&L
closing position
closing valuation
```

مثال: Buy 100 → Sell 50 → hold 50 — realized فقط روی 50 فروخته‌شده در دوره.

---

## Report Query API (نه SQL مستقیم)

`getNetWorth` · `getInvestmentPerformance` · `getLoanSummary` · Income Statement · Cash Flow · Trial Balance · …

UI گزارش به جداول `ln_*` / `inv_*` وابسته نیست — فقط Report/Feature/Capability API.

Global Search و Advanced Filter در Query Contract: dateFrom/To, account, party, instrument, currency, type, source, status + pagination.

## Reports/Portfolio/Dashboard RP locks (P0)

Full RP-001…RP-009: `REPORTS-PORTFOLIO-RP-001-009-LOCKS.md`

