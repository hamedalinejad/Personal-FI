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
3. با ثبت هر **هزینه** (از هر منبعی: حساب بانکی، چک، وام)، مبلغ از پاکت مربوطه کسر می‌شود.
4. اگر پاکت موجودی کافی نداشته باشد:
   - هشدار نمایش داده می‌شود.
   - اگر `strictMode = true`، ثبت هزینه محدود می‌شود (یا رد می‌شود).
5. امکان انتقال مبلغ از یک پاکت به پاکت دیگر وجود دارد.
6. باقی‌مانده پاکت در پایان ماه می‌تواند:
   - به ماه بعد منتقل شود (Rollover)
   - یا صفر شود (بر اساس تنظیمات `rolloverEnabled`)
7. بودجه فقط روی هزینه‌ها تأثیر می‌گذارد (نه روی سرمایه‌گذاری‌ها، مگر کاربر بخواهد).
8. **یک هزینه می‌تواند بین چند پاکت تقسیم شود** (به دلیل جدول `budget_transaction_links`).
9. `remainingAmount` محاسبه‌ای است: `assignedAmount + rolloverAmount - spentAmount`.
10. `totalIncome` خودکار از جمع درآمدهای بازه محاسبه می‌شود، اما امکان override دستی وجود دارد.

---

## Domain Entities

### ۱. Budget (جدول: `bg_budgets`)

- `id` → UUID (Primary Key)
- `name` → string (مثلاً «بودجه مرداد ۱۴۰۵»)
- `periodType` → string (`monthly` یا `yearly`)
- `year` → number
- `month` → number (برای بودجه ماهانه — nullable)
- `startDate` → datetime
- `endDate` → datetime
- `totalIncome` → decimal (درآمد قابل بودجه‌بندی — خودکار محاسبه شده با امکان override)
- `totalAssigned` → decimal (مجموع تخصیص‌داده‌شده)
- `totalSpent` → decimal (مجموع مصرف‌شده)
- `strictMode` → boolean (سخت‌گیری — ثبت هزینه روی سقف محدود می‌شود)
- `rolloverEnabled` → boolean (باقی‌مانده به ماه بعد منتقل شود؟)
- `status` → string (`active`, `closed`, `draft`)
- `createdAt` → datetime
- `updatedAt` → datetime

### ۲. Budget Envelope (جدول: `bg_envelopes`)

- `id` → UUID
- `budgetId` → UUID
- `name` → string (مثلاً خوراک، حمل‌ونقل، پس‌انداز)
- `category` → string (ارتباط با دسته‌بندی هزینه‌ها)
- `assignedAmount` → decimal (مبلغ تخصیص‌داده‌شده)
- `spentAmount` → decimal (مبلغ مصرف‌شده)
- `rolloverAmount` → decimal (مبلغ منتقل‌شده از دوره قبل)
- `order` → number (ترتیب نمایش)
- `color` → string (اختیاری — برای UI)
- `isSystem` → boolean (پاکت‌های سیستمی مثل «آماده تخصیص»)
- `createdAt` → datetime
- `updatedAt` → datetime

> **نکته طراحی**: `remainingAmount` یک فیلد **محاسبه‌ای** است و در دیتابیس ذخیره نمی‌شود.  
> فرمول: `remainingAmount = assignedAmount + rolloverAmount - spentAmount`  
> ذخیره این فیلد باعث out-of-sync با داده‌های واقعی می‌شود.

### ۳. Budget Transaction Link (جدول: `bg_transaction_links`)

- `id` → UUID
- `envelopeId` → UUID
- `transactionId` → UUID (لینک به تراکنش هزینه - می‌تواند در exp_transactions, acc_transactions باشد)
- `transactionType` → string (`expense`, `cheque`, `loan`) — نوع تراکنش برای شناسایی جدول مرتبط
- `amount` → decimal (مبلغی که از این پاکت کسر شد)
- `date` → datetime
- `createdAt` → datetime

