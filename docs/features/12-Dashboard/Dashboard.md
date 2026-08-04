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
- مشاهده سررسیدهای نزدیک (قبوض، اقساط، چک‌ها)
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
- موارد معوق (با رنگ هشدار)

### ۶. پرتفوی سرمایه‌گذاری (خلاصه)
- ارزش کل سرمایه‌گذاری‌ها
- سود/زیان تقریبی
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

### ۱. Dashboard Layout (جدول: `dashboard_layouts`)

- `id` → UUID
- `widgets` → JSON (لیست ویجت‌ها + ترتیب + تنظیمات هر ویجت)
- `updatedAt` → datetime

### ۲. Dashboard Widget Config (درون JSON یا جدول جدا)

- `widgetKey` → string (`net_worth`, `budget`, `goals`, ...)
- `isVisible` → boolean
- `order` → number
- `settings` → JSON (تنظیمات خاص هر ویجت)

---

## APIهای داخلی

### Dashboard APIs
- `getDashboardData()` → دریافت یکجای داده‌های اصلی داشبورد
- `getWidgetData(widgetKey)` → دریافت داده یک ویجت خاص
- `getDashboardLayout()` → دریافت چیدمان ذخیره‌شده کاربر
- `updateDashboardLayout(layout)` → ذخیره چیدمان جدید

### داده‌های تجمیعی مورد نیاز
- `getAccountsSummary()`
- `getMonthlyCashFlow()`
- `getNetWorthSummary()`
- `getBudgetSummary()`
- `getActiveGoalsSummary()`
- `getUpcomingDueItems()`
- `getInvestmentSummary()`
- `getUnreadNotificationsCount()`

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
- **Investment (همه زیر‌فیچرها)**: خلاصه پرتفوی
- **Notification**: اعلان‌های خوانده‌نشده
- **Currency**: نمایش معادل تتری

---

## ساختار پیشنهادی داده خروجی `getDashboardData`

```ts
{
  accounts: {
    totalBalance: number,
    totalBalanceUSDT: number
  },
  cashFlow: {
    income: number,
    expense: number,
    net: number
  },
  netWorth: {
    current: number,
    changePercent: number,
    trend: Array<{ date: string, value: number }>
  },
  budget: {
    totalAssigned: number,
    totalSpent: number,
    percentUsed: number,
    criticalEnvelopes: Array<...>
  },
  goals: Array<{
    id: string,
    name: string,
    progressPercent: number,
    remaining: number
  }>,
  upcoming: Array<{
    type: 'bill' | 'loan' | 'cheque',
    title: string,
    dueDate: string,
    amount: number,
    status: string
  }>,
  investments: {
    totalValue: number,
    profitLoss: number
  },
  notifications: {
    unreadCount: number
  }
}