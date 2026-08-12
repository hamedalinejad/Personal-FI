# فیچر: Debt & Loan Management (بدهی، طلب و وام)

## توضیح کلی
این فیچر مدیریت کامل بدهی‌ها، مطالبات و وام‌ها را بر عهده دارد.  
اطلاعات اصلی وام در جدول `ln_loans` نگهداری می‌شود.  
تمام جابه‌جایی‌های مالی واقعی مرتبط با وام در جدول `ln_transactions` به صورت **لاگ** ثبت می‌شوند و همزمان در جدول `acc_transactions` نیز ثبت شده و موجودی حساب را تغییر می‌دهد.

---

## Business Rules

### روش‌های محاسبه اقساط (Core)

**1. Declining Balance (تناژل سود):**
- نرخ سود روی مانده باقیمانده محاسبه می‌شود
- کاربرد: وام‌های بانکی رسمی
- فرمول: `installment = P × r(1+r)^n / [(1+r)^n - 1]` که `r = annual_rate / 12 / 100`
- نیاز: `calculationMethod = 'declining_balance'` و سیستم `calculatedInstallment` را محاسبه می‌کند
- هر قسط: سود = `remainingBalance × r`، اصل = `installment - سود`

**2. Flat Rate (سود ثابت):**
- سود روی کل مبلغ اولیه محاسبه شود
- کاربرد: وام‌های دوستانه، قرض‌الحسنه با کارمزد
- نیاز: `fixedInstallmentAmount` ثابت برای تمام اقساط و شامل **هم اصل و هم سود** است (نه فقط اصل)؛ `fixedInstallmentAmount = (principalAmount + totalInterest) / totalInstallments` (فرمول کامل در بخش «فرمول‌های محاسباتی»)
- هر قسط: اصل = `principalAmount / totalInstallments`، سود = `principalAmount × rate × years / totalInstallments` — این دو مقدار **در داخل** `fixedInstallmentAmount` جمع می‌شوند، نه جدا از آن

**3. Qarz Al-Hasaneh (قرض‌الحسنه):**
- سود = ۰، فقط کارمزد خدمات ۴٪
- نیاز: `calculationMethod = 'qarz_al_hasaneh'` و `serviceFeeRate = 4`
- کارمزد یک‌بار کسر می‌شود: `serviceFeeAmount = principalAmount × serviceFeeRate / 100`
- هر قسط: صرفاً تقسیم‌کردن اصل: `installment = principalAmount / totalInstallments`

**4. Bullet:**
- اصل کل در پایان، سود ماهانه
- نیاز: `calculationMethod = 'bullet'` و `calculatedInstallment` برای سود ماهانه
- هر قسط تا ماه آخر: اصل = ۰، سود = `remainingBalance × r` (فرمول کامل در بخش «فرمول‌های محاسباتی»)؛ ماه آخر: کل اصل باقیمانده یک‌جا

**برنامه اقساط:**
- `getUpcomingPayments()` باید `calculationMethod` را چک کند
- برای هر روش فرمول‌های متفاوت است
- تاریخ اولین قسط از `firstPaymentDate` شروع می‌شود (ممکن است بعد از `disbursementDate`)
- در صورت `gracePeriodMonths > 0`، اولین اقساط فقط سود است

### دیگر Business Rules

1. وام می‌تواند از نوع `borrowed` (دریافتی) یا `lent` (پرداختی / طلب) باشد.
2. ارز وام همیشه با ارز حساب مرتبط یکی است.
3. `loanType` باید یکی از انواع تعریف‌شده باشد (bank_installment, qarz_al_hasaneh, facility, ...)
4. `interestRate` واحد: درصد کامل (18 برای ۱۸٪، نه 0.18)
5. هنگام ثبت وام **دریافتی (borrowed)**:
   - مبلغ اصلی به حساب مرتبط واریز می‌شود.
   - یک رکورد در `ln_transactions` با `type = 'disbursement'` ثبت می‌شود.
   - یک رکورد در `acc_transactions` با نوع `deposit-loan` ثبت می‌شود.
   - در جدول `ln_loans`، فیلد `accountTransactionId` به `acc_transactions.id` لینک می‌شود.
   - موجودی حساب افزایش می‌یابد.
