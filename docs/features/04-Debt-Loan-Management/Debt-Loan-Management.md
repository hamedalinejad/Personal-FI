# فیچر: Debt & Loan Management (بدهی، طلب و وام)

## توضیح کلی
این فیچر مدیریت کامل بدهی‌ها، مطالبات و وام‌ها را بر عهده دارد.  
اطلاعات اصلی وام در جدول `ln_loans` نگهداری می‌شود.  
تمام جابه‌جایی‌های مالی واقعی مرتبط با وام در جدول `ln_transactions` به صورت **لاگ** ثبت می‌شوند و همزمان در جدول `acc_transactions` نیز ثبت شده و موجودی حساب را تغییر می‌دهد.

---

## Business Rules

1. وام می‌تواند از نوع `borrowed` (دریافتی) یا `lent` (پرداختی / طلب) باشد.
2. ارز وام همیشه با ارز حساب مرتبط یکی است.
3. هنگام ثبت وام **دریافتی (borrowed)**:
   - مبلغ اصلی به حساب مرتبط واریز می‌شود.
   - یک رکورد در `ln_transactions` با `type = 'disbursement'` ثبت می‌شود.
   - یک رکورد در `acc_transactions` با نوع `deposit-loan` ثبت می‌شود.
   - در جدول `ln_loans`، فیلد `accountTransactionId` به `acc_transactions.id` لینک می‌شود.
   - موجودی حساب افزایش می‌یابد.
4. هنگام ثبت وام **پرداختی (lent)**:
   - مبلغ اصلی از حساب مرتبط برداشت می‌شود.
   - یک رکورد در `ln_transactions` با `type = 'disbursement'` ثبت می‌شود.
   - یک رکورد در `acc_transactions` با نوع `withdrawal-loan` ثبت می‌شود.
   - در جدول `ln_loans`، فیلد `accountTransactionId` به `acc_transactions.id` لینک می‌شود.
   - موجودی حساب کاهش می‌یابد.
5. تمام پرداخت‌های بعدی (قسط، سود، جریمه، کارمزد پیش‌پرداخت، کارمزد صدور) نیز هم در `ln_transactions` و هم در `acc_transactions` ثبت می‌شوند و موجودی حساب را تغییر می‌دهند.
5a. کارمزدهای وام (صدور، پیش‌پرداخت، تأخیر) مستقل از سود ثبت می‌شوند و تنها موجودی حساب را تغییر می‌دهند، نه `remainingBalance`.
6. جدول `ln_transactions` فقط لاگ است و داده‌های پردازشی (مثل برنامه اقساط) در آن ذخیره نمی‌شود.
7. موجودی حساب نمی‌تواند منفی شود.
8. ویرایش اطلاعات اصلی وام فقط قبل از ثبت اولین پرداخت مجاز است.
9. برای هر پرداخت، `principalPortion` و `interestPortion` مستقیماً در `ln_transactions` ذخیره شود (حداقل nullable برای وام‌های بدون سود).
10. مانده باقی‌مانده (`remainingBalance`) فقط با کاهش `principalPortion` کاهش می‌یابد، نه با سود.
11. برای هر پرداخت، نرخ تبدیل لحظه در `exchangeRateToUSDT` ذخیره شود تا ارزش دلاری/تتری قسط حفظ شود.

---

## Domain Entities

### ۱. Loan (جدول: `ln_loans`)

- `id` → UUID (Primary Key)
- `name` → string (نام وام)
- `loanType` → string (نوع وام — بانکی، قرض‌الحسنه، دوستانه، تسهیلات، سایر)
- `direction` → string (`borrowed` یا `lent`)
- `principalAmount` → decimal (مبلغ اصلی)
- `currency` → string (ارز وام)
- `exchangeRateToUSDT` → decimal (نرخ تبدیل لحظه ثبت در ابتدا — ریال به ازای ۱ تتر، مثلاً ۶۰,۰۰۰)
- `accountId` → UUID (حساب مرتبط)
- `accountTransactionId` → UUID (لینک به `acc_transactions` برای تراکنش اولیه وام)
- `interestType` → string (`none`, `fixed`, `variable`)
- `interestRate` → decimal (نرخ سود)
- `interestRatePeriod` → string (`annual`, `monthly`) — نرخ سود سالانه است یا ماهانه؟
- `installmentFrequency` → string (`monthly`, `weekly`, `quarterly`, `custom`) — فرکانس اقساط
- `totalInstallments` → integer (تعداد اقساط)
- `startDate` → datetime
- `endDate` → datetime
- `status` → string (`active`, `completed`, `cancelled`)
- `remainingBalance` → decimal (مانده باقی‌مانده - اولیه برابر `principalAmount`)
- `fixedInstallmentAmount` → decimal (nullable — برای وام‌های ساده بدون amortization پیچیده)
- `originationFeeAmount` → decimal (nullable — کارمزد صدور/افتتاح وام)
- `originationFeeType` → string (nullable — `fixed` یا `percentage`)
- `earlyPaymentFeeAmount` → decimal (nullable — کارمزد پیش‌پرداخت)
- `earlyPaymentFeeType` → string (nullable — `fixed` یا `percentage`)
- `delayPenaltyRate` → decimal (nullable — نرخ جریمه تأخیر در پرداخت — مستقل از سود)
- `contactName` → string (طرف مقابل)
- `description` → string
- `hasAttachment` → boolean
- `attachmentPath` → string
- `createdAt` → datetime
- `updatedAt` → datetime

