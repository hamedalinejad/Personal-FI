# فیچر: Dashboard (داشبورد)

## توضیح کلی

داشبورد صفحه اصلی نرم‌افزار است و خلاصه‌ای سریع و بصری از وضعیت مالی کاربر را نمایش می‌دهد. 
هدف آن این است که کاربر بلافاصله پس از ورود، مهم‌ترین اطلاعات مالی خود را ببیند بدون نیاز به رفتن به بخش‌های مختلف.

داشبورد داده‌ای تولید نمی‌کند؛ بلکه از API فیچرهای دیگر (Reports، Accounts، Budget، Goals و ...) استفاده می‌کند و اطلاعات را در قالب **ویجت‌های قابل تنظیم** نمایش می‌دهد.

---

## User Stories

### Must Have
- مشاهده خلاصه وضعیت مالی در یک نگاه
- مشاهده موجودی کل حساب‌ها
- مشاهده درآمد و هزینه ماه جاری
- مشاهده ارزش خالص دارایی (Net Worth) و روند آن
- مشاهده وضعیت بودجه ماه جاری
- مشاهده اهداف مالی فعال و پیشرفت آن‌ها
- مشاهده سررسیدهای نزدیک (قبوض، اقساط، چک‌ها، مالیات)
- مشاهده اعلان‌های خوانده‌نشده مهم

### Should Have
- قابلیت تنظیم و جابه‌جایی ویجت‌ها
- انتخاب ویجت‌های مورد علاقه
- میانبر سریع برای ثبت درآمد / هزینه
- نمودارهای کوچک و خوانا
- نمایش معادل تتری در کنار مقادیر ریالی

---

## Business Rules

1. داشبورد فقط داده‌ها را نمایش می‌دهد و منطق کسب‌وکار ندارد.
2. تمام اعداد از فیچرهای دیگر خوانده می‌شوند.
3. داده‌های حساس (مثل موجودی) فقط در صورت احراز هویت کاربر نمایش داده می‌شوند.
4. در حالت آفلاین، آخرین داده‌های کش‌شده نمایش داده می‌شود.
5. کاربر می‌تواند ترتیب و نمایش ویجت‌ها را شخصی‌سازی کند (در صورت پیاده‌سازی).
6. ویجت‌های بحرانی (مثل بودجه تمام‌شده یا سررسید معوق) باید برجسته شوند.

---

## ویجت‌های اصلی داشبورد

### ۱. خلاصه مالی سریع
- موجودی کل حساب‌ها
- درآمد ماه جاری
- هزینه ماه جاری
- خالص جریان نقدی ماه

### ۲. ارزش خالص دارایی (Net Worth)
- مقدار فعلی Net Worth
- تغییر نسبت به ماه قبل
- نمودار روند کوتاه (مثلاً ۶ ماه اخیر)

### ۳. بودجه ماه جاری
- درصد مصرف کلی بودجه
- پاکت‌های نزدیک به سقف یا تجاوزکرده
- لینک سریع به صفحه بودجه

### ۴. اهداف مالی
- ۲ تا ۳ هدف اولویت‌دار
- نوار پیشرفت هر هدف
- مبلغ باقی‌مانده

### ۵. سررسیدهای نزدیک
- قبوض و تراکنش‌های تکرارشونده نزدیک
- اقساط وام نزدیک
- چک‌های نزدیک به سررسید
- مالیات‌های نزدیک به سررسید
- موارد معوق (با رنگ هشدار)

### ۶. پرتفوی سرمایه‌گذاری (خلاصه)
- ارزش کل سرمایه‌گذاری‌ها
- سود/زیان تحقق‌یافته (Realized) و تحقق‌نیافته (Unrealized) — جداگانه، **هرگز ترکیب نشوند**
- تفکیک کلی (کریپتو، سهام، صندوق، فلزات)

### ۷. اعلان‌ها
- تعداد اعلان‌های خوانده‌نشده
- مهم‌ترین اعلان‌های اخیر

### ۸. میانبرهای سریع
- ثبت درآمد
- ثبت هزینه
- انتقال بین حساب‌ها
- ثبت چک

---

## Domain Entities

> داشبورد عمدتاً بدون داده پایدار است. 
> فقط تنظیمات شخصی‌سازی کاربر ذخیره می‌شود.

### ۱. Dashboard Layout (جدول: `dash_layouts`)

- `id` → UUID
- `widgets` → JSON (لیست ویجت‌ها + ترتیب + تنظیمات هر ویجت)
- `updatedAt` → datetime

### ۲. Dashboard Widget Config (ساختار هر آیتم درون فیلد JSON `dash_layouts.widgets`)

> **تصمیم معماری**: این Entity **جدول SQL مجزا نیست** — صرفاً schema هر آیتم درون آرایه `dash_layouts.widgets` را مستند می‌کند. چیدمان ویجت‌ها نیازی به Query رابطه‌ای ندارد و نگه‌داشتن آن داخل JSON کافی است.

- `widgetKey` → string (`net_worth`, `budget`, `goals`, ...)
- `isVisible` → boolean
- `order` → number
- `settings` → JSON (تنظیمات خاص هر ویجت)

---

## APIهای داخلی

### Dashboard APIs
- `getDashboardData(ctx?: { asOf?: Date; businessDate?: Date })` → دریافت یکجای داده‌های داشبورد  
  **P0-087**: یک context مشترک `asOf` / `businessDate` به **همه** widget queryها پاس داده می‌شود. ویجت‌ها حق ندارند هر کدام «الان» جداگانه بخوانند مگر asOf صریح همان ctx.
