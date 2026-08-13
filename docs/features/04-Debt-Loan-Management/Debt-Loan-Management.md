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
- در صورت `gracePeriodMonths > 0`، رفتار به روش محاسبه بستگی دارد (Declining: Interest-Only / Qarz: Payment Holiday / Flat Rate و Bullet: مجاز نیستند — بخش «ز» فرمول‌های کامل)

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
- `recalculateOnEarlyPayment` → boolean (فقط برای `declining_balance`؛ نحوه برخورد با پیش‌پرداخت جزئی را مشخص می‌کند — به بخش «بازمحاسبه اقساط پس از پیش‌پرداخت جزئی» مراجعه شود)

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

> **نکته الزامی**: برای وام‌های `variable`، فیلد `interestRate` در `ln_loans` فقط **نرخ اولیه** (در `disbursementDate`) را نشان می‌دهد. برای محاسبه سود هر قسط، سیستم باید آخرین رکورد `ln_rate_history` که `effectiveDate` آن ≤ `dueDate` همان قسط است را پیدا کند و `r` را از روی آن نرخ محاسبه کند (نه از `ln_loans.interestRate`). برای وام‌های `fixed` یا `none`، این جدول اصلاً استفاده نمی‌شود و `interestRate` ثابت `ln_loans` معتبر است. الگوریتم کامل تغییر نرخ و تمام edge caseها در بخش «ه-۲) تغییر نرخ سود در وام‌های Variable Rate» آمده است.

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
- `updateLoanRate(loanId, newRate, effectiveDate, note?)` → فقط برای `interestType = 'variable'` و `calculationMethod = 'declining_balance'`؛ ثبت رکورد جدید در `ln_rate_history` و بازمحاسبه اقساط آینده — الگوریتم کامل در بخش «ه-۲) تغییر نرخ سود در وام‌های Variable Rate»

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
    - اگر `gracePeriodMonths > 0`: رفتار به روش محاسبه بستگی دارد — Declining Balance: Interest-Only (فقط سود، اصل دست‌نخورده)؛ Qarz Al-Hasaneh: Payment Holiday (هیچ پرداختی)؛ Flat Rate و Bullet: مجاز نیست (خطا می‌دهد). جزئیات کامل در بخش «ز) دوره تنفس».
    - شروع از `firstPaymentDate` + `installmentFrequency`
- `getOverduePayments(loanId)` → دریافت اقساط سررسید گذشته (مقایسه با `ln_transactions`)

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
- `status = 'overdue'` زمانی تغییر می‌کند که قسط سررسید گذشته وجود داشته باشد.

---

## فرمول‌های محاسباتی

> **Rounding Policy**: تمام محاسبات وام از `docs/core/rounding/Rounding-Policy.md` پیروی می‌کنند. خلاصه الزامات: (الف) `calculatedInstallment` با ROUND_HALF_UP به ۰ اعشار IRR. (ب) `interestPortion` با ROUND_HALF_UP به ۰ اعشار. (ج) `principalPortion = installment − interestPortion` — هرگز مستقل round نمی‌شود. (د) آخرین قسط: `principalPortion = remainingBalance` (دقیق). (ه) هیچ round میانی در زنجیره محاسبه مجاز نیست.

---

### پیش‌نیاز: محاسبه نرخ دوره‌ای (Period Rate) و تعداد دوره‌ها

**این بخش اساسی‌ترین مفهوم در تمام فرمول‌های وام است.**  
همه فرمول‌های زیر (Declining Balance، Bullet، Re-amortization) به یک `r` (نرخ دوره‌ای) و `n` (تعداد کل دوره‌ها) نیاز دارند. این دو مقدار از `installmentFrequency`، `interestRate`، `interestRatePeriod` و (برای `custom`) `customIntervalDays` محاسبه می‌شوند.

#### قرارداد تبدیل نرخ سالانه به نرخ دوره‌ای

برای همه روش‌های محاسبه از **Simple Division** (تقسیم خطی) استفاده می‌شود، نه Compounding. دلیل: بانک‌ها و مؤسسات مالی ایران نرخ سالانه را به‌صورت خطی تقسیم می‌کنند (Nominal Rate)، نه Effective APR. این قرارداد با استاندارد وام‌های بانکی ایران سازگار است.