6. هنگام ثبت وام **پرداختی (lent)**:
   - مبلغ اصلی از حساب مرتبط برداشت می‌شود.
   - یک رکورد در `ln_transactions` با `type = 'disbursement'` ثبت می‌شود.
   - یک رکورد در `acc_transactions` با نوع `withdrawal-loan` ثبت می‌شود.
   - در جدول `ln_loans`، فیلد `accountTransactionId` به `acc_transactions.id` لینک می‌شود.
   - موجودی حساب کاهش می‌یابد.
7. تمام پرداخت‌های بعدی (قسط، سود، جریمه، کارمزد پیش‌پرداخت، کارمزد صدور) نیز هم در `ln_transactions` و هم در `acc_transactions` ثبت می‌شوند و موجودی حساب را تغییر می‌دهند.
8. کارمزدهای وام (صدور، پیش‌پرداخت، تأخیر) مستقل از سود ثبت می‌شوند و تنها موجودی حساب را تغییر می‌دهند، نه `remainingBalance`.
9. جدول `ln_transactions` فقط لاگ است و داده‌های پردازشی (مثل برنامه اقساط) در آن ذخیره نمی‌شود.
10. موجودی حساب نمی‌تواند منفی شود.
11. ویرایش اطلاعات اصلی وام فقط قبل از ثبت اولین پرداخت مجاز است.
12. برای هر پرداخت، `principalPortion` و `interestPortion` مستقیماً در `ln_transactions` ذخیره شود (حداقل nullable برای وام‌های بدون سود).
13. مانده باقی‌مانده (`remainingBalance`) فقط با کاهش `principalPortion` کاهش می‌یابد، نه با سود.
14. برای هر پرداخت، نرخ تبدیل لحظه در `exchangeRateToBase` ذخیره شود تا ارزش دلاری/تتری قسط حفظ شود.

---

## Domain Entities

### ۱. Loan (جدول: `ln_loans`)

**شناسه و اطلاعات پایه:**
- `id` → UUID (Primary Key)
- `name` → string (نام وام)
- `loanType` → enum (bank_installment | qarz_al_hasaneh | facility | friendly_loan | credit_card | mortgage | leasing | bond | other)
- `direction` → string (`borrowed` یا `lent`)

**مبالغ و ارز:**
- `principalAmount` → decimal (مبلغ اصلی)
- `currency` → string (ارز وام)
- `exchangeRateToBase` → decimal (نرخ تبدیل لحظه ثبت — ریال به ازای ۱ تتر)

**تاریخ‌ها:**
- `disbursementDate` → datetime (تاریخ دریافت/واریز وام) ✅ **جدید**
- `firstPaymentDate` → datetime (تاریخ اولین قسط) ✅ **جدید**
- `endDate` → datetime (تاریخ پایان وام)

**حساب:**
- `accountId` → UUID (حساب مرتبط)
- `accountTransactionId` → UUID (لینک به `acc_transactions`)

**محاسبه اقساط (Core):**
- `calculationMethod` → enum (declining_balance | flat_rate | bullet | qarz_al_hasaneh) ✅ **جدید — حتمی**
- `interestType` → string (`none`, `fixed`, `variable`)
- `interestRate` → decimal (درصد کامل: 18 برای ۱۸٪، نه 0.18) ✅ **توضیح واحد اضافه شد**
- `interestRatePeriod` → string (`annual`, `monthly`)
- `installmentFrequency` → string (`monthly`, `weekly`, `quarterly`, `custom`)
- `totalInstallments` → integer (تعداد کل اقساط)
- `gracePeriodMonths` → integer (nullable — ماه‌های تنفس) ✅ **جدید**
- `calculatedInstallment` → decimal (nullable — محاسبه‌شده برای Declining/Bullet) ✅ **جدید**
- `fixedInstallmentAmount` → decimal (nullable — ثابت برای Flat Rate/Qarz)
- `recalculateOnEarlyPayment` → boolean | null (پیش‌فرض: `null`؛ **فقط برای `calculationMethod = 'declining_balance'` معنا دارد** — برای `flat_rate`, `bullet`, `qarz_al_hasaneh` همیشه `null` است چون این روش‌ها مفهوم Re-amortization ندارند. وقتی `null` است سیستم رفتار `false` را اعمال می‌کند — به بخش «بازمحاسبه اقساط پس از پیش‌پرداخت جزئی» مراجعه شود)

