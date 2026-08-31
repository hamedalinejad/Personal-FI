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
- فرمول: `installment = P × r(1+r)^n / [(1+r)^n - 1]` که **`r = getPeriodRate(loan)`** — نه همیشه `/12`
- `r` از `interestRate` + `interestRatePeriod` + `installmentFrequency` (+ `customIntervalDays`) به‌صورت deterministic محاسبه می‌شود (بخش «پیش‌نیاز: نرخ دوره‌ای»)
- weekly → `/52`، quarterly → `/4`، monthly → `/12`، custom → `× days/365`
- نیاز: `calculationMethod = 'declining_balance'` و سیستم `calculatedInstallment` را محاسبه می‌کند
- هر قسط: سود = `remainingBalance × r`، اصل = `installment - سود`

**2. Flat Rate (سود ثابت):**
- سود روی کل مبلغ اولیه محاسبه شود
- کاربرد: وام‌های دوستانه، قرض‌الحسنه با کارمزد
- نیاز: `fixedInstallmentAmount` ثابت برای تمام اقساط و شامل **هم اصل و هم سود** است (نه فقط اصل)؛ `fixedInstallmentAmount = (principalAmount + totalInterest) / totalInstallments` (فرمول کامل در بخش «فرمول‌های محاسباتی»)
- هر قسط: اصل = `principalAmount / totalInstallments`، سود = `principalAmount × rate × years / totalInstallments` — این دو مقدار **در داخل** `fixedInstallmentAmount` جمع می‌شوند، نه جدا از آن

**3. Qarz Al-Hasaneh (قرض‌الحسنه):**
- سود = ۰؛ کارمزد خدمات معمولاً ۴٪ یک‌بار در disbursement
- `serviceFeeAmount = principalAmount × serviceFeeRate / 100`
- **قرارداد اصل بدهی**:
 - `principalAmount` = اصل تعهد بازپرداخت (مثلاً ۱۰۰m) — مبنای اقساط و `remainingBalance` اولیه
 - `serviceFeeAmount` = کارمزد جدا (مثلاً ۴m) — **expense** در disbursement؛ از اصل بدهی کم **نمی‌شود**
 - مبلغ نقدی خالص دریافتی کاربر اغلب `principalAmount - serviceFeeAmount` است (اگر fee از محل پرداخت کسر شود)
 - `installment = principalAmount / totalInstallments` (نه 96m)
- **ممنوع**: `P = principal - serviceFee` در فرمول اقساط (تناقض قبلی حذف شد)

**4. Bullet:**
- اصل کل در پایان، سود ماهانه
- نیاز: `calculationMethod = 'bullet'` و `calculatedInstallment` برای سود ماهانه
- هر قسط تا دوره آخر: اصل = ۰، سود = `remainingBalance × r` با همان `getPeriodRate`؛ دوره آخر: کل اصل باقیمانده یک‌جا

**برنامه اقساط:**
- `getUpcomingPayments` باید `calculationMethod` را چک کند
- برای هر روش فرمول‌های متفاوت است
- تاریخ اولین قسط از `firstPaymentDate` شروع می‌شود (ممکن است بعد از `disbursementDate`)
- در صورت `gracePeriods > 0` (canonical؛ نه gracePeriodMonths)، رفتار به روش محاسبه بستگی دارد (Declining: Interest-Only / Qarz: Payment Holiday / Flat Rate و Bullet: مجاز نیستند — بخش «ز»)

### دیگر Business Rules

1. وام می‌تواند از نوع `borrowed` (دریافتی) یا `lent` (پرداختی / طلب) باشد.
2. ارز وام (`loan.currency`) ارز تعهد است. حساب تسویه می‌تواند ارز دیگری داشته باشد (تبدیل در disbursement/payment).
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
14. برای هر پرداخت، `exchangeRateToBase` (ارز قسط → baseCurrency کاربر) ذخیره شود تا ارزش تاریخی به base حفظ شود.

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
- `dayCountConvention` → enum (`actual_365` | `actual_360` | `30_360` | `actual_actual`) — **اجباری برای frequency=custom**؛ پیش‌فرض `actual_365` برای بقیه
- `exchangeRateToBase` → decimal (نرخ ارز وام/قسط → **baseCurrency کاربر** در لحظه ثبت — / ؛ نه الزاماً ریال/تتر)

**تاریخ‌ها:**
- `disbursementDate` → datetime (تاریخ دریافت/واریز وام) ✅ **جدید**
- `firstPaymentDate` → datetime (تاریخ اولین قسط) ✅ **جدید**
- `endDate` → datetime (تاریخ پایان وام)

**حساب:**
- `accountId` → UUID (حساب مرتبط)
- `accountTransactionId` → UUID (لینک به `acc_transactions`)

**محاسبه اقساط (Core):**
- `calculationMethod` → enum v1: (`declining_balance` | `flat_rate` | `bullet` | `qarz_al_hasaneh`) — **حتمی**
  - `annuity` = **alias فقط UI** به `declining_balance` (قسط ثابت / سود روی مانده) — در DB ذخیره نشود
  - `balloon` | `step_up` = **Out of Scope v1** (v2)
- `interestType` → string (`none`, `fixed`, `variable`)
- `interestRate` → decimal (درصد کامل: 18 برای ۱۸٪، نه 0.18)
- `interestRatePeriod` → string (`annual`, `monthly`) — **فقط از طریق `getPeriodRate` وارد فرمول می‌شود**؛ هیچ فرمولی نباید `interestRate/12` را مستقیم فرض کند
- `installmentFrequency` → string (`monthly`, `weekly`, `quarterly`, `custom`)
- `customIntervalDays` → integer (nullable — اجباری اگر frequency=custom)
- `totalInstallments` → integer (تعداد کل اقساط)
- `gracePeriods` → integer (nullable — **canonical** تعداد دوره‌های تنفس؛ 0 یا null = بدون تنفس)
- `gracePeriodUnit` → enum (`installment` | `month`) پیش‌فرض `installment`
- `gracePeriodMonths` / `gracePeriodCount` → **deprecated**؛ فقط مهاجرت خوانده می‌شوند و به `gracePeriods` map می‌شوند
- `calculatedInstallment` → decimal (nullable — محاسبه‌شده برای Declining/Bullet) ✅ **جدید**
- `fixedInstallmentAmount` → decimal (nullable — ثابت برای Flat Rate/Qarz)
- `recalculateOnEarlyPayment` → boolean (فقط برای `declining_balance`؛ نحوه برخورد با پیش‌پرداخت جزئی را مشخص می‌کند — به بخش «بازمحاسبه اقساط پس از پیش‌پرداخت جزئی» مراجعه شود)

**کارمزدها و جریمه:**

> **طراحی**: به‌جای دو فیلد جداگانه `originationFeeAmount`/`originationFeeType` برای هر نوع کارمزد، از یک جدول جدا `ln_loan_fees` استفاده می‌شود که همه کارمزدهای انواع مختلف (صدور، پیش‌پرداخت، ماهانه، تراکنشی، پلکانی) را با ساختار یکسان ذخیره می‌کند. این امکان می‌دهد یک وام چند کارمزد از انواع مختلف داشته باشد — مثلاً کارمزد صدور ثابت + کارمزد ماهانه درصدی از مانده. جزئیات کامل در بخش «Domain Entity: ln_loan_fees» و «ح) انواع کارمزد وام».

