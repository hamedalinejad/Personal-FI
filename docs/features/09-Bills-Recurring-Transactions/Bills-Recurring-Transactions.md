# فیچر: Bills & Recurring Transactions (قبوض و تراکنش‌های تکرارشونده)

## توضیح کلی

این فیچر مسئولیت مدیریت **قبوض** و **تراکنش‌های تکرارشونده** (هزینه یا درآمد دوره‌ای) را بر عهده دارد.  
کاربر می‌تواند قبوض ماهانه، اشتراک‌ها، اجاره، حقوق و هر پرداخت یا دریافت دوره‌ای را تعریف کند تا سیستم آن‌ها را یادآوری کند و در صورت تمایل به صورت خودکار ثبت نماید.

این فیچر با فیچرهای **Expense** و **Income** در ارتباط است و تراکنش‌های واقعی را از طریق آن‌ها ایجاد می‌کند.

---

## User Stories

### Must Have
- تعریف قبض یا تراکنش تکرارشونده (هزینه یا درآمد)
- تعیین دوره تکرار (ماهانه، هفتگی، سالانه، سفارشی)
- تعیین تاریخ سررسید بعدی
- یادآوری قبل از سررسید
- ثبت دستی پرداخت/دریافت
- مشاهده لیست قبوض و تراکنش‌های نزدیک به سررسید
- مشاهده وضعیت پرداخت (پرداخت‌شده / در انتظار / معوق)

### Should Have
- ثبت خودکار تراکنش در تاریخ سررسید (با تأیید کاربر)
- اتصال به پاکت بودجه
- پیوست فاکتور یا قبض
- تاریخچه پرداخت‌های هر مورد
- مبلغ متغیر (مثلاً قبض برق)

---

## Business Rules

1. هر مورد می‌تواند از نوع **هزینه** (`expense`) یا **درآمد** (`income`) باشد.
2. دوره تکرار می‌تواند `weekly`, `monthly`, `yearly` یا `custom` باشد.
3. در تاریخ سررسید (یا چند روز قبل)، سیستم یادآوری ارسال می‌کند.
4. هنگام ثبت پرداخت/دریافت:
   - یک تراکنش واقعی در فیچر Expense یا Income ایجاد می‌شود.
   - وضعیت آن دوره به `paid` تغییر می‌کند.
   - تاریخ سررسید بعدی محاسبه می‌شود.
5. اگر تا بعد از سررسید پرداخت نشود، وضعیت `overdue` می‌شود.
6. مبلغ می‌تواند ثابت یا متغیر باشد.
7. حذف فیزیکی وجود ندارد — فقط غیرفعال‌سازی (`isActive = false`).

---

## Domain Entities

### ۱. Recurring Item (جدول: `recurring_items`)

- `id` → UUID (Primary Key)
- `title` → string (مثلاً «اجاره خانه» یا «حقوق ماهانه»)
- `type` → string (`expense` یا `income`)
- `amount` → decimal (مبلغ پایه — در صورت ثابت بودن)
- `isVariableAmount` → boolean (آیا مبلغ هر دوره تغییر می‌کند؟)
- `currency` → string (پیش‌فرض IRR)
- `accountId` → UUID (حساب پیش‌فرض برای پرداخت/دریافت)
- `category` → string (دسته‌بندی)
- `interval` → string (`weekly`, `monthly`, `yearly`, `custom`)
- `customIntervalDays` → number (برای حالت custom — nullable)
- `startDate` → datetime
- `endDate` → datetime (nullable — در صورت محدود بودن)
- `nextDueDate` → datetime (تاریخ سررسید بعدی)
- `reminderDaysBefore` → number (چند روز قبل یادآوری شود)
- `autoCreateTransaction` → boolean (ثبت خودکار تراکنش؟)
- `envelopeId` → UUID (پاکت بودجه مرتبط — nullable)
- `isActive` → boolean
- `description` → string
- `createdAt` → datetime
- `updatedAt` → datetime

### ۲. Recurring Occurrence (جدول: `recurring_occurrences`)