**کارمزدها و جریمه:**
- `originationFeeAmount` → decimal (nullable — کارمزد صدور)
- `originationFeeType` → enum (nullable — `fixed` | `percentage`)
- `earlyPaymentFeeAmount` → decimal (nullable — کارمزد پیش‌پرداخت)
- `earlyPaymentFeeType` → enum (nullable — `fixed` | `percentage`)
- `penaltyRate` → decimal (nullable — نرخ جریمه دیرکرد سالانه — مثلاً 6) ✅ **جدید**
- `serviceFeeRate` → decimal (nullable — کارمزد قرض‌الحسنه — مثلاً 4) ✅ **جدید**
- `serviceFeeAmount` → decimal (nullable — مبلغ کارمزد محاسبه‌شده) ✅ **جدید**

**وضعیت:**
- `status` → enum (`active` | `completed` | `cancelled` | `overdue`) ✅ **overdue اضافه شد**
- `remainingBalance` → decimal (مانده باقی‌مانده)

**اسنپ‌شات برای Dashboard:**
- `totalPaidPrincipal` → decimal (مجموع اصل پرداخت‌شده) ✅ **جدید**
- `totalPaidInterest` → decimal (مجموع سود پرداخت‌شده) ✅ **جدید**

**شرایط:**
- `disbursementType` → enum (`lump_sum`) — **در نسخه ۱ فقط `lump_sum` پشتیبانی می‌شود.** مقدار `phased` (واریز چندمرحله‌ای) از enum حذف شد چون پیاده‌سازی متناظری (چند رکورد `disbursement` و چند `disbursementDate`) وجود ندارد؛ ساختار فعلی (`disbursementDate` و `accountTransactionId` واحد در `ln_loans`) فقط از یک واریز یک‌باره پشتیبانی می‌کند. افزودن `phased` به نسخه‌های بعدی موکول شد و نیازمند API جداگانه (مثلاً `disburseLoanPhase()`) و مدل داده چندواریزی خواهد بود.
- `collateralNote` → string (nullable — وثیقه/ضامن) ✅ **جدید**

**طرف مقابل:**
- `contactName` → string (نام)
- `contactPhone` → string (nullable — شماره تماس) ✅ **جدید**
- `description` → string

**فایل‌ها:**
- `hasAttachment` → boolean
- `attachmentPath` → string

**زمان:**
- `createdAt` → datetime
- `updatedAt` → datetime

> **نکته طراحی**: هنگام ایجاد وام، `remainingBalance` با مقدار `principalAmount` شروع می‌شود. برای وام‌های `borrowed` (دریافتی)، این مبلغ به تدریج با پرداخت قسط‌ها کاهش می‌یابد. برای وام‌های `lent` (پرداختی)، این مبلغ نیز به تدریج کاهش می‌یابد.

### ۲. Loan Transaction (لاگ) (جدول: `ln_transactions`)

- `id` → UUID (Primary Key)
- `loanId` → UUID
- `date` → datetime
- `type` → enum (`disbursement`, `installment_payment`, `interest_payment`, `fee_payment`, `penalty`, `early_payment`)
- `amount` → decimal (مبلغ کل پرداختی)
- `principalPortion` → decimal (nullable — مبلغ اصل — برای `type = 'installment_payment'` یا `'early_payment'`)
- `interestPortion` → decimal (nullable — مبلغ سود — برای `type = 'interest_payment'`)
- `feePortion` → decimal (nullable — مبلغ کارمزد — برای `type = 'fee_payment'`)
- `penaltyPortion` → decimal (nullable — مبلغ جریمه تأخیر — برای `type = 'penalty'`)
- `feeType` → enum (nullable — `origination`, `early_payment`, `late_payment_fee`, ...)
- `penaltyDays` → integer (nullable — تعداد روزهای دیرکرد برای محاسبه جریمه) ✅ **جدید**
- `installmentNumber` → integer (nullable — شماره قسط برای tracking) ✅ **جدید**
- `description` → string
- `exchangeRateToBase` → decimal (نرخ تبدیل لحظه — ریال به ازای ۱ تتر)
- `accountTransactionId` → UUID (ارتباط با `acc_transactions`)
- `createdAt` → datetime

