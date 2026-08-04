# فیچر: Budget Management (مدیریت بودجه)

## توضیح کلی

این فیچر مسئولیت تعریف، پیگیری و کنترل بودجه کاربر را بر عهده دارد.  
روش بودجه‌بندی انتخاب‌شده: **Envelope Style (Zero-Based)** — الهام‌گرفته از YNAB.

در این روش:
- هر ریال درآمد باید به یک یا چند «پاکت» (دسته بودجه) اختصاص داده شود.
- هدف این است که درآمد − تخصیص‌ها = صفر شود.
- کاربر می‌داند دقیقاً هر بخش از پولش برای چه چیزی کنار گذاشته شده است.

بودجه می‌تواند **ماهانه** یا **سالانه** تعریف شود و با ثبت هزینه‌ها به صورت خودکار مصرف می‌شود.

---

## User Stories

### Must Have
- تعریف بودجه ماهانه یا سالانه
- ایجاد پاکت‌های بودجه (دسته‌بندی‌ها) با مبلغ مشخص
- اختصاص درآمد به پاکت‌ها
- مشاهده میزان مصرف هر پاکت (مصرف‌شده / باقی‌مانده)
- هشدار هنگام نزدیک شدن به سقف بودجه یا عبور از آن
- انتقال مبلغ بین پاکت‌ها
- مشاهده خلاصه بودجه ماه جاری

### Should Have
- بودجه بر اساس درصد از درآمد
- بودجه غلتان (Rollover) — باقی‌مانده ماه قبل به ماه بعد منتقل شود
- قالب‌های آماده بودجه
- گزارش مقایسه بودجه با عملکرد واقعی چند ماهه

---

## Business Rules

1. هر بودجه به یک بازه زمانی مشخص (ماه یا سال) تعلق دارد.
2. روش اصلی: **Zero-Based** — مجموع تخصیص‌ها باید با درآمد قابل بودجه‌بندی برابر شود (یا کاربر آگاهانه اختلاف را بپذیرد).
3. با ثبت هر **هزینه**، مبلغ از پاکت مربوطه کسر می‌شود.
4. اگر پاکت موجودی کافی نداشته باشد:
   - هشدار نمایش داده می‌شود.
   - در صورت فعال بودن تنظیمات سخت‌گیرانه، ثبت هزینه محدود می‌شود (اختیاری).
5. امکان انتقال مبلغ از یک پاکت به پاکت دیگر وجود دارد.
6. باقی‌مانده پاکت در پایان ماه می‌تواند:
   - به ماه بعد منتقل شود (Rollover)
   - یا صفر شود (بر اساس تنظیمات کاربر)
7. بودجه فقط روی هزینه‌ها تأثیر می‌گذارد (نه روی سرمایه‌گذاری‌ها، مگر کاربر بخواهد).

---

## Domain Entities

### ۱. Budget (جدول: `budgets`)

- `id` → UUID (Primary Key)
- `name` → string (مثلاً «بودجه مرداد ۱۴۰۵»)
- `periodType` → string (`monthly` یا `yearly`)
- `year` → number
- `month` → number (برای بودجه ماهانه — nullable)
- `startDate` → datetime
- `endDate` → datetime
- `totalIncome` → decimal (درآمد قابل بودجه‌بندی)
- `totalAssigned` → decimal (مجموع تخصیص‌داده‌شده)
- `totalSpent` → decimal (مجموع مصرف‌شده)
- `status` → string (`active`, `closed`, `draft`)
- `rolloverEnabled` → boolean
- `createdAt` → datetime
- `updatedAt` → datetime

### ۲. Budget Envelope (جدول: `budget_envelopes`)

- `id` → UUID
- `budgetId` → UUID
- `name` → string (مثلاً خوراک، حمل‌ونقل، پس‌انداز)
- `category` → string (ارتباط با دسته‌بندی هزینه‌ها)
- `assignedAmount` → decimal (مبلغ تخصیص‌داده‌شده)
- `spentAmount` → decimal (مبلغ مصرف‌شده)
- `remainingAmount` → decimal (باقی‌مانده — محاسبه‌ای یا ذخیره‌شده)
- `rolloverAmount` → decimal (مبلغ منتقل‌شده از دوره قبل)
- `order` → number (ترتیب نمایش)
- `color` → string (اختیاری — برای UI)
- `isSystem` → boolean (پاکت‌های سیستمی مثل «آماده تخصیص»)
- `createdAt` → datetime
- `updatedAt` → datetime

### ۳. Budget Transaction Link (جدول: `budget_transaction_links`)

- `id` → UUID
- `envelopeId` → UUID
- `expenseTransactionId` → UUID (لینک به تراکنش هزینه)
- `amount` → decimal
- `date` → datetime
- `createdAt` → datetime

> این جدول مشخص می‌کند هر هزینه از کدام پاکت کسر شده است.

### ۴. Budget Transfer (جدول: `budget_transfers`)

- `id` → UUID
- `budgetId` → UUID
- `fromEnvelopeId` → UUID
- `toEnvelopeId` → UUID
- `amount` → decimal
- `description` → string
- `date` → datetime
- `createdAt` → datetime

---

## APIهای داخلی

### Budget APIs
- `createBudget(data)` → ایجاد بودجه جدید برای دوره مشخص
- `updateBudget(id, data)`
- `getBudgetByPeriod(year, month?)`
- `getActiveBudget()`
- `closeBudget(id)` → بستن بودجه و اعمال Rollover در صورت نیاز
- `getBudgetSummary(budgetId)` → خلاصه کل بودجه

### Envelope APIs
- `createEnvelope(budgetId, data)`
- `updateEnvelope(id, data)`
- `assignToEnvelope(envelopeId, amount)` → تخصیص مبلغ به پاکت
- `getEnvelopes(budgetId)`
- `transferBetweenEnvelopes(fromId, toId, amount)`

### Integration APIs
- `applyExpenseToBudget(expenseId, envelopeId, amount)` → کسر خودکار از پاکت هنگام ثبت هزینه
- `getEnvelopeStatus(envelopeId)` → وضعیت مصرف (درصد و باقی‌مانده)
- `checkBudgetAlerts(budgetId)` → بررسی هشدارها

---

## روابط با سایر فیچرها

- **Income**: درآمدها منبع اصلی «پول قابل بودجه‌بندی» هستند.
- **Expense**: هر هزینه می‌تواند به یک پاکت بودجه متصل شود و از آن کسر گردد.
- **Accounts & Banking**: موجودی واقعی حساب‌ها با بودجه مقایسه می‌شود.
- **Notification & Reminder**: هشدار نزدیک شدن به سقف یا عبور از بودجه
- **Reports / Dashboard**: نمایش وضعیت بودجه و پیشرفت ماهانه
- **Goals**: می‌توان بخشی از بودجه را به اهداف مالی اختصاص داد

---

## منطق Zero-Based (پاکت‌ها)