- `id` → UUID
- `recurringItemId` → UUID
- `dueDate` → datetime
- `amount` → decimal (مبلغ نهایی این دوره)
- `status` → string (`pending`, `paid`, `overdue`, `skipped`)
- `paidDate` → datetime (nullable)
- `transactionId` → UUID (لینک به تراکنش واقعی Expense/Income — nullable)
- `accountTransactionId` → UUID (لینک به `AccountsBanking_transactions` — nullable)
- `note` → string
- `createdAt` → datetime
- `updatedAt` → datetime

---

## APIهای داخلی

### Recurring Item APIs
- `createRecurringItem(data)` → تعریف مورد جدید
- `updateRecurringItem(id, data)`
- `getAllRecurringItems(filters)` → فیلتر بر اساس نوع، وضعیت فعال و ...
- `getRecurringItemById(id)`
- `deactivateRecurringItem(id)`
- `getUpcomingItems(days)` → موارد نزدیک به سررسید

### Occurrence APIs
- `getOccurrences(recurringItemId)`
- `getPendingOccurrences()`
- `getOverdueOccurrences()`
- `markAsPaid(occurrenceId, amount, date, accountId?)`  
  → ثبت پرداخت/دریافت + ایجاد تراکنش واقعی + به‌روزرسانی nextDueDate
- `skipOccurrence(occurrenceId)` → رد کردن این دوره
- `updateOccurrenceAmount(occurrenceId, amount)` → برای مبالغ متغیر

### Scheduler APIs
- `generateUpcomingOccurrences()` → تولید Occurrenceهای آینده (Job دوره‌ای)
- `checkOverdueOccurrences()` → به‌روزرسانی وضعیت معوق‌ها
- `sendReminders()` → ارسال یادآوری‌ها

---

## روابط با سایر فیچرها

- **Expense**: ایجاد تراکنش هزینه هنگام پرداخت قبض
- **Income**: ایجاد تراکنش درآمد هنگام دریافت حقوق یا درآمد دوره‌ای
- **Accounts & Banking**: تأثیر روی موجودی حساب
- **Budget**: کسر از پاکت بودجه در صورت اتصال
- **Notification & Reminder**: یادآوری سررسیدها
- **Dashboard**: نمایش قبوض نزدیک و معوق
- **Reports**: گزارش هزینه‌ها و درآمدهای تکرارشونده

---

## منطق محاسبه تاریخ سررسید بعدی

| Interval | منطق |
|----------|------|
| `weekly` | +۷ روز |
| `monthly` | همان روز از ماه بعد |
| `yearly` | همان روز و ماه از سال بعد |
| `custom` | + `customIntervalDays` روز |

اگر روز مورد نظر در ماه بعد وجود نداشته باشد (مثلاً ۳۱)، آخرین روز ماه در نظر گرفته می‌شود.

---

## وضعیت‌های Occurrence

| وضعیت | معنی |
|------|------|
| `pending` | در انتظار پرداخت/دریافت |
| `paid` | انجام شده |
| `overdue` | از تاریخ سررسید گذشته و هنوز انجام نشده |
| `skipped` | توسط کاربر رد شده |

---

## نکات طراحی

- برای قبوض با مبلغ متغیر (برق، گاز، آب) فیلد `isVariableAmount` فعال می‌شود و کاربر هنگام پرداخت مبلغ نهایی را وارد می‌کند.
- ثبت خودکار تراکنش بهتر است با تأیید کاربر انجام شود تا از ثبت اشتباه جلوگیری شود.
- در Dashboard بخش «سررسیدهای نزدیک» و «معوق‌ها» باید برجسته نمایش داده شود.
- این فیچر فقط قالب و زمان‌بندی را مدیریت می‌کند؛ تراکنش مالی واقعی همیشه از طریق Expense یا Income ثبت می‌شود.
- نرخ تتر در زمان ایجاد Occurrence یا پرداخت ذخیره می‌شود تا گزارش‌های تاریخی دقیق باشند.