```
annualRate = interestRate / 100           // تبدیل درصد به کسر — e.g. 18% → 0.18

// نرخ دوره‌ای (r) بر اساس فرکانس:
r = annualRate / periodsPerYear

// تعداد دوره‌ها در سال (periodsPerYear) بر اساس installmentFrequency:
monthly   → periodsPerYear = 12          // هر ماه یک قسط
weekly    → periodsPerYear = 52          // هر هفته یک قسط
quarterly → periodsPerYear = 4           // هر سه ماه یک قسط
custom    → periodsPerYear = 365 / customIntervalDays   // مثلاً هر ۴۵ روز → 365/45 ≈ 8.111
```

#### Day Count Convention برای `interestRatePeriod = 'annual'`

| `installmentFrequency` | `periodsPerYear` | `r` | یادداشت |
|---|---|---|---|
| `monthly` | ۱۲ | `annualRate / 12` | استاندارد بانک ایران |
| `weekly` | ۵۲ | `annualRate / 52` | هفته ۷ روز — ۵۲ هفته = ۳۶۴ روز (۱ روز کسری قابل چشم‌پوشی برای وام‌های کوتاه‌مدت؛ برای وام‌های بلندمدت هفتگی از `customIntervalDays = 7` استفاده شود تا دقت بالاتر) |
| `quarterly` | ۴ | `annualRate / 4` | استاندارد — ۴ فصل در سال |
| `custom` | `365 / customIntervalDays` | `annualRate × customIntervalDays / 365` | Day Count = Actual/365 — مناسب برای اکثر وام‌های ایرانی |

> **چرا Actual/365 و نه Actual/360؟**  
> در ایران تقویم شمسی ۳۶۵ یا ۳۶۶ روز دارد. برای سادگی و سازگاری با محاسبات بانکی رایج، از ۳۶۵ روز به‌عنوان پایه ثابت استفاده می‌شود (نه ۳۶۶ در سال کبیسه و نه ۳۶۰). اگر وام‌دهنده قرارداد صریحی با پایه متفاوت داشت، می‌توان `customIntervalDays` را با دقت بیشتر تعریف کرد.

#### اگر `interestRatePeriod = 'monthly'` باشد

```
r = interestRate / 100                    // نرخ ماهانه مستقیم — بدون تقسیم بر ۱۲
// در این حالت fequency باید monthly باشد؛ برای weekly/quarterly/custom:
// ابتدا annualRate = r × 12 محاسبه، سپس همان جدول بالا
```

#### مثال: وام هفتگی

- وام ۱۰۰,۰۰۰,۰۰۰ ریال، ۵۲ قسط هفتگی، ۱۸٪ سالانه
- `r = 0.18 / 52 = 0.003461538...`
- `n = 52`
- قسط هفتگی = `100000000 × [r(1+r)^52] / [(1+r)^52 - 1] ≈ 2,115,000 ریال`

#### مثال: وام فصلی (quarterly)

- وام ۱۰۰,۰۰۰,۰۰۰ ریال، ۸ قسط فصلی (۲ سال)، ۲۴٪ سالانه
- `r = 0.24 / 4 = 0.06`
- `n = 8`
- قسط فصلی = `100000000 × [0.06(1.06)^8] / [(1.06)^8 - 1] ≈ 16,103,594 ریال`

#### مثال: وام سفارشی هر ۴۵ روز

- وام ۵۰,۰۰۰,۰۰۰ ریال، ۸ قسط هر ۴۵ روز، ۱۸٪ سالانه
- `r = 0.18 × 45 / 365 = 0.022191...`
- `n = 8`
- قسط = `50000000 × [r(1+r)^8] / [(1+r)^8 - 1] ≈ 6,956,000 ریال`

---

### تابع کمکی `getPeriodRate(loan)`

برای جلوگیری از تکرار این محاسبه در هر فرمول، باید یک تابع مرکزی وجود داشته باشد:

```typescript
/**
 * نرخ دوره‌ای (r) را از تنظیمات وام محاسبه می‌کند.
 * این تنها تابع مجاز برای محاسبه r در کل سیستم وام است.
 * هیچ فرمولی نباید r را مستقیم با annual/12 محاسبه کند.
 */
function getPeriodRate(loan: Loan): Decimal {
  const annualRate = new Decimal(loan.interestRate).dividedBy(100);

  // اگر نرخ ماهانه مستقیم ثبت شده، ابتدا به سالانه تبدیل می‌شود
  const annualRateNormalized =
    loan.interestRatePeriod === 'monthly'
      ? annualRate.times(12)
      : annualRate;

  switch (loan.installmentFrequency) {
    case 'monthly':   return annualRateNormalized.dividedBy(12);
    case 'weekly':    return annualRateNormalized.dividedBy(52);
    case 'quarterly': return annualRateNormalized.dividedBy(4);
    case 'custom':
      if (!loan.customIntervalDays || loan.customIntervalDays <= 0)
        throw new Error('customIntervalDays برای فرکانس custom الزامی است');
      return annualRateNormalized
        .times(loan.customIntervalDays)
        .dividedBy(365);
    default:
      throw new Error(`installmentFrequency نامعتبر: ${loan.installmentFrequency}`);
  }
}

/**
 * تعداد دوره‌های کل (n) را از تنظیمات وام برمی‌گرداند.
 * برای همه روش‌های محاسبه یکسان است.
 */
function getTotalPeriods(loan: Loan): number {
  return loan.totalInstallments;
}
```

> **قانون**: هیچ‌جا در کد نباید `annualRate / 12` یا `interestRate / 100 / 12` به‌صورت مستقیم نوشته شود. همیشه از `getPeriodRate(loan)` استفاده شود.

---

### الف) Declining Balance (تناژل سود)

**محاسبه مبلغ قسط:**
```
r = getPeriodRate(loan)                        // نرخ دوره‌ای (ماهانه / هفتگی / فصلی / custom)
n = getTotalPeriods(loan)                      // تعداد کل اقساط
P = principalAmount                            // (برای قرض‌الحسنه: P = principalAmount - serviceFeeAmount)

calculatedInstallment = P × [r(1+r)^n] / [(1+r)^n - 1]
```

**تقسیم هر قسط i (از ۱ تا n):**
```
interestPortion_i  = remainingBalance × r          // ROUND_HALF_UP به ۰ اعشار
principalPortion_i = installment - interestPortion_i  // بدون round مستقل
remainingBalance  -= principalPortion_i
```

**آخرین قسط (i = n):**
```
principalPortion_n = remainingBalance              // دقیق — تسویه کامل
interestPortion_n  = remainingBalance × r          // ROUND_HALF_UP
installment_n      = principalPortion_n + interestPortion_n  // ممکن است با اقساط قبلی کمی متفاوت باشد
```

**مثال ماهانه:**
- وام ۱۰۰,۰۰۰,۰۰۰ ریال، ۱۸ ماه، ۱۲٪ سالانه
- r = 0.12 / 12 = 0.01
- calculatedInstallment ≈ ۶,۰۹۸,۰۰۰ ریال
- قسط اول: سود = 1,000,000، اصل = 5,098,000

**مثال هفتگی:**
- وام ۱۰۰,۰۰۰,۰۰۰ ریال، ۵۲ قسط، ۱۸٪ سالانه
- r = 0.18 / 52 = 0.003461538
- calculatedInstallment ≈ ۲,۱۱۵,۰۰۰ ریال
- قسط اول: سود = ۳۴۶,۱۵۴، اصل = ۱,۷۶۸,۸۴۶

**مثال فصلی:**
- وام ۱۰۰,۰۰۰,۰۰۰ ریال، ۸ قسط فصلی، ۲۴٪ سالانه
- r = 0.24 / 4 = 0.06
- calculatedInstallment ≈ ۱۶,۱۰۳,۵۹۴ ریال
- قسط اول: سود = ۶,۰۰۰,۰۰۰، اصل = ۱۰,۱۰۳,۵۹۴