- `penaltyRate` → decimal (nullable — نرخ جریمه دیرکرد سالانه — مثلاً 6) ✅ **جدید**
- `penaltyBasis` → enum (nullable — `overdue_installment` | `remaining_balance`; پیش‌فرض: `overdue_installment` — جزئیات در بخش «و) جریمه دیرکرد») ✅ **جدید**
- `penaltyMaxCapAmount` → decimal (nullable — سقف مطلق جریمه به **`loan.currency`**، نه hard-code ریال)
- `penaltyMaxCapRate` → decimal (nullable — سقف جریمه به درصد از اصل — مثلاً 10)
- `penaltyMaxCapCurrency` → string (nullable — پیش‌فرض = `loan.currency`)
- `penaltyGraceDays` → integer (nullable, default: 0 — روزهای معافیت قبل از شروع جریمه) ✅ **جدید**
- `serviceFeeRate` → decimal (nullable — کارمزد قرض‌الحسنه — مثلاً 4) ✅ **جدید**
- `serviceFeeAmount` → decimal (nullable — مبلغ کارمزد محاسبه‌شده) ✅ **جدیدوضعیت:**
- `status` → enum (`active` | `completed` | `cancelled` | `overdue`) ✅ **overdue اضافه شد**
- `remainingBalance` → decimal (مانده باقی‌مانده)

**اسنپ‌شات برای Dashboard:**
- `totalPaidPrincipal` → decimal (مجموع اصل پرداخت‌شده) ✅ **جدید**
- `totalPaidInterest` → decimal (مجموع سود پرداخت‌شده) ✅ **جدیدشرایط:**
- `disbursementType` → enum (`lump_sum`) — **در نسخه ۱ فقط `lump_sum` پشتیبانی می‌شود.** مقدار `phased` (واریز چندمرحله‌ای) از enum حذف شد چون پیاده‌سازی متناظری (چند رکورد `disbursement` و چند `disbursementDate`) وجود ندارد؛ ساختار فعلی (`disbursementDate` و `accountTransactionId` واحد در `ln_loans`) فقط از یک واریز یک‌باره پشتیبانی می‌کند. افزودن `phased` به نسخه‌های بعدی موکول شد و نیازمند API جداگانه (مثلاً `disburseLoanPhase`) و مدل داده چندواریزی خواهد بود.
- `collateralNote` → string (nullable — وثیقه/ضامن) ✅ **جدیدطرف مقابل:**
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
- `exchangeRateToBase` → decimal (نرخ ارز قسط → baseCurrency کاربر — )
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

### ۵. Loan Fees (جدول: `ln_loan_fees`)

یک وام می‌تواند چند کارمزد از انواع مختلف همزمان داشته باشد (مثلاً کارمزد صدور ثابت + کارمزد مدیریت ماهانه). به‌جای ذخیره هر نوع کارمزد در فیلدهای جداگانه `ln_loans`، همه کارمزدها در این جدول با ساختار یکسان ذخیره می‌شوند.

- `id` → UUID (Primary Key)
- `loanId` → UUID
- `accountingTreatment` → enum **اجباری** (`expense` | `proceeds_reduction` | `capitalized_cost` | `reduction_of_carrying_amount`)
- `feeCategory` → enum:
 - `origination` — کارمزد صدور/ثبت (یک‌بار، در disbursement)
 - `early_payment` — کارمزد پیش‌پرداخت (هنگام early_payment)
 - `monthly_management` — کارمزد مدیریت ماهانه (هر دوره قسط)
 - `per_transaction` — به‌ازای هر تراکنش پرداخت
 - `insurance` — حق بیمه وام (ماهانه یا یک‌بار)
 - `other` — سایر کارمزدها با توضیح دستی
- `feeType` → enum:
 - `fixed` — مبلغ ثابت (مثلاً ۵۰۰,۰۰۰ ریال)
 - `percentage_of_principal` — درصدی از اصل وام (`principalAmount`)
 - `percentage_of_installment` — درصدی از مبلغ هر قسط (`calculatedInstallment` یا `fixedInstallmentAmount`)
 - `percentage_of_remaining_balance` — درصدی از مانده وام (برای کارمزدهای ماهانه مثل بعضی وام‌های مسکن)
 - `tiered` — پلکانی (مثلاً: اگر پیش‌پرداخت ≤ ۳۰٪ → ۲٪؛ اگر > ۳۰٪ → ۴٪)
- `amount` → decimal (nullable — مبلغ ثابت برای `feeType = 'fixed'`)
- `amountCurrency` → string (پیش‌فرض `loan.currency`؛ اگر settlement با ارز دیگر، همراه `exchangeRateToLoanCurrency`)
- `rate` → decimal (nullable — نرخ درصدی برای `feeType` های percentage-based — مثلاً 1.5)
- `minAmount` → decimal (nullable — حداقل کارمزد — برای همه انواع)
- `maxAmount` → decimal (nullable — حداکثر کارمزد — برای همه انواع)
- `tiers` → JSON (nullable — فقط برای مهاجرت داده قدیمی؛ داده جدید از `ln_loan_fee_tiers`)
- برای کارمزد پلکانی: ردیف‌های جدول `ln_loan_fee_tiers`

### ۵-الف. Loan Fee Tiers (جدول: `ln_loan_fee_tiers`)

جایگزین رسمی فیلد قدیمی `tiers` (JSON) در `ln_loan_fees`. هر ردیف یک بازه از پلکان کارمزد است.

- `id` → UUID (Primary Key)
- `loanFeeId` → UUID (FK به `ln_loan_fees.id`)
- `thresholdFrom` → decimal (nullable — شروع بازه درصدی یا مبلغی؛ `null` برای اولین tier یعنی از صفر)
- `thresholdTo` → decimal (nullable — پایان بازه؛ `null` برای آخرین tier یعنی بدون سقف)
- `thresholdUnit` → enum: `percent_of_principal` | `absolute_amount` (نوع بازه — درصد از اصل وام یا مبلغ مطلق)
- `rate` → decimal (nullable — نرخ درصدی این tier — مثلاً `2.0` برای ۲٪)
- `fixedAmount` → decimal (nullable — مبلغ ثابت این tier — اگر کارمزد tier ثابت است نه درصدی)
- `sortOrder` → integer (ترتیب ردیف‌ها — از کوچک به بزرگ)
- `createdAt` → datetime

**مثال** (کارمزد پیش‌پرداخت پلکانی):
```
thresholdFrom=null, thresholdTo=30, thresholdUnit=percent_of_principal, rate=1.0 → تا ۳۰٪: ۱٪
thresholdFrom=30, thresholdTo=60, thresholdUnit=percent_of_principal, rate=2.0 → ۳۰٪ تا ۶۰٪: ۲٪
thresholdFrom=60, thresholdTo=null,thresholdUnit=percent_of_principal, rate=3.0 → بالای ۶۰٪: ۳٪
```

> **قانون**: `ln_loan_fee_tiers` فقط برای `feeType = 'tiered'` در `ln_loan_fees` استفاده می‌شود. برای سایر `feeType`ها، این جدول خالی است و `amount`/`rate` در خود `ln_loan_fees` کافی است.
- `calculatedAmount` → decimal (nullable — مبلغ نهایی محاسبه‌شده — پس از `createLoan` یا `payLoan` پر می‌شود)
- `description` → string (nullable — توضیح اضافه، لازم برای `feeCategory = 'other'`)
- `createdAt` → datetime

> **نکته**: `serviceFeeRate`/`serviceFeeAmount` در `ln_loans` مختص قرض‌الحسنه باقی می‌مانند (ساختار ساده‌تر، یک‌بار در disbursement). برای سایر وام‌ها، همه کارمزدها از طریق `ln_loan_fees` مدیریت می‌شوند.