> این جدول فقط لاگ تراکنش‌های واقعی است و هیچ داده پردازشی در آن نگهداری نمی‌شود.  
> برای محاسبه `remainingBalance`: `remainingBalance -= principalPortion` (فقط سود، کارمزد و جریمه بر روی `remainingBalance` تأثیری ندارند).  
> **نکته**: `type = 'fee_payment'` برای کارمزدهای پیش‌پرداخت یا دیگر کارمزدهای جانبی است. کارمزد صدور وام نیز به‌صورت تراکنش جدا ثبت می‌شود.

### ۳. acc_transactions (جدول مشترک تراکنش‌های حساب)

- هنگام ایجاد وام و هر پرداخت، یک رکورد با نوع مناسب (`deposit-loan` یا `withdrawal-loan`) در این جدول ثبت می‌شود و موجودی حساب به‌روزرسانی می‌گردد.

### ۴. Loan Rate History (جدول: `ln_rate_history`)

فقط برای وام‌های با `interestType = 'variable'` استفاده می‌شود؛ تاریخچه تغییرات نرخ سود میان‌دوره را نگه می‌دارد تا `interestPortion` هر قسط با نرخ صحیح همان بازه محاسبه شود.

- `id` → UUID (Primary Key)
- `loanId` → UUID
- `rate` → decimal (نرخ سود جدید — درصد کامل، مثل `interestRate`)
- `effectiveDate` → datetime (تاریخی که نرخ جدید از آن به بعد اعمال می‌شود)
- `note` → string (nullable — دلیل تغییر نرخ)
- `createdAt` → datetime

> **نکته الزامی**: برای وام‌های `variable`، فیلد `interestRate` در `ln_loans` فقط **نرخ اولیه** (در `disbursementDate`) را نشان می‌دهد. برای محاسبه سود هر قسط، سیستم باید آخرین رکورد `ln_rate_history` که `effectiveDate` آن ≤ تاریخ همان قسط است را پیدا کند و `r` را از روی آن نرخ محاسبه کند (نه از `ln_loans.interestRate`). برای وام‌های `fixed` یا `none`، این جدول اصلاً استفاده نمی‌شود و `interestRate` ثابت `ln_loans` معتبر است.
> تغییر نرخ **بازمحاسبه خودکار قسط‌های آینده** را طبق همان منطق «بازمحاسبه پس از پیش‌پرداخت جزئی» (بخش ه) با `remainingInstallments` و `remainingBalance` فعلی و `r` جدید ایجاد می‌کند؛ قسط‌های قبلاً پرداخت‌شده دست‌نخورده می‌مانند.

---

## APIهای داخلی

### Loan APIs
- `createLoan(data)`  
  → ثبت وام در `ln_loans` (شامل `accountTransactionId`)  
  → ثبت لاگ در `ln_transactions` با `type = 'disbursement'`  
  → ثبت در `acc_transactions` با نوع مناسب (`deposit-loan` یا `withdrawal-loan`)  
  → به‌روزرسانی موجودی حساب
- `updateLoan(id, data)` → ویرایش (فقط قبل از اولین پرداخت)
- `getAllLoans(filters)`
- `getLoanById(id)`
- `getLoanSummary()` → مجموع بدهی‌ها و مطالبات
- `cancelLoan(id)`
- `updateLoanRate(loanId, newRate, effectiveDate, note?)` → فقط برای `interestType = 'variable'`؛ ثبت رکورد جدید در `ln_rate_history` و بازمحاسبه `calculatedInstallment` برای اقساط آینده (طبق منطق بخش «بازمحاسبه اقساط پس از پیش‌پرداخت جزئی» با نرخ جدید به‌جای پیش‌پرداخت)