---

### ب) Flat Rate (سود ثابت)

**محاسبه:**
```
r        = getPeriodRate(loan)                        // نرخ دوره‌ای
n        = getTotalPeriods(loan)                      // تعداد اقساط
yearsTotal = n / periodsPerYear(loan)                 // مدت کل وام به سال

totalInterest        = principalAmount × (interestRate/100) × yearsTotal
fixedInstallmentAmount = (principalAmount + totalInterest) / n
principalPortion     = principalAmount / n            // ثابت برای تمام اقساط
interestPortion      = totalInterest / n              // ثابت برای تمام اقساط
```

> `periodsPerYear(loan)` همان مخرج تقسیم در `getPeriodRate` است: 12، 52، 4، یا `365/customIntervalDays`.

**مثال ماهانه:**
- وام ۱۰۰,۰۰۰,۰۰۰ ریال، ۱۲ ماه، ۱۲٪ سالانه
- yearsTotal = 12/12 = 1
- totalInterest = 12,000,000
- fixedInstallmentAmount ≈ 9,333,333

**مثال فصلی:**
- وام ۱۰۰,۰۰۰,۰۰۰ ریال، ۸ قسط فصلی، ۲۴٪ سالانه
- yearsTotal = 8/4 = 2
- totalInterest = 100,000,000 × 0.24 × 2 = 48,000,000
- fixedInstallmentAmount = 148,000,000 / 8 = 18,500,000

---

### ج) Qarz Al-Hasaneh (قرض‌الحسنه)

فرکانس تأثیری بر سود ندارد (سود = صفر). فقط تعداد اقساط تغییر می‌کند:

```
serviceFeeAmount = principalAmount × (serviceFeeRate / 100)   // یک‌بار کسر
installment      = principalAmount / totalInstallments         // بدون توجه به فرکانس
principalPortion = installment
interestPortion  = 0
```

**مثال هفتگی:**
- وام ۱۰۰,۰۰۰,۰۰۰ ریال، ۵۲ قسط هفتگی، کارمزد ۴٪
- serviceFeeAmount = 4,000,000
- installment = 100,000,000 / 52 ≈ 1,923,077 ریال در هفته

---

### د) Bullet (اصل یک‌جا در پایان)

```
r = getPeriodRate(loan)                        // نرخ دوره‌ای

// دوره‌های ۱ تا n-1:
interestPortion_i = remainingBalance × r       // remainingBalance ثابت = principalAmount
principalPortion_i = 0

// دوره آخر (n):
interestPortion_n  = remainingBalance × r
principalPortion_n = remainingBalance          // کل اصل یک‌جا
```

**مثال هفتگی:**
- وام ۱۰,۰۰۰,۰۰۰ ریال، ۴ قسط هفتگی Bullet، ۱۸٪ سالانه
- r = 0.18 / 52 = 0.003461538
- هفته ۱-۳: سود = 10,000,000 × 0.003461538 ≈ 34,615 ریال، اصل = 0
- هفته ۴: سود = 34,615، اصل = 10,000,000

**مثال فصلی:**
- وام ۵۰,۰۰۰,۰۰۰ ریال، ۴ قسط Bullet فصلی، ۲۰٪ سالانه
- r = 0.20 / 4 = 0.05
- فصل ۱-۳: سود = 50,000,000 × 0.05 = 2,500,000، اصل = 0
- فصل ۴: سود = 2,500,000، اصل = 50,000,000

---

### ه) بازمحاسبه اقساط پس از پیش‌پرداخت جزئی (Re-amortization)

فقط برای `calculationMethod = 'declining_balance'`. در Flat Rate و Qarz Al-Hasaneh اصل و سود از ابتدا ثابت است؛ پیش‌پرداخت جزئی صرفاً `remainingBalance` را کم می‌کند.

در هر دو حالت زیر، `r = getPeriodRate(loan)` همان نرخ اولیه وام باقی می‌ماند (تغییر نمی‌کند):

