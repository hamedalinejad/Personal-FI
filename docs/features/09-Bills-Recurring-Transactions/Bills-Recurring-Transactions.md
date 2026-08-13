# فیچر: Bills & Recurring Transactions (قبوض و تراکنش‌های تکرارشونده)

## توضیح کلی

این فیچر مسئولیت مدیریت **قبوض** و **تراکنش‌های تکرارشونده** (هزینه یا درآمد دوره‌ای) را بر عهده دارد.
کاربر می‌تواند قبوض ماهانه، اشتراک‌ها، اجاره، حقوق و هر پرداخت یا دریافت دوره‌ای را تعریف کند تا سیستم آن‌ها را یادآوری کند و در صورت تمایل به صورت خودکار ثبت نماید.

این فیچر با فیچرهای **Expense** و **Income** در ارتباط است و تراکنش‌های واقعی را از طریق آن‌ها ایجاد می‌کند.

> **تفاوت با `inc_recurring` و `exp_recurring`**:
>
> | ویژگی | `inc_recurring` / `exp_recurring` | `br_items` |
> |-------|----------------------------------|------------|
> | **هدف** | تولید خودکار تراکنش بدون نیاز به تأیید | یادآوری + پیگیری وضعیت پرداخت |
> | **جریان** | تراکنش مستقیم در `inc/exp_transactions` | `br_occurrences` → تأیید کاربر → تراکنش |
> | **مبلغ** | ثابت | ثابت یا متغیر (`isVariableAmount`) |
> | **وضعیت** | ندارد (تراکنش یا تولید می‌شود یا نه) | `pending / paid / overdue / skipped` |
> | **مناسب برای** | حقوق ثابت، اجاره ثابت | قبض برق، اینترنت، اشتراک با مبلغ متغیر |
>
> **قانون**: برای یک تراکنش تکرارشونده فقط از **یکی** از این دو روش استفاده کنید.

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

### ۱. Bill/Recurring Item (جدول: `br_items`)

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
- `envelopeCategoryCode` → string (nullable — **کد دسته‌بندی پاکت** به جای `envelopeId` مستقیم؛ مثلاً `food`, `transport`)
- `envelopeId` → UUID (nullable — **snapshot** آخرین envelope فعال با این `envelopeCategoryCode` در بودجه جاری — در زمان `markAsPaid()` به‌روزرسانی می‌شود، نه در زمان ایجاد `br_items`)

> **چرا `envelopeCategoryCode` به جای `envelopeId` ثابت**:
> - بودجه‌ها ماهانه بسته و دوباره ایجاد می‌شوند؛ هر دوره `bg_envelopes` جدید با `id` جدید ساخته می‌شود
> - اگر `br_items.envelopeId` به envelope ماه قبل اشاره کند، `applyTransactionToBudget()` در ماه جدید روی envelope اشتباه اعمال می‌شود
> - **راه‌حل**: `envelopeCategoryCode` به عنوان مرجع پایدار نگه داشته می‌شود؛ در زمان `markAsPaid()`، سیستم envelope فعال با این code را در بودجه جاری جستجو می‌کند:
> ```
> activeEnvelope = bg_envelopes WHERE categoryCode=envelopeCategoryCode AND budgetId=currentBudgetId AND isActive=true
> if activeEnvelope exists:
>   envelopeId = activeEnvelope.id  // snapshot آپدیت می‌شود
>   applyTransactionToBudget(relatedId, relatedFeature, activeEnvelope.id, amount)
> else:
>   // پاکت برای ماه جاری تعریف نشده — بدون کسر بودجه، بدون خطا
>   envelopeId = null
> ```
> - `envelopeId` snapshot است: برای lookup آپدیت می‌شود، اما هرگز به عنوان Foreign Key ثابت تکیه نمی‌شود
- `isActive` → boolean
- `description` → string
- `createdAt` → datetime
- `updatedAt` → datetime

### ۲. Bill/Recurring Occurrence (جدول: `br_occurrences`)

- `id` → UUID
- `brItemId` → UUID
- `dueDate` → datetime
- `amount` → decimal (مبلغ نهایی این دوره)
- `status` → string (`pending`, `paid`, `overdue`, `skipped`)
- `paidDate` → datetime (nullable)
- `expenseTransactionId` → UUID (nullable — لینک به `exp_transactions.id` فقط وقتی `br_items.type = 'expense'`)
- `incomeTransactionId` → UUID (nullable — لینک به `inc_transactions.id` فقط وقتی `br_items.type = 'income'`)
- `accountTransactionId` → UUID (لینک به `acc_transactions.id` — nullable)

> **نکته طراحی**: به‌جای یک فیلد `transactionId` که به دو جدول متفاوت اشاره می‌کند، دو فیلد مجزا تعریف شده‌اند تا Foreign Key در SQLite معنادار باشد. همیشه فقط یکی پر می‌شود (بسته به `br_items.type`) و دیگری `null` است.
- `note` → string
- `createdAt` → datetime
- `updatedAt` → datetime

> **نکته لینک در `markAsPaid()`**:
> - اگر `br_items.type = 'expense'`: فیلد `expenseTransactionId` با `exp_transactions.id` تراکنش ساخته‌شده پر می‌شود؛ `incomeTransactionId` همچنان `null` می‌ماند
> - اگر `br_items.type = 'income'`: فیلد `incomeTransactionId` با `inc_transactions.id` تراکنش ساخته‌شده پر می‌شود؛ `expenseTransactionId` همچنان `null` می‌ماند
> - `accountTransactionId` → `acc_transactions.id` (تراکنش بانکی مرتبط — در هر دو حالت پر می‌شود)
> - هر سه فیلد در یک عملیات atomic پر می‌شوند

---

## APIهای داخلی

### Recurring Item APIs
- `createRecurringItem(data)` → تعریف مورد جدید
- `updateRecurringItem(brItemId, data)`
- `getAllRecurringItems(filters)` → فیلتر بر اساس نوع، وضعیت فعال و ...
- `getRecurringItemById(brItemId)`
- `deactivateRecurringItem(brItemId)`
- `getUpcomingItems(days)` → موارد نزدیک به سررسید

### Occurrence APIs
- `getOccurrences(brItemId)`
- `getPendingOccurrences()`
- `getOverdueOccurrences()`
- `markAsPaid(brOccurrenceId, amount, date, accountId?)`
  → ثبت پرداخت/دریافت + ایجاد تراکنش در `exp_transactions` (اگر expense) یا `inc_transactions` (اگر income) + ثبت در `acc_transactions` + پر کردن `expenseTransactionId` یا `incomeTransactionId` (بسته به نوع) و `accountTransactionId` + به‌روزرسانی nextDueDate
- `skipOccurrence(brOccurrenceId)` → رد کردن این دوره
- `updateOccurrenceAmount(brOccurrenceId, amount)` → برای مبالغ متغیر

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