### Payment APIs
- `payLoan(loanId, amount, type, date, description)`  
  → ثبت پرداخت (قسط / سود / جریمه / زودهنگام)  
  → ثبت در `ln_transactions` (با `principalPortion` و `interestPortion` و `exchangeRateToBase`)  
  → ثبت در `acc_transactions`  
  → به‌روزرسانی `remainingBalance` (فقط با `principalPortion`) و موجودی حساب  
  → برای `type = 'early_payment'` با پیش‌پرداخت جزئی روی وام `declining_balance`: طبق `recalculateOnEarlyPayment` یا `calculatedInstallment`/`totalInstallments` به‌روزرسانی می‌شود (بازمحاسبه) یا فقط تعداد اقساط باقیمانده کم می‌شود (بدون بازمحاسبه) — فرمول کامل در بخش «بازمحاسبه اقساط پس از پیش‌پرداخت جزئی»
- `getLoanTransactions(loanId)` → دریافت لاگ تراکنش‌های یک وام
- `getUpcomingPayments(loanId)` → محاسبه اقساط آینده (بر اساس `calculationMethod` و `installmentFrequency`)
  - **خروجی**: آرایه‌ای از اقساط آینده:
    ```typescript
    {
      installmentNumber: number,
      dueDate: datetime,
      principalAmount: Decimal,
      interestAmount: Decimal,
      totalAmount: Decimal,
      remainingBalanceAfter: Decimal
    }
    ```
  - **منطق**:
    - اگر `calculationMethod = 'declining_balance'`: از فرمول amortization استفاده (سود روی مانده)
    - اگر `calculationMethod = 'flat_rate'`: اصل ثابت، سود ثابت
    - اگر `calculationMethod = 'qarz_al_hasaneh'`: اصل ثابت، سود = 0
    - اگر `calculationMethod = 'bullet'`: سود ماهانه، اصل صفر (غیر از ماه آخر)
    - اگر `gracePeriodMonths > 0`: اولین N ماه فقط سود (برای تمام روش‌ها)
    - شروع از `firstPaymentDate` + `installmentFrequency`
- `getOverduePayments(loanId)` → دریافت اقساط سررسید گذشته (مقایسه با `ln_transactions`)
- `checkAndUpdateOverdueStatus()` → بررسی همه وام‌های `active` و تغییر `status` به `overdue` در صورت وجود قسط سررسید گذشته پرداخت‌نشده؛ این تابع باید هنگام **باز شدن اپ** و هنگام **ورود به صفحه وام‌ها** فراخوانی شود (lazy update — نه background job چون اپ آفلاین‌فرست است)

> **قانون `status = overdue`**: وامی `overdue` تلقی می‌شود که:
> 1. `status = 'active'` باشد، و
> 2. تاریخ سررسید حداقل یک قسط پرداخت‌نشده از `getUpcomingPayments()` گذشته باشد (یعنی تاریخ قسط < امروز و رکورد پرداخت در `ln_transactions` با `installmentNumber` مربوطه وجود ندارد)
>
> برگشت از `overdue` به `active`: زمانی که کاربر همه اقساط معوق را پرداخت کند، `status` مجدداً `active` می‌شود.

---

## روابط با سایر فیچرها

- **Accounts & Banking**: ثبت تراکنش و تغییر موجودی حساب
- **Currency & Multi-Currency**: دریافت نرخ تبدیل لحظه‌ای (هر پرداخت نرخ خود را دارد)
- **Notification & Reminder**: یادآوری سررسیدها
- **Reports** و **Dashboard**: نمایش مانده بدهی‌ها و مطالبات + محاسبه سود پرداخت شده

---

## نکات طراحی