**حالت ۱ — مبلغ قسط ثابت، تعداد اقساط کم می‌شود (`recalculateOnEarlyPayment = false`):**
```
remainingBalance -= earlyPaymentPrincipalAmount
// r و calculatedInstallment بدون تغییر
newRemainingInstallments = ceil( -ln(1 - (remainingBalance × r) / calculatedInstallment) / ln(1 + r) )
totalInstallments = installmentsPaidSoFar + newRemainingInstallments
```

**حالت ۲ — تعداد اقساط ثابت، مبلغ قسط کم می‌شود (`recalculateOnEarlyPayment = true`):**
```
remainingBalance -= earlyPaymentPrincipalAmount
remainingInstallments = totalInstallments - installmentsPaidSoFar
calculatedInstallment = remainingBalance × [r(1+r)^remainingInstallments] / [(1+r)^remainingInstallments - 1]
```

> **نکته `r` در re-amortization هفتگی/فصلی/custom**: چون `r = getPeriodRate(loan)` است (نه `annualRate/12`)، فرمول برای همه فرکانس‌ها یکسان کار می‌کند. مثلاً برای وام هفتگی، `r = annualRate/52` در هر دو حالت بالا به‌کار می‌رود.

---

### ه-۲) تغییر نرخ سود در وام‌های Variable Rate

> این بخش فقط برای `interestType = 'variable'` و `calculationMethod = 'declining_balance'` است. برای Flat Rate، Qarz و Bullet با نرخ متغیر باید از ابتدا `interestType = 'fixed'` استفاده شود (نرخ متغیر روی این روش‌ها معنای عملی ندارد).

#### قوانین پایه‌ای (غیرقابل تغییر)

1. **اقساط قبلاً پرداخت‌شده هرگز بازمحاسبه نمی‌شوند.** هر تراکنش در `ln_transactions` تاریخی و تغییرناپذیر است.
2. **`remainingBalance` تغییر نمی‌کند.** تغییر نرخ فقط مبلغ قسط آینده یا تعداد اقساط را تغییر می‌دهد — اصل بدهی دست‌نخورده می‌ماند.
3. **نرخ جدید از اولین قسطی اعمال می‌شود که `dueDate` آن ≥ `effectiveDate` باشد.** هیچ سودِ انباشته‌ای (accrued interest) بین آخرین قسط پرداخت‌شده و `effectiveDate` به‌طور جداگانه محاسبه نمی‌شود — سیستم روزانه سود تجمیع نمی‌کند، بلکه دوره‌ای (per installment) حساب می‌کند.
4. **`interestRate` در `ln_loans` تغییر نمی‌کند** — همان نرخ اولیه است. برای همه محاسبات آینده، `r` از آخرین رکورد `ln_rate_history` با `effectiveDate ≤ dueDate` آن قسط خوانده می‌شود.

#### الگوریتم `updateLoanRate(loanId, newRate, effectiveDate, note?)`

```
// ۱. Validation
if loan.interestType ≠ 'variable' → Error: "فقط برای وام‌های Variable Rate"
if loan.calculationMethod ≠ 'declining_balance' → Error: "تغییر نرخ فقط برای Declining Balance"
if effectiveDate < loan.disbursementDate → Error: "تاریخ مؤثر نمی‌تواند قبل از تاریخ واریز باشد"
if newRate < 0 → Error: "نرخ نمی‌تواند منفی باشد"
if رکوردی با همین effectiveDate قبلاً وجود دارد → Error: "برای این تاریخ قبلاً نرخ ثبت شده"

// ۲. ثبت رکورد جدید
INSERT INTO ln_rate_history (loanId, rate, effectiveDate, note, createdAt)

// ۳. شناسایی اولین قسط آینده متأثر
firstAffectedDueDate = MIN(dueDate) WHERE dueDate ≥ effectiveDate AND status ≠ 'paid'
// اگر همه اقساط پرداخت شده → هیچ بازمحاسبه‌ای لازم نیست (نرخ صرفاً تاریخی ثبت می‌شود)

// ۴. محاسبه وضعیت در لحظه effectiveDate
remainingBalance_atChange   = آخرین remainingBalance از ln_transactions (بعد از آخرین قسط پرداخت‌شده)
remainingInstallments_atChange = totalInstallments - installmentsPaidSoFar

// ۵. بازمحاسبه قسط با نرخ جدید
r_new = getNewPeriodRate(newRate, loan.installmentFrequency, loan.customIntervalDays)

if loan.recalculateOnEarlyPayment = true (حالت: تعداد ثابت، مبلغ تغییر می‌کند):
    calculatedInstallment = remainingBalance_atChange × [r_new(1+r_new)^n] / [(1+r_new)^n - 1]
    // که در آن n = remainingInstallments_atChange
    UPDATE ln_loans SET calculatedInstallment = ...

else (حالت: مبلغ قسط ثابت — recalculateOnEarlyPayment = false):
    // مبلغ قسط دست‌نخورده می‌ماند (کاربر یا همان مبلغ قسط قبلی یا مبلغ توافق‌شده با بانک)
    // تعداد اقساط باقیمانده بازمحاسبه می‌شود:
    newRemainingInstallments = ceil( -ln(1 - (remainingBalance_atChange × r_new) / calculatedInstallment) / ln(1 + r_new) )
    UPDATE ln_loans SET totalInstallments = installmentsPaidSoFar + newRemainingInstallments
```