> این جدول مشخص می‌کند هر هزینه از کدام پاکت کسر شده است.  
> یک هزینه می‌تواند بین چند پاکت تقسیم شود (چند رکورد در این جدول).  
> **نکته**: از نسخه ۱.۰.۰، این جدول همه انواع تراکنش‌های هزینه را پوشش می‌دهد:
> - `transactionType = 'expense'` → لینک به `exp_transactions.id`
> - `transactionType = 'cheque'` → لینک به `chk_cheques.id` (از طریق تراکنش بانکی)
> - `transactionType = 'loan'` → لینک به `ln_transactions.id` (از طریق تراکنش بانکی)

### ۴. Budget Transfer (جدول: `bg_transfers`)

- `id` → UUID
- `budgetId` → UUID
- `fromEnvelopeId` → UUID
- `toEnvelopeId` → UUID
- `amount` → decimal
- `description` → string
- `date` → datetime
- `createdAt` → datetime

---

## منطق Zero-Based (پاکت‌ها)

### فرمول کلی
- `remainingAmount = assignedAmount + rolloverAmount - spentAmount`

### پاکت "آماده تخصیص" (System Envelope)
- این پاکت سیستمی است و نمایانگر پولی است که هنوز به هیچ دسته‌ای اختصاص داده نشده.
- `remainingAmount` این پاکت = `totalIncome - totalAssigned` (در کل بودجه).
- هنگام تخصیص به پاکت‌های دیگر، مبلغ از این پاکت کم می‌شود.
- برای Zero-Based کامل، `remainingAmount` پاکت "آماده تخصیص" باید صفر شود (یا کاربر بپذیرد که غیرصفر است).

### محاسبه `totalIncome`
- خودکار از جمع تراکنش‌های `Income` در بازه زمانی بودجه (`startDate` تا `endDate`) محاسبه می‌شود.
- امکان override دستی وجود دارد (مثلاً اگر کاربر درآمدی خارج از سیستم دارد).
- پس از override، محاسبات خودکار متوقف می‌شود.

### Rollover
- هنگام بستن بودجه (`status = closed`) و اگر `rolloverEnabled = true`:
  - `rolloverAmount` هر پاکت به مقدار `remainingAmount` آن به‌روزرسانی می‌شود.
  - `remainingAmount` هر پاکت صفر می‌شود.
  - پاکت "آماده تخصیص" مجدد پر می‌شود با مقدار `totalIncome` دوره جدید.

---

## APIهای داخلی

### Budget APIs
- `createBudget(data)` → ایجاد بودجه جدید برای دوره مشخص
- `updateBudget(id, data)` → شامل `strictMode`, `rolloverEnabled`, `totalIncome` (override)
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
- `applyTransactionToBudget(transactionId, transactionType, envelopeId, amount)` → کسر خودکار از پاکت هنگام ثبت هزینه
- `splitTransactionBudget(transactionId, transactionType, envelopeAmounts)` → تقسیم هزینه بین چند پاکت
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

## نکات طراحی

- `remainingAmount` محاسبه‌ای است و در دیتابیس ذخیره نمی‌شود (برای جلوگیری از out-of-sync).
- هزینه می‌تواند از هر منبعی باشد (حساب بانکی، چک، وام) و همگی از پاکت کسر می‌شوند.
- تراکنش‌ها در `bg_transaction_links` با `transactionType` شناسایی می‌شوند:
  - `expense` → `exp_transactions`
  - `cheque` → `chk_cheques` (از طریق `acc_transactions`)
  - `loan` → `ln_transactions` (از طریق `acc_transactions`)
- در حالت `strictMode = true`، اگر `remainingAmount <= 0`، ثبت هزینه محدود می‌شود.
- برای Zero-Based کامل، مبلغ پاکت "آماده تخصیص" باید صفر شود.