- برنامه اقساط و محاسبات پردازشی از روی فیلدهای جدول `loans` (مبلغ، نرخ سود، تعداد اقساط، `calculationMethod`، `gracePeriodMonths` و تاریخ‌ها) محاسبه می‌شود.
- `ln_transactions` فقط تاریخچه واقعی پرداخت‌ها را نگه می‌دارد.
- برای محاسبه `remainingBalance`: `remainingBalance -= principalPortion` (فقط اصل تغییر می‌دهد).
- `totalPaidPrincipal` و `totalPaidInterest` برای سرعت Dashboard به‌روزرسانی می‌شوند (بدون جمع کردن تمام ln_transactions).
- برای هر پرداخت، `exchangeRateToBase` ذخیره می‌شود.
- `status = 'overdue'` از طریق `checkAndUpdateOverdueStatus()` به‌روز می‌شود — این تابع هنگام باز شدن اپ و ورود به صفحه وام‌ها فراخوانی می‌شود (Lazy Update، سازگار با Offline-First).

---

## فرمول‌های محاسباتی

### الف) Declining Balance (تناژل سود — وام بانکی)

**محاسبه مبلغ قسط:**
```
r = interestRate / 100 / 12                    // نرخ ماهانه
n = totalInstallments                           // تعداد اقساط
P = principalAmount - serviceFeeAmount (if any)

calculatedInstallment = P × [r(1+r)^n] / [(1+r)^n - 1]
```

**تقسیم هر قسط:**
```
interestPortion = remainingBalance × r
principalPortion = calculatedInstallment - interestPortion
remainingBalance -= principalPortion
```

**مثال:**
- وام ۱۰۰,۰۰۰,۰۰۰ ریال، ۱۸ ماه، ۱۲٪ سالانه
- r = 12 / 100 / 12 = 0.01
- calculatedInstallment = 100000000 × [0.01(1.01)^18] / [(1.01)^18 - 1] ≈ 6,098,000 ریال
- قسط اول: سود = 100000000 × 0.01 = 1,000,000، اصل = 5,098,000

### ب) Flat Rate (سود ثابت)

**محاسبه:**
```
totalInterest = principalAmount × (interestRate / 100) × (totalInstallments * frequency_in_years)
fixedInstallmentAmount = (principalAmount + totalInterest) / totalInstallments
principalPortion = principalAmount / totalInstallments  // ثابت برای تمام اقساط
interestPortion = totalInterest / totalInstallments     // ثابت برای تمام اقساط
```

**مثال:**
- وام ۱۰۰,۰۰۰,۰۰۰ ریال، ۱۲ قسط ماهانه، ۱۲٪
- totalInterest = 100000000 × (12/100) × 1 = 12,000,000
- fixedInstallmentAmount = (100000000 + 12000000) / 12 ≈ 9,333,333

### ج) Qarz Al-Hasaneh (قرض‌الحسنه)

**محاسبه:**
```
serviceFeeAmount = principalAmount × (serviceFeeRate / 100)
installment = principalAmount / totalInstallments
principalPortion = installment
interestPortion = 0
```

**مثال:**
- وام ۱۰۰,۰۰۰,۰۰۰ ریال، ۱۲ قسط، کارمزد ۴٪
- serviceFeeAmount = 100000000 × 0.04 = 4,000,000 (کسر یک‌بار)
- installment = 100000000 / 12 ≈ 8,333,333
- نت وام دریافتی = 100000000 - 4000000 = 96,000,000

### د) Bullet (اصل یک‌جا در پایان)

**محاسبه:**
```
r = interestRate / 100 / 12                    // نرخ ماهانه
// برای ماه‌های ۱ تا (n-1):
interestPortion = remainingBalance × r         // remainingBalance ثابت = principalAmount تا ماه آخر
principalPortion = 0
// برای ماه آخر (شماره n):
interestPortion = remainingBalance × r
principalPortion = remainingBalance            // کل اصل باقیمانده یک‌جا پرداخت می‌شود
```

> چون `principalPortion` تا ماه آخر صفر است، `remainingBalance` (طبق قاعده «فقط با principalPortion کم می‌شود») تا همان لحظه ثابت می‌ماند و سود هر ماه هم ثابت است.