#### accrued interest — دقیقاً چه اتفاقی می‌افتد؟

سیستم **روزانه سود تجمیع نمی‌کند** (Daily Accrual). سود هر دوره دقیقاً در لحظه محاسبه آن قسط (هنگام `payLoan` یا `getUpcomingPayments`) حساب می‌شود:

```
interestPortion_i = remainingBalance × r_effective(dueDate_i)
```

که در آن `r_effective(dueDate_i)` = نرخ دوره‌ای محاسبه‌شده از آخرین `ln_rate_history.rate` با `effectiveDate ≤ dueDate_i`.

**مثال عملی:**

```
وام: ۱۲۰,۰۰۰,۰۰۰ ریال، ۱۲ قسط ماهانه Declining Balance، نرخ اولیه ۱۸٪

قسط ۱ (فروردین): r = 0.18/12 = 0.015 → سود = 1,800,000، اصل = 4,218,000
قسط ۲ (اردیبهشت): r = 0.015   → سود = 1,736,730، اصل = 4,281,270

→ در اردیبهشت: بانک نرخ را به ۲۴٪ تغییر می‌دهد، effectiveDate = ابتدای خرداد

→ updateLoanRate(loanId, 24, '1404-03-01')
   remainingBalance_atChange = 111,500,730
   r_new = 0.24/12 = 0.02
   remainingInstallments = 10

   if recalculateOnEarlyPayment = true:
       calculatedInstallment = 111,500,730 × [0.02(1.02)^10] / [(1.02)^10 - 1]
                             ≈ 12,373,000 ریال (بالاتر از قسط اولیه ~6,095,000)

قسط ۳ (خرداد): r = 0.02 → سود = 2,230,015، اصل = 10,142,985
// قسط‌های ۱ و ۲ دست‌نخورده؛ سودِ بین قسط ۲ و effectiveDate صفر است (daily accrual نداریم)
```

#### edge caseهای الزامی

| حالت | رفتار |
|------|-------|
| `effectiveDate` قبل از پرداخت اولین قسط | نرخ برای همه اقساط تغییر می‌کند (مثل بازمحاسبه کامل) |
| `effectiveDate` بین دو تاریخ سررسید | نرخ از **قسط بعدی** اعمال می‌شود، نه بازمحاسبه بخشی از دوره |
| دو تغییر نرخ متوالی قبل از پرداخت | هر دو در `ln_rate_history` ثبت می‌شوند؛ `getUpcomingPayments` برای هر قسط آخرین رکورد با `effectiveDate ≤ dueDate` را پیدا می‌کند |
| `newRate = 0` (بخشودگی سود) | مجاز است؛ `calculationMethod` همچنان `declining_balance` می‌ماند؛ قسط‌های آینده فقط اصل خواهند بود |
| نرخ جدید باعث می‌شود `calculatedInstallment < interestPortion` (قسط ثابت پایین‌تر از سود) | در `recalculateOnEarlyPayment = false`: خطا — «مبلغ قسط از سود ماهانه با نرخ جدید کمتر است؛ وام هرگز تسویه نمی‌شود. لطفاً مبلغ قسط را افزایش دهید یا حالت بازمحاسبه را فعال کنید» |