> **نکته طراحی**: هنگام ایجاد وام، `remainingBalance` با مقدار `principalAmount` شروع می‌شود. برای وام‌های `borrowed` (دریافتی)، این مبلغ به تدریج با پرداخت قسط‌ها کاهش می‌یابد. برای وام‌های `lent` (پرداختی)، این مبلغ نیز به تدریج کاهش می‌یابد.

### ۲. Loan Transaction (لاگ) (جدول: `ln_transactions`)

- `id` → UUID (Primary Key)
- `loanId` → UUID
- `date` → datetime
- `type` → string (`disbursement`, `installment_payment`, `interest_payment`, `fee_payment`, `penalty`, `early_payment`)
- `amount` → decimal (مبلغ کل پرداختی)
- `principalPortion` → decimal (nullable — مبلغ مربوط به اصل بدهی — برای `type = 'installment_payment'` یا `'early_payment'`)
- `interestPortion` → decimal (nullable — مبلغ مربوط به سود — برای `type = 'interest_payment'`)
- `feePortion` → decimal (nullable — مبلغ کارمزد — برای `type = 'fee_payment'` یا برای صدور)
- `penaltyPortion` → decimal (nullable — مبلغ جریمه تأخیر — برای `type = 'penalty'`)
- `feeType` → string (nullable — نوع کارمزد برای `type = 'fee_payment'`: `origination`, `early_payment`, `late_payment_fee` و ...)
- `description` → string
- `exchangeRateToUSDT` → decimal (نرخ تبدیل لحظه پرداخت — ریال به ازای ۱ تتر، مثلاً ۶۰,۰۰۰)
- `accountTransactionId` → UUID (ارتباط با رکورد در `acc_transactions`)
- `createdAt` → datetime

> این جدول فقط لاگ تراکنش‌های واقعی است و هیچ داده پردازشی در آن نگهداری نمی‌شود.  
> برای محاسبه `remainingBalance`: `remainingBalance -= principalPortion` (فقط سود، کارمزد و جریمه بر روی `remainingBalance` تأثیری ندارند).  
> **نکته**: `type = 'fee_payment'` برای کارمزدهای پیش‌پرداخت یا دیگر کارمزدهای جانبی است. کارمزد صدور وام نیز به‌صورت تراکنش جدا ثبت می‌شود.

### ۳. acc_transactions (جدول مشترک تراکنش‌های حساب)

- هنگام ایجاد وام و هر پرداخت، یک رکورد با نوع مناسب (`deposit-loan` یا `withdrawal-loan`) در این جدول ثبت می‌شود و موجودی حساب به‌روزرسانی می‌گردد.

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

### Payment APIs
- `payLoan(loanId, amount, type, date, description)`  
  → ثبت پرداخت (قسط / سود / جریمه / زودهنگام)  
  → ثبت در `ln_transactions` (با `principalPortion` و `interestPortion` و `exchangeRateToUSDT`)  
  → ثبت در `acc_transactions`  
  → به‌روزرسانی `remainingBalance` (فقط با `principalPortion`) و موجودی حساب
- `getLoanTransactions(loanId)` → دریافت لاگ تراکنش‌های یک وام
- `getUpcomingPayments(loanId)` → محاسبه اقساط آینده (بر اساس `installmentFrequency`)
- `getOverduePayments()` → دریافت اقساط سررسید گذشته

---

## روابط با سایر فیچرها

- **Accounts & Banking**: ثبت تراکنش و تغییر موجودی حساب
- **Currency & Multi-Currency**: دریافت نرخ تبدیل لحظه‌ای (هر پرداخت نرخ خود را دارد)
- **Notification & Reminder**: یادآوری سررسیدها
- **Reports** و **Dashboard**: نمایش مانده بدهی‌ها و مطالبات + محاسبه سود پرداخت شده

---

## نکات طراحی

- برنامه اقساط و محاسبات پردازشی از روی فیلدهای جدول `loans` (مبلغ، نرخ سود، تعداد اقساط، `installmentFrequency`، `interestRatePeriod` و تاریخ‌ها) محاسبه می‌شود.
- `loan_transactions` فقط تاریخچه واقعی پرداخت‌ها را نگه می‌دارد.
- برای محاسبه `remainingBalance`: `remainingBalance -= principalPortion`.
- برای هر پرداخت، `exchangeRateToUSDT` ذخیره می‌شود تا ارزش تتری در طول زمان حفظ شود.
- `fixedInstallmentAmount` برای وام‌های ساده (بدون فرمول amortization بانکی) استفاده می‌شود.
- نرخ سود با `interestRatePeriod` مشخص می‌شود: `annual` یا `monthly`.