- `getWidgetData(widgetKey, ctx?)` → همان context؛ در صورت نبود، از ctx آخرین getDashboardData یا now مستند.
- `getDashboardLayout` → دریافت چیدمان ذخیره‌شده کاربر
- `updateDashboardLayout(layout)` → ذخیره چیدمان جدید

### داده‌های تجمیعی مورد نیاز
- `getAccountsSummary`
- `getMonthlyCashFlow`
- `getNetWorthSummary`
- `getBudgetSummary`
- `getActiveGoalsSummary`
- `getUpcomingDueItems`
- `getInvestmentSummary`
- `getUnreadNotificationsCount`

---

## روابط با سایر فیچرها

- **Accounts & Banking**: موجودی حساب‌ها
- **Income / Expense**: درآمد و هزینه ماه
- **Reports**: Net Worth و روندها
- **Budget**: وضعیت بودجه
- **Financial Goals**: پیشرفت اهداف
- **Bills & Recurring**: سررسیدها
- **Debt & Loan**: اقساط نزدیک
- **Cheque Management**: چک‌های نزدیک
- **Tax Management**: مالیات‌های نزدیک
- **Investment (همه زیر‌فیچرها)**: خلاصه پرتفوی
- **Notification**: اعلان‌های خوانده‌نشده
- **Currency**: نمایش معادل تتری

---



### P0-088 — Offline / cache freshness (per widget)

هر widget در پاسخ dashboard باید بتواند نشان دهد:

| field | معنی |
|-------|------|
| `asOf` | لحظه/تاریخ داده |
| `lastRebuiltAt` | آخرین rebuild از SoT |
| `stale` | boolean |
| `staleReason?` | cache age / offline / missing price |

Cached dashboard **نباید** همه ویجت‌ها را یکجا «تازه» نشان دهد وقتی یکی stale است. UI می‌تواند badge per-widget نشان دهد.

## ساختار پیشنهادی داده خروجی `getDashboardData`

```ts
{
 accounts: {
 totalBalance: string  // decimal,
 totalBalanceUSDT: string  // decimal
 },
 cashFlow: {
 income: string  // decimal,
 expense: string  // decimal,
 net: string  // decimal
 },
 netWorth: {
 current: string  // decimal,
 changePercent: string  // decimal, e.g. "12.5",
 trend: Array<{ date: string, value: string  // decimal }>
 },
 budget: {
 totalAssigned: string  // decimal,
 totalSpent: string  // decimal,
 percentUsed: string  // decimal,
 criticalEnvelopes: Array<...>
 },
 goals: Array<{
 id: string,
 name: string,
 progressPercent: string  // decimal,
 remaining: string  // decimal
 }>,
 upcoming: Array<{
 type: 'bill' | 'loan' | 'cheque' | 'tax',
 title: string,
 dueDate: string,
 amount: string  // decimal,
 status: string
 }>,
 investments: {
 totalValue: string  // decimal,
 realizedPL: string  // decimal, // سود/زیان تحقق‌یافته — جداگانه نگه داشته شود
 unrealizedPL: string  // decimal // سود/زیان تحقق‌نیافته — جداگانه نگه داشته شود
 // ممنوع: ترکیب این دو در یک فیلد profitLoss واحد (طبق قاعده سرتاسری پروژه)
 },
 notifications: {
 unreadCount: number
 }
}
```

---

## راهنمای پیاده‌سازی
- Dashboard فقط aggregate از Feature APIs (Accounts, Portfolio, Notifications, …)
- بدون business logic مالی جدید
- layout از `stg_settings` / dash_layouts

---

## قرارداد نوع داده Dashboard

همه **مبالغ و نرخ‌های مالی** در `getDashboardData` و ویجت‌ها: **`string` (decimal)** — نه `number`/`float`.

شمارنده‌های غیرمالی (مثل `unreadCount`) می‌توانند `number` (integer count) باشند.

منبع اعداد گزارش کلی: journal / projections مشتق — **نه** SUM دوباره از exp+journal.

---

## Dashboard محل محاسبات نیست

```text
Dashboard → Application Query → Portfolio/Report Engine → Ledger
```

**ممنوع:** SQL مستقیم از UI به چند جدول برای جمع Net Worth.

Net Worth: `wealthQuery.getNetWorth(asOf)` — نه محاسبه داخل Dashboard component.

---

## Dashboard = مصرف‌کننده (P0)

```text
Dashboard → Queries → Reporting / Valuation
```

نه SQL مستقیم و نه محاسبه Domain داخل ویجت. UI → Feature/Capability API → Domain.

---

ناوبری و جایگاه Wealth: `Pages-IA.md` — Dashboard یکی از ۹ صفحه اصلی است؛ `/wealth` route مستقل نیست.


### P0-089 — Fast summary / snapshot not sole truth

- APIهای خلاصه سریع می‌توانند از projection/snapshot بخوانند **فقط اگر** آن projection:
  1. از ledger/SoT قابل rebuild باشد، و
  2. با `asOf` / `lastRebuiltAt` / نسخه schema مشخص باشد، و
  3. در صورت mismatch با reconcile، flag یا rebuild path داشته باشد.
- Dashboard **مجاز نیست** snapshot را به‌عنوان حقیقت غیرقابل‌اعتبارسنجی مصرف کند (هم‌راستا با Core: snapshot projection only).

## Reports/Portfolio/Dashboard RP locks (P0)

Full RP-001…RP-009: `docs/features/11-Reports-Analytics/REPORTS-PORTFOLIO-RP-001-009-LOCKS.md`