---

### و) جریمه دیرکرد

جریمه روزانه محاسبه می‌شود، نه بر اساس دوره قسط:

```
penaltyPortion = overdueAmount × (penaltyRate / 100) × (penaltyDays / 365)
```

> این فرمول مستقل از `installmentFrequency` است — جریمه همیشه با پایه ۳۶۵ روزه محاسبه می‌شود (Day Count = Actual/365)، حتی اگر قسط‌های وام هفتگی یا فصلی باشند.

**مثال:**
- مبلغ معوق: ۱۰,۰۰۰,۰۰۰ ریال، نرخ جریمه: ۶٪، تأخیر: ۳۰ روز
- penalty = 10,000,000 × (6/100) × (30/365) ≈ 49,315 ریال

---

### ز) دوره تنفس (Grace Period) — رفتار به تفکیک روش محاسبه

> **چهار مفهوم متفاوت** که نباید با هم اشتباه گرفته شوند:
> - **Interest-Only**: وام‌گیرنده هر دوره فقط سود می‌پردازد، اصل دست‌نخورده می‌ماند (Declining Balance در دوره تنفس).
> - **Capitalized Interest**: سود دوره تنفس پرداخت نمی‌شود و به اصل اضافه می‌شود (نوع دیگری از تنفس که در این سیستم پشتیبانی **نمی‌شود** — ثبت می‌شود ولی در نسخه ۱ اعمال نمی‌شود).
> - **Payment Holiday**: هیچ پرداختی (نه اصل، نه سود) انجام نمی‌شود (مناسب Qarz Al-Hasaneh).
> - **Grace Period روی Bullet**: مفهوماً بی‌معنی است (Bullet اصلاً تا قسط آخر هیچ اصلی ندارد).

`gracePeriodMonths` همیشه بر اساس **ماه** تعریف شده، حتی اگر `installmentFrequency` هفتگی یا فصلی باشد. برای تبدیل:

```
gracePeriods = gracePeriodMonths × periodsPerYear(loan) / 12
// monthly:   gracePeriods = gracePeriodMonths × 1
// weekly:    gracePeriods = gracePeriodMonths × 52/12 ≈ gracePeriodMonths × 4.333
//            → round به عدد صحیح با ROUND_DOWN (محافظت از وام‌دهنده)
// quarterly: gracePeriods = gracePeriodMonths / 3
//            → اگر نتیجه کسری شود، ROUND_DOWN
// custom:    gracePeriods = gracePeriodMonths × 30 / customIntervalDays
//            → ROUND_DOWN
```

---

#### ز-۱) Declining Balance — Interest-Only در دوره تنفس

در طول دوره تنفس (دوره‌های ۱ تا `gracePeriods`):
```
principalPortion = 0
interestPortion  = remainingBalance × r      // remainingBalance = principalAmount (دست‌نخورده)
installment      = interestPortion
```

پس از دوره تنفس (دوره‌های `gracePeriods+1` تا `gracePeriods+totalInstallments`):
```
// بازمحاسبه قسط روی همان principalAmount (تغییر نکرده) با تعداد اقساط کامل
calculatedInstallment = P × [r(1+r)^n] / [(1+r)^n - 1]
// که در آن P = principalAmount، n = totalInstallments (بدون کسر gracePeriods)
```

> **نکته مهم**: دوره تنفس به طول مدت وام اضافه می‌شود — تعداد اقساط اصلی (`totalInstallments`) **تغییر نمی‌کند**. کل دوره بازپرداخت = `gracePeriods + totalInstallments`.

**مثال ماهانه:**
- وام ۱۰۰,۰۰۰,۰۰۰ ریال، ۱۸ قسط، ۱۸٪ سالانه، ۲ ماه تنفس
- ماه ۱-۲: فقط سود = 100,000,000 × 0.015 = 1,500,000 ریال
- ماه ۳-۲۰: قسط Declining کامل روی 100,000,000 با n=18