**مثال:**
- وام ۱۰۰,۰۰۰,۰۰۰ ریال، ۱۲ ماه، ۱۸٪ سالانه
- r = 18 / 100 / 12 = 0.015
- ماه ۱ تا ۱۱: interestPortion = 100000000 × 0.015 = 1,500,000، principalPortion = 0
- ماه ۱۲ (آخر): interestPortion = 1,500,000، principalPortion = 100,000,000 (کل اصل)

### ه) بازمحاسبه اقساط پس از پیش‌پرداخت جزئی (Re-amortization)

فقط برای `calculationMethod = 'declining_balance'` معنا دارد (در Flat Rate و Qarz Al-Hasaneh اصل و سود هر قسط از ابتدا ثابت تعریف شده‌اند، پس پیش‌پرداخت جزئی صرفاً `remainingBalance` را کم می‌کند بدون نیاز به بازمحاسبه فرمول).

هنگام ثبت `type = 'early_payment'` با مبلغی که کمتر از کل `remainingBalance` است (پیش‌پرداخت جزئی)، فیلد `recalculateOnEarlyPayment` در `ln_loans` تعیین می‌کند کدام یک از دو حالت زیر اجرا شود. مقدار `null` (پیش‌فرض) معادل `false` در نظر گرفته می‌شود:

**حالت ۱ — `recalculateOnEarlyPayment = false` یا `null` (پیش‌فرض؛ مبلغ قسط ثابت می‌ماند، تعداد اقساط کم می‌شود):**
```
remainingBalance -= earlyPaymentPrincipalAmount
// calculatedInstallment و r بدون تغییر باقی می‌مانند
// تعداد اقساط باقیمانده جدید با حل معادله زیر برای n به‌دست می‌آید:
newRemainingInstallments = ceil( -ln(1 - (remainingBalance × r) / calculatedInstallment) / ln(1 + r) )
// totalInstallments وام به‌روزرسانی می‌شود: totalInstallments = installmentsPaidSoFar + newRemainingInstallments
```

**حالت ۲ — `recalculateOnEarlyPayment = true` (تعداد اقساط باقیمانده ثابت می‌ماند، مبلغ قسط کم می‌شود):**
```
remainingBalance -= earlyPaymentPrincipalAmount
remainingInstallments = totalInstallments - installmentsPaidSoFar   // بدون تغییر
calculatedInstallment = remainingBalance × [r(1+r)^remainingInstallments] / [(1+r)^remainingInstallments - 1]
// از این پس تمام اقساط بعدی با calculatedInstallment جدید محاسبه می‌شوند
```

> **نکته مهم**: در هر دو حالت، `remainingBalance` بلافاصله با مبلغ اصل پیش‌پرداخت (`earlyPaymentPrincipalAmount`، که ممکن است شامل کارمزد پیش‌پرداخت `earlyPaymentFeeAmount` جداگانه هم باشد و آن کارمزد **در `remainingBalance` تأثیری ندارد** — طبق قاعده ۸ در Business Rules) کاهش می‌یابد؛ تفاوت فقط در نحوه محاسبه اقساط آینده است.
> پیش‌پرداخت **کامل** (`earlyPaymentPrincipalAmount = remainingBalance`) وام را می‌بندد (`status = 'completed'`) و نیازی به این تصمیم ندارد.

### و) جریمه دیرکرد

**محاسبه:**
```
overdueAmount = amount_not_paid
penaltyPortion = overdueAmount × (penaltyRate / 100) × (penaltyDays / 365)
```

**مثال:**
- مبلغ معوق: ۱۰,۰۰۰,۰۰۰ ریال
- نرخ جریمه: ۶٪ سالانه
- روزهای تأخیر: ۳۰ روز
- penalty = 10000000 × (6/100) × (30/365) ≈ 49,315 ریال

### ز) دوره تنفس (Grace Period)

اگر `gracePeriodMonths > 0`:
- اولین `gracePeriodMonths` ماه: فقط سود
- بقیه اقساط: اصل + سود (یا صرف اصل برای قرض‌الحسنه)

**مثال:**
- ۱۸ ماه، ۶ ماه تنفس، Declining Balance
- ماه ۱-۶: صرفاً سود
- ماه ۷-۱۸: قسط‌های کامل (اصل + سود)