---

### Loan APIs
- `createLoan(data)` 
 → ثبت وام در `ln_loans` (شامل `accountTransactionId`) 
 → ثبت لاگ در `ln_transactions` با `type = 'disbursement'` 
 → ثبت در `acc_transactions` با نوع مناسب (`deposit-loan` یا `withdrawal-loan`) 
 → به‌روزرسانی موجودی حساب
- `updateLoan(id, data)` → ویرایش (فقط قبل از اولین پرداخت)
- `getAllLoans(filters)`
- `getLoanById(id)`
- `getLoanSummary` → مجموع بدهی‌ها و مطالبات
- `cancelLoan(id)` → لغو وام — **فقط قبل از ثبت اولین پرداخت مجاز استقرارداد (الزاماً Atomic — BEGIN/COMMIT)**:
 ```
 BEGIN TRANSACTION;
 1. Guard: بررسی وجود هر رکورد غیر‌void در ln_transactions با type='installment_payment'
 روی این loanId — اگر وجود دارد → ROLLBACK + خطا «لغو وام پس از پرداخت مجاز نیست»
 2. disbursementTx = SELECT * FROM ln_transactions WHERE loanId=? AND type='disbursement' AND isVoided=false
 3. IF disbursementTx EXISTS:
 disbursementTx.isVoided = true (در ln_transactions)
 acc_transactions[disbursementTx.accTxId].isVoided = true
 INSERT reversal_acc_tx (amount=disbursementAmount، به‌طور معکوس — موجودی حساب برمی‌گردد)
 4. UPDATE ln_loans SET status='cancelled'
 COMMIT;
 ```

 > **اگر پرداخت قبلی وجود دارد**: `cancelLoan` خطا برمی‌گرداند. کاربر باید اقساط را به‌صورت دستی با `voidTransaction`/Reversal اصلاح کند — reversal خودکار تراکنش‌های متعدد خارج از scope این تابع است.
 >
 > **چرا گزینه ۱ (محدود) انتخاب شد؟** طبق اصل Immutable Transactions پروژه، reversal خودکار چند تراکنش پیچیده و پرریسک است. سادگی و قابلیت پیش‌بینی ترجیح دارد.
- `updateLoanRate(loanId, newRate, effectiveDate, note?)` → فقط برای `interestType = 'variable'` و `calculationMethod = 'declining_balance'`؛ ثبت رکورد جدید در `ln_rate_history` و بازمحاسبه اقساط آینده — الگوریتم کامل در بخش «ه-۲) تغییر نرخ سود در وام‌های Variable Rate»
- `addLoanFee(loanId, feeData)` → افزودن رکورد کارمزد به `ln_loan_fees`؛ فقط قبل از اولین پرداخت مجاز است (بعد از آن `updateLoanFee` ممنوع)
- `getLoanFees(loanId)` → دریافت تمام کارمزدهای یک وام از `ln_loan_fees`
- `calculateFeeAmount(loanId, feeId, context?)` → محاسبه مبلغ یک کارمزد بر اساس نوعش (برای نمایش پیش از ثبت پرداخت)

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
 - اگر `gracePeriods > 0`: Declining = Interest-Only؛ Qarz = Payment Holiday؛ Flat/Bullet = خطا. جزئیات بخش «ز».
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

- برنامه اقساط از فیلدهای `ln_loans` (شامل `gracePeriods`/`gracePeriodUnit`) + **آخرین** `ln_schedule_snapshots` محاسبه نمایشی؛ تاریخچه از snapshotهای قبلی.
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
annualRate = interestRate / 100 // تبدیل درصد به کسر — e.g. 18% → 0.18

// نرخ دوره‌ای (r) بر اساس فرکانس:
r = annualRate / periodsPerYear

// تعداد دوره‌ها در سال (periodsPerYear) بر اساس installmentFrequency:
monthly → periodsPerYear = 12 // هر ماه یک قسط
weekly → periodsPerYear = 52 // هر هفته یک قسط
quarterly → periodsPerYear = 4 // هر سه ماه یک قسط
custom → periodsPerYear = 365 / customIntervalDays // مثلاً هر ۴۵ روز → 365/45 ≈ 8.111
```

#### Day Count Convention برای `interestRatePeriod = 'annual'`

| `installmentFrequency` | `periodsPerYear` | `r` | یادداشت |
|---|---|---|---|
| `monthly` | ۱۲ | `annualRate / 12` | استاندارد بانک ایران |
| `weekly` | ۵۲ | `annualRate / 52` | هفته ۷ روز — ۵۲ هفته = ۳۶۴ روز (۱ روز کسری قابل چشم‌پوشی برای وام‌های کوتاه‌مدت؛ برای وام‌های بلندمدت هفتگی از `customIntervalDays = 7` استفاده شود تا دقت بالاتر) |
| `quarterly` | ۴ | `annualRate / 4` | استاندارد — ۴ فصل در سال |
| `custom` | `365 / customIntervalDays` | `annualRate × customIntervalDays / 365` | Day Count = Actual/365 — مناسب برای اکثر وام‌های ایرانی |

### فیلد `dayCountConvention` روی `ln_loans` (اجباری برای custom؛ توصیه برای همه)

| مقدار | معنی |
|--------|------|
| `actual_365` | پیش‌فرض پروژه / رایج ایران — پایه ۳۶۵ |
| `actual_360` | Actual/360 بانکی بین‌المللی |
| `30_360` | هر ماه ۳۰ روز، سال ۳۶۰ |
| `actual_actual` | Actual/Actual (سال کبیسه) — Should Have |

```text
r_custom = annualRate × customIntervalDays / yearBasis(dayCountConvention)
yearBasis: actual_365→365, actual_360→360, 30_360→360, actual_actual→daysInYear(asOf)
```

بدون این فیلد، وام‌های مختلف با فرض ضمنی متفاوت drift می‌کنند.

### تقویم اقساط و Business Date

| فیلد | نقش |
|------|------|
| `calendarSystem` | `jalali` \| `gregorian` — برای شمارش ماه تنفس و نمایش |
| `dueDate` | تاریخ سررسید قسط (date محلی قرارداد، نه فقط UTC instant) |
| `firstPaymentDate` | اولین due |
| `businessDayAdjustment` | `none` \| `following` \| `preceding` \| `modified_following` |
| `holidayCalendarId` | nullable — تعطیلات بانکی ایران (Should Have v1: none) |

`gracePeriodMonths` با `calendarSystem` شمرده می‌شود؛ `gracePeriodCount` در صورت پر بودن مقدم است.  
Timestamp UTC برای `createdAt`؛ due/business جدا از clock.UTC.

#### اگر `interestRatePeriod = 'monthly'` باشد

```
r = interestRate / 100 // نرخ ماهانه مستقیم — بدون تقسیم بر ۱۲
// در این حالت frequency باید monthly باشد؛ برای weekly/quarterly/custom:
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
function getYearBasis(dayCountConvention: DayCountConvention): number {
  switch (dayCountConvention) {
    case 'actual_360': return 360;
    case '30_360': return 360;
    case 'actual_365': return 365;
    case 'actual_actual': return 365; // v1 ساده؛ leap در major بعد
    default: return 365;
  }
}