**مثال هفتگی:**
- وام ۱۰۰,۰۰۰,۰۰۰ ریال، ۵۲ قسط هفتگی، ۱۸٪ سالانه، ۲ ماه تنفس
- gracePeriods = 2 × 52/12 = 8.666 → ROUND_DOWN = ۸ هفته
- هفته ۱-۸: فقط سود = 100,000,000 × (0.18/52) ≈ 346,154 ریال
- هفته ۹-۶۰: قسط Declining کامل روی 100,000,000 با n=52

---

#### ز-۲) Flat Rate — تنفس روی Flat Rate مجاز نیست (v1)

در Flat Rate، کل سود وام (`totalInterest`) از همان ابتدا محاسبه و به اقساط تقسیم می‌شود. یک دوره تنفس واقعی مستلزم بازمحاسبه کل جدول سود است که با ساده‌بودن این روش در تضاد است.

**قانون**: اگر `calculationMethod = 'flat_rate'` و `gracePeriodMonths > 0` باشد، سیستم باید در هنگام ثبت وام خطا بدهد:

```
Error: "دوره تنفس برای وام‌های Flat Rate پشتیبانی نمی‌شود.
اگر بانک یا موسسه مالی برای وام شما دوره تنفس تعریف کرده،
لطفاً وام را با تاریخ شروع بعد از پایان دوره تنفس ثبت کنید."
```

> **راه‌حل عملی برای کاربر**: در صورت وجود دوره تنفس از طرف بانک، `startDate` وام را برابر تاریخ اولین قسط اصلی (بعد از تنفس) تنظیم کند و دوره تنفس را به‌عنوان یادداشت (`description`) ثبت کند.

---

#### ز-۳) Qarz Al-Hasaneh — Payment Holiday (بدون هیچ پرداختی)

در قرض‌الحسنه سود وجود ندارد، بنابراین «Interest-Only» معنا ندارد. دوره تنفس در این روش به معنای **Payment Holiday** است: در دوره تنفس هیچ پرداختی (نه اصل، نه سود، نه کارمزد) انجام نمی‌شود.

در طول دوره تنفس (دوره‌های ۱ تا `gracePeriods`):
```
principalPortion = 0
interestPortion  = 0
installment      = 0      // قسط صفر — هیچ پرداختی ثبت نمی‌شود
```

پس از دوره تنفس (دوره‌های `gracePeriods+1` تا `gracePeriods+totalInstallments`):
```
installment      = principalAmount / totalInstallments    // همان فرمول معمول Qarz
principalPortion = installment
interestPortion  = 0
```

> **نکته**: کارمزد خدمات (`serviceFeeAmount`) در روز واریز وام (disbursement) کسر می‌شود و ربطی به دوره تنفس ندارد.

**مثال:**
- وام ۱۰,۰۰۰,۰۰۰ ریال، ۱۲ قسط ماهانه قرض‌الحسنه، کارمزد ۴٪، ۱ ماه تنفس
- ماه ۱: هیچ پرداختی (Payment Holiday)
- ماه ۲-۱۳: installment = 10,000,000 / 12 ≈ 833,333 ریال

---

#### ز-۴) Bullet — دوره تنفس مفهوماً بی‌معنی است

در Bullet، همه اقساط میانی (غیر از آخری) قبلاً `principalPortion = 0` دارند — یعنی وام از ابتدا در حالت «Interest-Only» است. بنابراین یک «دوره تنفس» در بالای Bullet چیزی اضافه نمی‌کند و نباید مجاز باشد.

**قانون**: اگر `calculationMethod = 'bullet'` و `gracePeriodMonths > 0` باشد، سیستم باید در هنگام ثبت وام خطا بدهد:

```
Error: "دوره تنفس برای وام‌های Bullet معنا ندارد.
وام Bullet از ابتدا فقط سود دوره‌ای دارد تا قسط آخر.
برای تمدید مدت وام، تعداد اقساط را افزایش دهید."
```