function getPeriodRate(loan: Loan): Decimal {
  const annualRate = new Decimal(loan.interestRate).dividedBy(100);
  const annualRateNormalized =
    loan.interestRatePeriod === 'monthly' ? annualRate.times(12) : annualRate;
  const yearBasis = getYearBasis(loan.dayCountConvention ?? 'actual_365');

  switch (loan.installmentFrequency) {
    case 'monthly': return annualRateNormalized.dividedBy(12);
    case 'weekly': return annualRateNormalized.dividedBy(52);
    case 'quarterly': return annualRateNormalized.dividedBy(4);
    case 'custom':
      if (!loan.customIntervalDays || loan.customIntervalDays <= 0)
        throw new Error('customIntervalDays برای فرکانس custom الزامی است');
      return annualRateNormalized
        .times(loan.customIntervalDays)
        .dividedBy(yearBasis); // NOT hard-coded 365
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
r = getPeriodRate(loan) // نرخ دوره‌ای (ماهانه / هفتگی / فصلی / custom)
n = getTotalPeriods(loan) // تعداد کل اقساط
P = principalAmount // فقط Declining — قرض‌الحسنه از بخش «ج»؛ هرگز serviceFee از P کم نشود اینجا

calculatedInstallment = P × [r(1+r)^n] / [(1+r)^n - 1]
```

**تقسیم هر قسط i (از ۱ تا n):**
```
interestPortion_i = remainingBalance × r // ROUND_HALF_UP به ۰ اعشار
principalPortion_i = installment - interestPortion_i // بدون round مستقل
remainingBalance -= principalPortion_i
```

**آخرین قسط (i = n):**
```
principalPortion_n = remainingBalance // دقیق — تسویه کامل
interestPortion_n = remainingBalance × r // ROUND_HALF_UP
installment_n = principalPortion_n + interestPortion_n // ممکن است با اقساط قبلی کمی متفاوت باشد
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
r = getPeriodRate(loan) // نرخ دوره‌ای
n = getTotalPeriods(loan) // تعداد اقساط
yearsTotal = n / periodsPerYear(loan) // مدت کل وام به سال

totalInterest = principalAmount × (interestRate/100) × yearsTotal
fixedInstallmentAmount = (principalAmount + totalInterest) / n
principalPortion = principalAmount / n // ثابت برای تمام اقساط
interestPortion = totalInterest / n // ثابت برای تمام اقساط
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
serviceFeeAmount = principalAmount × (serviceFeeRate / 100) // fee جدا — expense
remainingBalance0 = principalAmount // اصل بدهی کامل
installment = principalAmount / totalInstallments
principalPortion = installment
interestPortion = 0
// netCashAtDisbursement (اغلب) = principalAmount - serviceFeeAmount وقتی fee از پرداخت کسر شود
```

**مثال هفتگی:**
- اصل تعهد ۱۰۰,۰۰۰,۰۰۰؛ کارمزد ۴٪ = ۴,۰۰۰,۰۰۰؛ خالص دریافتی ≈ ۹۶,۰۰۰,۰۰۰
- remainingBalance اولیه = **۱۰۰,۰۰۰,۰۰۰**
- installment = ۱۰۰,۰۰۰,۰۰۰ / ۵۲ ≈ ۱,۹۲۳,۰۷۷
- اقساط جمعاً اصل ۱۰۰m را تسویه می‌کنند؛ fee جدا در `fee_payment` / journal

---

### د) Bullet (اصل یک‌جا در پایان)

```
r = getPeriodRate(loan) // نرخ دوره‌ای

// دوره‌های ۱ تا n-1:
interestPortion_i = remainingBalance × r // remainingBalance ثابت = principalAmount
principalPortion_i = 0

// دوره آخر (n):
interestPortion_n = remainingBalance × r
principalPortion_n = remainingBalance // کل اصل یک‌جا
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
remainingBalance_atChange = آخرین remainingBalance از ln_transactions (بعد از آخرین قسط پرداخت‌شده)
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
قسط ۲ (اردیبهشت): r = 0.015 → سود = 1,736,730، اصل = 4,281,270

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

### و) جریمه دیرکرد — مدل کامل برای ایران

#### مفاهیم پایه‌ای (اجباری برای پیاده‌سازی صحیح)

> **پنج سوال حیاتی که باید قبل از اعمال جریمه جواب داشته باشند:**
> 1. ساده یا مرکب؟ → **ساده (Simple Interest)** — بانک مرکزی ایران جریمه مرکب را در قراردادهای بانکی معتبر نمی‌شناسد.
> 2. روزانه یا ماهانه؟ → **روزانه، پایه ۳۶۵ روز** (Actual/365) — مستقل از `installmentFrequency`.
> 3. روی چه مبلغی؟ → **روی مبلغ معوق قسط** (اصل + سود همان قسط که دیر پرداخت شده) — نه روی کل `remainingBalance`.
> 4. آیا سود معوق هم جریمه می‌خورد؟ → **در نسخه ۱: خیر** — جریمه فقط روی `overdueInstallmentAmount` (اصل + سود همان قسط) محاسبه می‌شود، نه روی جریمه‌های انباشته قبلی (جریمه مرکب).
> 5. سقف جریمه؟ → **اختیاری** — `penaltyMaxCapAmount` (مطلق) یا `penaltyMaxCapRate` (درصدی از اصل) که در `ln_loans` ذخیره می‌شود.

#### تعریف `overdueAmount`

```
// هر قسط که dueDate آن گذشته و status آن 'unpaid' است:
overdueInstallmentAmount = principalPortion + interestPortion // مبلغ معوق همان قسط (نه کل وام)

// اگر چند قسط همزمان عقب باشند، جریمه هر قسط جداگانه با penaltyDays مختص خودش محاسبه می‌شود
penaltyDays_i = (today - dueDate_i).days // تعداد روزهای دیرکرد قسط i
```

#### فرمول جریمه (Simple Interest — Actual/365)

```
penaltyPortion_i = overdueInstallmentAmount_i × (penaltyRate / 100) × (penaltyDays_i / 365)
```

**سقف جریمه (اگر تعریف شده باشد):**
```
if penaltyMaxCapAmount is not null:
 penaltyPortion_i = MIN(penaltyPortion_i, penaltyMaxCapAmount)

if penaltyMaxCapRate is not null:
 maxByRate = principalAmount × (penaltyMaxCapRate / 100) // سقف درصدی از اصل وام
 penaltyPortion_i = MIN(penaltyPortion_i, maxByRate)
```

**جمع جریمه کل (چند قسط معوق):**
```
totalPenalty = Σ penaltyPortion_i // برای هر قسط معوق جداگانه
```

> **قانون مهم**: جریمه روی جریمه (Compound Penalty) ممنوع است — `penaltyPortion` قبلاً پرداخت‌نشده هرگز به `overdueInstallmentAmount` اضافه نمی‌شود.

#### فیلدهای جدید در `ln_loans`

```
penaltyRate → decimal (nullable — نرخ سالانه جریمه، درصد — مثلاً 6)
penaltyBasis → enum ('overdue_installment' | 'remaining_balance')
 // پیش‌فرض: 'overdue_installment' (توصیه‌شده برای ایران)
 // 'remaining_balance': برخی وام‌های تجاری/خاص — جریمه روی کل مانده
penaltyMaxCapAmount → decimal (nullable — سقف مطلق جریمه — مثلاً ۵,۰۰۰,۰۰۰ ریال)
penaltyMaxCapRate → decimal (nullable — سقف جریمه به‌عنوان درصد از اصل — مثلاً 10 یعنی حداکثر ۱۰٪ اصل)
penaltyGraceDays → integer (nullable, default: 0 — روزهای تأخیر قبل از شروع جریمه)
 // اگر penaltyGraceDays = 3: تا ۳ روز تأخیر جریمه تعلق نمی‌گیرد؛ از روز ۴ به بعد
 // penaltyDays_effective = MAX(0, penaltyDays - penaltyGraceDays)
```

#### فرمول نهایی با `penaltyGraceDays` و `penaltyBasis`

```
penaltyDays_effective = MAX(0, penaltyDays_i - (penaltyGraceDays ?? 0))

if penaltyBasis = 'overdue_installment':
 base = overdueInstallmentAmount_i // اصل + سود همان قسط معوق
else: // 'remaining_balance'
 base = remainingBalance // کل مانده وام (برای وام‌های خاص)

penaltyPortion_i = base × (penaltyRate / 100) × (penaltyDays_effective / 365)

// اعمال سقف:
if penaltyMaxCapAmount is not null:
 penaltyPortion_i = MIN(penaltyPortion_i, penaltyMaxCapAmount)
if penaltyMaxCapRate is not null:
 penaltyPortion_i = MIN(penaltyPortion_i, principalAmount × penaltyMaxCapRate / 100)
```

#### مثال‌های عددی

**مثال ۱ — بانک معمولی ایران:**
```
قسط معوق: اصل ۵,۰۰۰,۰۰۰ + سود ۵۰۰,۰۰۰ = ۵,۵۰۰,۰۰۰ ریال
penaltyRate: 6٪، penaltyDays: 30، penaltyGraceDays: 0، penaltyBasis: 'overdue_installment'

penalty = 5,500,000 × (6/100) × (30/365) = 27,123 ریال
```

**مثال ۲ — با دوره معافیت:**
```
penaltyGraceDays: 3، penaltyDays: 10
penaltyDays_effective = 10 - 3 = 7
penalty = 5,500,000 × (6/100) × (7/365) = 6,329 ریال
```

**مثال ۳ — دو قسط معوق با سقف:**
```
قسط ۱: ۵,۵۰۰,۰۰۰ ریال، ۴۵ روز دیر
قسط ۲: ۵,۵۰۰,۰۰۰ ریال، ۱۵ روز دیر
penaltyRate: 6٪، penaltyMaxCapAmount: 50,000 ریال

penalty_1 = 5,500,000 × 0.06 × (45/365) = 40,685 ریال → MIN(40,685, 50,000) = 40,685 ریال
penalty_2 = 5,500,000 × 0.06 × (15/365) = 13,562 ریال → MIN(13,562, 50,000) = 13,562 ریال
totalPenalty = 54,247 ریال
// سقف روی هر قسط جداگانه اعمال می‌شود، نه روی مجموع
```

**مثال ۴ — قرض‌الحسنه (penaltyRate = null):**
```
جریمه دیرکرد برای قرض‌الحسنه تعلق نمی‌گیرد (penaltyRate = null)
// سیستم نباید جریمه محاسبه کند — عدم پرداخت صرفاً وضعیت 'overdue' می‌شود
```

#### ثبت جریمه در `ln_transactions`

```
type: 'penalty'
amount: penaltyPortion (مجموع همه قسط‌های معوق در این پرداخت)
penaltyPortion: penaltyPortion
penaltyDays: penaltyDays_i (برای قسط جداگانه — اگر چند قسط معوق است، یک رکورد penalty جداگانه برای هر قسط)
principalPortion: 0
interestPortion: 0
// جریمه remainingBalance را تغییر نمی‌دهد
```

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
// monthly: gracePeriods = gracePeriodMonths × 1
// weekly: gracePeriods = gracePeriodMonths × 52/12 ≈ gracePeriodMonths × 4.333
// → round به عدد صحیح با **ROUND_DOWN عمدی** (business rule v1)
// دلیل: تعداد دوره‌های تنفس کمتر یا مساوی ≈ ماه تقویمی → محافظت نسبی وام‌دهنده / جلوگیری از طولانی‌کردن تنفس
// ROUND_HALF_UP یا ROUND_UP در v1 مجاز نیست مگر migration policy صریح کاربر
// quarterly: gracePeriods = gracePeriodMonths / 3
// → اگر نتیجه کسری شود، ROUND_DOWN
// custom: gracePeriods = gracePeriodMonths × 30 / customIntervalDays


> **قرارداد تنفس**:
> 1. اگر `gracePeriodCount` مقدار داشته باشد → همان تعداد period با فرکانس وام (هفتگی/فصلی/…) اعمال می‌شود.
> 2. وگرنه `gracePeriodMonths` به period تبدیل می‌شود: `gracePeriods = gracePeriodMonths × periodsPerYear(loan) / 12` (همان جدول موجود).
> 3. تاریخ واقعی پایان تنفس از `firstPaymentDate` و تعداد period محاسبه می‌شود، نه فقط جمع ماه‌های خام روی تقویم وقتی frequency هفتگی است.

// → ROUND_DOWN
```

---

#### ز-۱) Declining Balance — Interest-Only در دوره تنفس

در طول دوره تنفس (دوره‌های ۱ تا `gracePeriods`):
```
principalPortion = 0
interestPortion = remainingBalance × r // remainingBalance = principalAmount (دست‌نخورده)
installment = interestPortion
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
- gracePeriods = 2 × 52/12 = 8.666 → **ROUND_DOWN = ۸ هفته** (~۵۶ روز < ۲ ماه تقویمی)
  - این کوتاه‌تر شدن تنفس **عمدی** است (قرارداد v1)، نه باگ
  - اگر کاربر دقیقاً N هفته تنفس می‌خواهد → `gracePeriods` را مستقیم با unit=installment بزند، نه از months تبدیل کند
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
interestPortion = 0
installment = 0 // قسط صفر — هیچ پرداختی ثبت نمی‌شود
```

پس از دوره تنفس (دوره‌های `gracePeriods+1` تا `gracePeriods+totalInstallments`):
```
installment = principalAmount / totalInstallments // همان فرمول معمول Qarz
principalPortion = installment
interestPortion = 0
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

---

### ح) انواع کارمزد وام — مدل محاسباتی کامل

کارمزدها از `ln_loan_fees` خوانده می‌شوند. محاسبه هر نوع:

#### ح-۱) Fixed — مبلغ ثابت

```
calculatedAmount = fee.amount
// اعمال کف و سقف:
if fee.minAmount: calculatedAmount = MAX(calculatedAmount, fee.minAmount)
if fee.maxAmount: calculatedAmount = MIN(calculatedAmount, fee.maxAmount)
```

**مثال:** کارمزد صدور ثابت ۵۰۰,۰۰۰ ریال.

---

#### ح-۲) Percentage of Principal — درصد از اصل

```
calculatedAmount = principalAmount × (fee.rate / 100)
if fee.minAmount: calculatedAmount = MAX(calculatedAmount, fee.minAmount)
if fee.maxAmount: calculatedAmount = MIN(calculatedAmount, fee.maxAmount)
```

**مثال:** کارمزد صدور ۱٪ از اصل وام ۱۰۰,۰۰۰,۰۰۰ ریال = ۱,۰۰۰,۰۰۰ ریال.

---

#### ح-۳) Percentage of Installment — درصد از قسط

```
installmentBase = calculatedInstallment ?? fixedInstallmentAmount
calculatedAmount = installmentBase × (fee.rate / 100)
if fee.minAmount: calculatedAmount = MAX(calculatedAmount, fee.minAmount)
if fee.maxAmount: calculatedAmount = MIN(calculatedAmount, fee.maxAmount)
```

> برای `feeCategory = 'monthly_management'` با این نوع، `calculatedAmount` به‌ازای هر قسط محاسبه و در `ln_transactions` ثبت می‌شود (نه یک‌بار در disbursement).

**مثال:** کارمزد مدیریت ۰.۵٪ از هر قسط ۶,۰۰۰,۰۰۰ ریالی = ۳۰,۰۰۰ ریال در هر قسط.

---

#### ح-۴) Percentage of Remaining Balance — درصد از مانده (ماهانه)

```
// محاسبه در لحظه هر قسط:
calculatedAmount = remainingBalance × (fee.rate / 100)
if fee.minAmount: calculatedAmount = MAX(calculatedAmount, fee.minAmount)
if fee.maxAmount: calculatedAmount = MIN(calculatedAmount, fee.maxAmount)
```

> `remainingBalance` در این فرمول، مانده **قبل از کسر اصل همان قسط** است.

**مثال:** کارمزد بیمه وام ۰.۱٪ از مانده ۹۰,۰۰۰,۰۰۰ ریال = ۹۰,۰۰۰ ریال.

---

#### ح-۵) Tiered — پلکانی

```json
// fee.tiers نمونه (برای کارمزد پیش‌پرداخت):
[
 { "upToPercent": 30, "rate": 1.0 },
 { "upToPercent": 60, "rate": 2.0 },
 { "upToPercent": 100, "rate": 3.0 }
]
```

```
earlyPaymentPercent = (earlyPaymentPrincipalAmount / originalPrincipalAmount) × 100

// پیدا کردن tier مناسب:
applicableTier = اولین tier که earlyPaymentPercent ≤ upToPercent
calculatedAmount = earlyPaymentPrincipalAmount × (applicableTier.rate / 100)
if fee.minAmount: calculatedAmount = MAX(calculatedAmount, fee.minAmount)
if fee.maxAmount: calculatedAmount = MIN(calculatedAmount, fee.maxAmount)
```

> اگر `earlyPaymentPercent` از همه `upToPercent`ها بیشتر شد (tier آخر)، آخرین tier اعمال می‌شود.

**مثال:**
- اصل وام: ۱۰۰,۰۰۰,۰۰۰ ریال
- پیش‌پرداخت: ۲۵,۰۰۰,۰۰۰ ریال → ۲۵٪ از اصل → tier اول (≤30٪) → ۱٪
- کارمزد = ۲۵,۰۰۰,۰۰۰ × ۰.۰۱ = ۲۵۰,۰۰۰ ریال

---

#### ح-۶) زمان‌بندی ثبت کارمزدها در `ln_transactions`

| feeCategory | زمان ثبت در ln_transactions |
|-------------|----------------------------|
| `origination` | هنگام `createLoan` (disbursement) — قبل یا همزمان با واریز |
| `early_payment` | هنگام `payLoan` با `type='early_payment'` |
| `monthly_management` | هنگام `payLoan` با `type='installment_payment'` — همراه هر قسط |
| `per_transaction` | هنگام هر `payLoan` (صرف‌نظر از نوع) |
| `insurance` | بر اساس تعریف: اگر `monthly_management` → هر قسط؛ اگر `origination` → یک‌بار |
| `other` | بر اساس `description` — دستی توسط کاربر |

> **نکته**: تمام ثبت‌های کارمزد با `type = 'fee_payment'` و `feePortion = calculatedAmount` در `ln_transactions` ذخیره می‌شوند. `feeType` در `ln_transactions` به `ln_loan_fees.feeCategory` اشاره می‌کند. هیچ کارمزدی `remainingBalance` را تغییر نمی‌دهد.

---

#### ح-۷) مثال ترکیبی — وام بانکی با سه کارمزد همزمان

```
وام: ۵۰۰,۰۰۰,۰۰۰ ریال، ۶۰ قسط ماهانه Declining Balance

ln_loan_fees:
 1. origination / percentage_of_principal / rate=1.5 / max=5,000,000
 → calculatedAmount = 500,000,000 × 1.5% = 7,500,000 → MIN(7,500,000, 5,000,000) = 5,000,000 ریال
 → ثبت یک‌بار در disbursement

 2. monthly_management / percentage_of_installment / rate=0.3
 → calculatedAmount per month = 9,500,000 × 0.3% ≈ 28,500 ریال
 → ثبت همراه هر یک از ۶۰ قسط

 3. early_payment / tiered
 → tiers: [{upToPercent:50, rate:1}, {upToPercent:100, rate:2}]
 → فقط اگر پیش‌پرداخت انجام شود محاسبه می‌شود
```

---

## Accounting Treatment کارمزد وام

علاوه بر محاسبه مبلغ، هر `ln_loan_fees.feeCategory` باید `accountingTreatment` داشته باشد:

| feeCategory | treatment پیش‌فرض | اثر |
|-------------|-------------------|-----|
| `origination` | `expense` یا `proceeds_reduction` | کاهش net cash دریافتی؛ **نه** کاهش principal liability مگر صریح |
| `early_payment` | `expense` | با پیش‌پرداخت؛ remainingBalance فقط از portion اصل کم می‌شود |
| `monthly_management` | `expense` | همراه قسط؛ به principal اضافه نمی‌شود |
| `per_transaction` | `expense` | |
| `insurance` | `expense` | |
| `tiered` (زیرگروه early) | `expense` | |

قوانین:
1. فیلد `accountingTreatment`: `expense` | `capitalized_cost` | `proceeds_reduction` | `reduction_of_liability`
2. پیش‌فرض پروژه: **هیچ feeای remainingBalance/liability را کم نمی‌کند** مگر `reduction_of_liability` صریح (نادر).
3. هر fee → `ln_transactions type=fee_payment` + journal line `lineKind=fee` روی `fin_accounts` مناسب.
4. `capitalized_cost` فقط اگر محصولاً به cost of borrowing اضافه شود و در گزارش جداگانه مستند باشد.

---


### مثال عددی Variable Rate (مرجع تست)

```
اصل: 120,000,000 IRR
n اولیه: 12 ماهانه، نرخ اولیه 18٪ سالانه → r0 = 0.015
قسط اولیه ≈ 10,978,000 (تقریبی؛ در تست با decimal.js دقیق محاسبه شود)

پرداخت قسط ۱ و ۲ با r0 انجام و immutable است.

updateLoanRate(newRate=24٪ annual, effectiveDate = dueDate قسط ۳)
r_new = 0.02
remainingBalance بعد از قسط ۲ را از ledger بخوان (مثلاً ≈ 100,150,000)
remainingInstallments = 10

اگر recalculateOnEarlyPayment / تعداد ثابت:
  calculatedInstallment_new = P_rem × [r(1+r)^10]/[(1+r)^10-1] با r=0.02

اقساط ۱–۲: بدون تغییر در history
اقساط ۳–۱۲: با r_new
ln_loans.interestRate همچنان 18 (نرخ اولیه)
ln_rate_history: { rate:24, effectiveDate: ... }
```

تست: `payLoan` قسط ۳ باید `interestPortion = remaining × 0.02` بسازد نه 0.015.


## راهنمای پیاده‌سازی (برای توسعه‌دهنده)

### توابع اجباری Domain
| API | نقش |
|-----|------|
| `getPeriodRate(loan)` | تنها منبع `r` — هرگز `/12` ثابت |
| `getTotalPeriods(loan)` | `n = totalInstallments` |
| `getUpcomingPayments(loanId)` | جدول اقساط آینده بر اساس method + grace |
| `createLoan(data)` | ایجاد وام + disbursement atomic |
| `payLoan(loanId, payload)` | قسط / بهره / early / fee |
| `addLoanFee` / `calculateFeeAmount` | قبل از اولین پرداخت قابل‌تعریف |
| `reconcileLoan` / `rebuildLoanFromLedger` | snapshot vs ledger |

### `createLoan` — ترتیب Atomic
```text
BEGIN
  INSERT ln_loans (remainingBalance = principalAmount)
  INSERT ln_loan_fees (+ tiers rows if tiered)
  if qarz: compute serviceFeeAmount; INSERT fee_payment (expense)
  INSERT ln_transactions type=disbursement
  if borrowed: acc deposit-loan | if lent: acc withdrawal-loan
  fin_journal_entries (loan + optional fee)
  update account snapshots
COMMIT → persist
```

### `payLoan` — قسط معمولی
```text
BEGIN
  compute interestPortion / principalPortion with getPeriodRate (+ variable rate from ln_rate_history if needed)
  INSERT ln_transactions installment_payment
  remainingBalance -= principalPortion
  optional monthly_management / per_transaction fees as fee_payment rows
  acc_transactions (withdrawal-loan or deposit-loan per borrowed/lent)
  journal entries
COMMIT → persist
```

### Invariants
- `remainingBalance >= 0`؛ قسط آخر principalPortion = remainingBalance دقیق
- همه مبالغ decimal string + Rounding-Policy
- `exchangeRateToBase` روی هر ln_transaction و acc مرتبط
- fee پیش‌فرض **remainingBalance را عوض نمی‌کند**
- variable rate: r از آخرین `ln_rate_history.effectiveDate <= dueDate`

### تست‌های حداقل
1. Declining monthly + weekly + custom interval  
2. Qarz: remaining = full principal؛ fee جدا  
3. Grace: interest-only vs payment holiday  
4. Early payment با/بدون re-amortize  
5. reconcileLoan بعد از payLoan → ok

---

## Multi-Currency Loan Settlement

| فیلد | نقش |
|------|-----|
| `currency` | ارز اصل تعهد و اقساط محاسبه‌شده |
| `settlementAccountId` | حساب بانکی تسویه (می‌تواند ارز ≠ loan.currency) |
| `disbursementFxRate` | اگر settlement ≠ loan currency: نرخ قفل‌شده روز واریز |
| `paymentFxRate` | روی هر `payLoan` وقتی حساب ≠ loan currency |

```text
disburse USD loan to IRR account:
  liability in USD = principal
  bank cash IRR += principalUSD × disbursementFxRate
  journal: Dr cash IRR / Cr loan_liability USD (amountInBase هر دو leg)
```

ممنوع فرض hard-code «همه چیز ریال».

---

## سقف جریمه (Cap)

| فیلد | معنی |
|------|------|
| `penaltyMaxCapAmount` | مبلغ سقف به **`loan.currency`** (نه hard-code ریال) |
| `penaltyMaxCapCurrency` | اختیاری؛ پیش‌فرض = `loan.currency` |
| `penaltyCapScope` | `per_installment` \| `loan_lifetime` \| `per_calendar_period` |

- `per_installment`: MIN(penalty_i, cap) برای هر قسط جدا  
- `loan_lifetime`: Σ penalties تا کنون ≤ cap؛ باقی قسط‌ها صفر یا کاهش‌یافته  
- `per_calendar_period`: سقف در بازه (مثلاً سال)

پیاده‌سازی باید `penaltyCapScope` را enforce کند — پیش‌فرض پیشنهادی ایران: `per_installment` با مستندسازی صریح در UI.

---

## Accounting Classification کارمزد وام (تکمیل)

| feeCategory | treatment پیش‌فرض | توضیح |
|-------------|-------------------|--------|
| `origination` | `proceeds_reduction` یا `expense` | کاهش net cash دریافتی؛ liability = full principal مگر policy دیگر |
| `monthly_management` / `service` | `expense` | دوره‌ای |
| `early_payment` / prepayment | `expense` | با پیش‌پرداخت |
| `late` / penalty | `expense` | نه افزایش principal |
| `insurance` | `expense` | |

فیلد `accountingTreatment` روی `ln_loan_fees` اجباری در create.

---

## Flat Rate — تابع واحد deterministic

```text
function flatRateTotalInterest(loan):
  r_annual = normalizeToAnnual(loan.interestRate, loan.interestRatePeriod)
  // interestRatePeriod=monthly → r_annual = rate * 12 (اگر rate ماهانه وارد شده)
  yearsTotal = getTotalPeriods(loan) / periodsPerYear(loan)
  // مثال: 18 ماه ماهانه → yearsTotal=1.5
  // 78 هفته → yearsTotal = 78/52
  return principalAmount × (r_annual/100) × yearsTotal

fixedInstallment = (principal + totalInterest) / n
principalPortion = principal / n
interestPortion = totalInterest / n
```

مثال: 18٪ annual، ۱۸ ماه، اقساط هفتگی:
`n = weeks in term`, `yearsTotal = n/52`, `totalInterest = P × 0.18 × yearsTotal`.

همه از `getPeriodRate` / `periodsPerYear` / `getTotalPeriods` — بدون فرمول موازی.

---

## Cash Linkage چندمرحله‌ای

`ln_loans.accountTransactionId` فقط **disbursement اولیه (lump_sum)** را نگه می‌دارد.

هر رویداد بعدی cash در **`ln_transactions.accountTransactionId`** لینک می‌شود:
`installment_payment`, `fee_payment`, `penalty`, `early_payment`, `interest_payment`.

برای facility/phased آینده: جدول `ln_disbursements` (Should Have) با چند ردیف؛ v1 فقط یک disbursement.

گزارش lifecycle از join `ln_transactions` ↔ `acc_transactions` — نه از یک FK روی header وام.

---

## Schedule Snapshot (بازتولید تاریخی)

جدول `ln_schedule_snapshots` (Must برای variable/early recalc):

| فیلد | نقش |
|------|-----|
| `id` | UUID |
| `loanId` | FK |
| `generatedAt` | زمان تولید |
| `reason` | `create` \| `rate_change` \| `early_payment` \| `recalculate` |
| `operationId` | atomic op |
| `payload` | JSON: لیست اقساط آینده `{ dueDate, principal, interest, fee, total }[]` |
| `calculationVersion` | |

برنامه «فعلی» = آخرین snapshot؛ تاریخچه = همه ردیف‌ها. Transaction log پرداخت‌ها را نگه می‌دارد؛ snapshot می‌گوید سیستم **چه برنامه‌ای** در آن لحظه تولید کرده بود.

---

## Grace Period — Invariant دیتابیس

```sql
-- پس از migration به canonical:
CHECK (gracePeriods IS NULL OR gracePeriods >= 0)
CHECK (gracePeriodUnit IN ('installment', 'month'))
-- فیلدهای deprecated در schema جدید nullable و فقط read در migrate
```

Domain: فقط `gracePeriods` + `gracePeriodUnit` برای محاسبه. نوشتن همزمان months/count متناقض در API create ممنوع (reject).

---

## ثبت پرداخت در UI (v1)

**ترجیح:** یک عمل «پرداخت قسط + کارمزد + جریمه» = **چند ردیف** `ln_transactions` با یک `operationId`:
1. `installment_payment` — فقط `principalPortion + interestPortion` (= amount)
2. صفر یا چند `fee_payment`
3. صفر یا چند `penalty`

ترکیب fee/penalty داخل همان ردیف قسط **مجاز ولی توصیه نمی‌شود**؛ اگر ترکیب شد invariant جمع portions برقرار است.

## Invariants قطعی ln_transactions

### مبلغ
```text
برای type ∈ {installment_payment, early_payment}:
  amount = principalPortion + interestPortion + coalesce(feePortion,0) + coalesce(penaltyPortion,0)

برای interest_payment:
  principalPortion = 0 یا null
  amount = interestPortion + coalesce(feePortion,0) + coalesce(penaltyPortion,0)

برای fee_payment:
  amount = feePortion
  principalPortion = interestPortion = 0/null

برای penalty:
  amount = penaltyPortion
  principalPortion = 0/null

برای disbursement:
  amount = net cash حرکت؛ principal روی remainingBalance جدا
```

### Type semantics
| type | principal | interest | معنی |
|------|-----------|----------|------|
| installment_payment | ≥0 | ≥0 | قسط عادی (اصل+سود در یک پرداخت) |
| interest_payment | 0 | >0 | فقط سود (مثلاً دوره تنفس interest-only) |
| early_payment | >0 معمولاً | طبق schedule | پیش‌پرداخت؛ ممکن است feePortion داشته باشد |
| fee_payment | 0 | 0 | فقط کارمزد |
| penalty | 0 | 0 | فقط جریمه |

### remainingBalance — SoT
```text
Source of Truth = rebuild از ln_transactions:
  start = principalAmount (پس از disbursement policy)
  − Σ principalPortion (isVoided=false)
snapshot remainingBalance روی ln_loans = projection پس از هر atomic pay
```
Ledger (`ln_transactions`) authoritative؛ snapshot برای سرعت. `rebuildLoan(loanId)` اجباری برای reconcile.

### penaltyBasis
Engine **باید** هر دو `overdue_installment` و `remaining_balance` را پشتیبانی کند؛ پیش‌فرض محصول `overdue_installment`. انتخاب در UI روی create/update loan.

### Invariant schedule جاری در برابر تاریخی
```text
currentSchedule = latest ln_schedule_snapshots WHERE loanId ORDER BY generatedAt DESC
historicalSchedule(at) = snapshot با effectiveDate/generatedAt <= at
هر regenerate: calculationVersion + operationId + reason + payload کامل
current ≠ خواندن مجدد فرمول روی state قدیمی بدون snapshot
```

---

## وثیقه — `ln_loan_collateral`

| فیلد | نقش |
|------|-----|
| `id` | UUID |
| `loanId` | FK |
| `collateralType` | `property` \| `gold` \| `guarantor` \| `deposit` \| `vehicle` \| `other` |
| `description` | متن |
| `estimatedValue` | decimal |
| `currency` | string |
| `relatedAssetId` | nullable — لینک به physical/metal در صورت وجود |
| `documentsOperationId` | nullable |
| `createdAt` | |

چند ردیف per loan مجاز.

## جریمه بازپرداخت زودتر — early repayment

روی `ln_loans` یا `ln_loan_fees`:
- `earlyRepaymentPenaltyType` → `none` \| `fixed` \| `percent_of_remaining` \| `percent_of_principal`
- `earlyRepaymentPenaltyAmount` / `earlyRepaymentPenaltyRate`
- `accountingTreatment` طبق FeeCategory `loan_early_payment`

`gracePeriods` + `gracePeriodUnit` canonical است؛ `gracePeriodMonths` فقط legacy migrate.

---

## انواع وام — فرمول‌ها (ایران)

| method | رفتار |
|--------|--------|
| `declining_balance` (UI: «اقساط ثابت / Annuit») | قسط ثابت amortization: \(P \times r(1+r)^n / ((1+r)^n - 1)\)؛ **یا** حالت اصل‌ثابت+سود‌مانده اگر در UI انتخاب شود — هر دو زیر همین method با `amortizationStyle` اختیاری v1.1 |
| `flat_rate` | سود کل روی اصل اولیه / n |
| `bullet` | دوره‌ها فقط سود؛ اصل در سررسید |
| `qarz_al_hasaneh` | بدون سود؛ کارمزد جدا |
| `balloon` / `step_up` | **v2** — در create وام v1 reject |

محاسبات فقط از `calculationMethod` ∈ مجموعه v1.

---

## Financial Obligation Model (Borrowed / Lent مشترک)

یک مدل `Loan` برای هر دو جهت:

```text
Loan
 ├── direction = borrowed  → Liability (loan_liability)
 └── direction = lent      → Receivable (loan_receivable)
```

نه دو سیستم جدا برای «وام گرفته» و «طلب از شخص».

### مبالغ مفهومی (جدا نگه دارید)

| مفهوم | معنی |
|--------|------|
| `principalAmount` | اصل تعهد قرارداد |
| `disbursedAmount` | مبلغ پرداخت‌شده به وام‌گیرنده |
| `netDisbursedAmount` | نقد دریافتی پس از کسر fee صدور و … |
| `interest` / accrued | سود |
| `fee` / `penalty` / prepayment fee | جدا از principal |
| `outstandingPrincipal` / remainingBalance | مانده اصل (derived از ledger) |
| `totalPayoffAmount` | برای تسویه کامل: اصل + سود معوق + fee/penalty |

**مثال:** Principal=100m، Fee=4m → Net cash received=96m؛ **Outstanding liability می‌تواند 100m بماند** مگر policy صریح fee را از liability کم کند.

Journal و Cost/Fee treatment این تفکیک را enforce می‌کنند.

> **Components:** `docs/core/Loan-Component-Classification.md` — Principal/Interest/Fee/Penalty جدا در journal.

---

## لایه‌ها (ضد formula داخل Page)

```text
UI → Loan API → Loan Calculation Engine → Accounting Core
```

| لایه | محتوا |
|------|--------|
| Domain Model | contract, parties, rates, fees policy |
| Calculation Engine | schedule generate, interest, penalty |
| UI | فرم و نمایش — بدون hard-code فرمول |

### قسط ≠ حقیقت پرداخت

```text
Loan Contract → Schedule (برنامه) → Payment Event (واقعیت) → Accounting Operation
```

| Schedule state | معنی |
|----------------|------|
| `scheduled` | در برنامه |
| `due` | سررسید رسیده |
| `paid` | پرداخت کامل ثبت شده |
| `partially_paid` | |
| `overdue` | |
| `waived` | |
| `rescheduled` | |

**ممنوع:** فرض اینکه وجود ردیف schedule = پول جابه‌جا شده.  
`remainingBalance` فقط از **payment events / ln_transactions** rebuild می‌شود نه از schedule alone.

---

## Fee treatment / Interest / Allocation / Early payment

| Concept | |
|---------|--|
| `feeTreatment` | expense now / capitalize / deduct disbursement / add to due / withhold |
| Rate | nominal vs periodic; day count ACT/365, ACT/360, 30/360; stub periods — نه فقط annual/12 |
| `paymentAllocationPolicy` | ترتیب e.g. Penalty→Fee→Interest→Principal؛ خروجی principalPaid/interestPaid/feePaid/penaltyPaid |
| `earlyPaymentPolicy` | reduceTerm \| reduceInstallment \| recalculateInterest \| noRecalculation |
| Party | `partyId` canonical؛ `contactNameSnapshot` برای تاریخچه — نه contact موازی مستقل |

Loan Engine این‌ها را enforce می‌کند نه UI.

> **قسط آخر:** `Implementation-Pitfalls.md` §ب — principalPortion = remainingBalance.
> **قرض‌الحسنه disbursement:** §ج — Dr cash net + Dr fee + Cr full principal.
