# فیچر: Debt & Loan Management (بدهی، طلب و وام)

## توضیح کلی
این فیچر مدیریت کامل بدهی‌ها، مطالبات و وام‌ها را بر عهده دارد.  
اطلاعات اصلی وام در جدول `loans` نگهداری می‌شود.  
تمام جابه‌جایی‌های مالی واقعی مرتبط با وام در جدول `loan_transactions` به صورت **لاگ** ثبت می‌شوند و همزمان در جدول `AccountsBanking_transactions` نیز ثبت شده و موجودی حساب را تغییر می‌دهند.

---

## Business Rules

1. وام می‌تواند از نوع `borrowed` (دریافتی) یا `lent` (پرداختی / طلب) باشد.
2. ارز وام همیشه با ارز حساب مرتبط یکی است.
3. هنگام ثبت وام **دریافتی (borrowed)**:
   - مبلغ اصلی به حساب مرتبط واریز می‌شود.
   - یک رکورد در `loan_transactions` ثبت می‌شود.
   - یک رکورد در `AccountsBanking_transactions` با نوع `deposit-loan` ثبت می‌شود.
   - موجودی حساب افزایش می‌یابد.
4. هنگام ثبت وام **پرداختی (lent)**:
   - مبلغ اصلی از حساب مرتبط برداشت می‌شود.
   - یک رکورد در `loan_transactions` ثبت می‌شود.
   - یک رکورد در `AccountsBanking_transactions` با نوع `withdrawal-loan` ثبت می‌شود.
   - موجودی حساب کاهش می‌یابد.
5. تمام پرداخت‌های بعدی (قسط، سود، جریمه، پرداخت زودهنگام) نیز هم در `loan_transactions` و هم در `AccountsBanking_transactions` ثبت می‌شوند و موجودی حساب را تغییر می‌دهند.
6. جدول `loan_transactions` فقط لاگ است و داده‌های پردازشی (مثل برنامه اقساط) در آن ذخیره نمی‌شود.
7. موجودی حساب نمی‌تواند منفی شود.
8. ویرایش اطلاعات اصلی وام فقط قبل از ثبت اولین پرداخت مجاز است.

---

## Domain Entities

### ۱. Loan (جدول: `loans`)

- `id` → UUID (Primary Key)
- `name` → string (نام وام)
- `loanType` → string (نوع وام — بانکی، قرض‌الحسنه، دوستانه، تسهیلات، سایر)
- `direction` → string (`borrowed` یا `lent`)
- `principalAmount` → decimal (مبلغ اصلی)
- `currency` → string
- `exchangeRateToUSD` → decimal (نرخ تبدیل لحظه ثبت)
- `accountId` → UUID (حساب مرتبط)
- `interestType` → string (`none`, `fixed`, `variable`)
- `interestRate` → decimal (نرخ سود)
- `totalInstallments` → integer (تعداد اقساط)
- `startDate` → datetime
- `endDate` → datetime
- `status` → string (`active`, `completed`, `cancelled`)
- `remainingBalance` → decimal (مانده باقی‌مانده)
- `contactName` → string (طرف مقابل)
- `description` → string
- `hasAttachment` → boolean
- `attachmentPath` → string
- `createdAt` → datetime
- `updatedAt` → datetime

### ۲. Loan Transaction (لاگ) (جدول: `loan_transactions`)

- `id` → UUID (Primary Key)
- `loanId` → UUID
- `date` → datetime
- `type` → string (`disbursement`, `installment_payment`, `interest_payment`, `penalty`, `early_payment`)
- `amount` → decimal
- `description` → string
- `accountTransactionId` → UUID (ارتباط با رکورد در `AccountsBanking_transactions`)
- `createdAt` → datetime

> این جدول فقط لاگ تراکنش‌های واقعی است و هیچ داده پردازشی در آن نگهداری نمی‌شود.

### ۳. AccountsBanking_transactions (جدول مشترک تراکنش‌های حساب)

- هنگام ایجاد وام و هر پرداخت، یک رکورد با نوع مناسب (`deposit-loan` یا `withdrawal-loan`) در این جدول ثبت می‌شود و موجودی حساب به‌روزرسانی می‌گردد.

---

## APIهای داخلی

### Loan APIs
- `createLoan(data)`  
  → ثبت وام + ثبت لاگ در `loan_transactions` + ثبت در `AccountsBanking_transactions` + به‌روزرسانی موجودی حساب
- `updateLoan(id, data)` → ویرایش (فقط قبل از اولین پرداخت)
- `getAllLoans(filters)`
- `getLoanById(id)`
- `getLoanSummary()` → مجموع بدهی‌ها و مطالبات
- `cancelLoan(id)`

### Payment APIs
- `payLoan(loanId, amount, type, date, description)`  
  → ثبت پرداخت (قسط / سود / جریمه / زودهنگام)  
  → ثبت در `loan_transactions`  
  → ثبت در `AccountsBanking_transactions`  
  → به‌روزرسانی `remainingBalance` وام و موجودی حساب
- `getLoanTransactions(loanId)` → دریافت لاگ تراکنش‌های یک وام
- `getUpcomingPayments(loanId)` → محاسبه اقساط آینده (بر اساس اطلاعات وام)
- `getOverduePayments()`

---

## روابط با سایر فیچرها

- **Accounts & Banking**: ثبت تراکنش و تغییر موجودی حساب
- **Currency & Multi-Currency**: دریافت نرخ تبدیل لحظه‌ای
- **Notification & Reminder**: یادآوری سررسیدها
- **Reports** و **Dashboard**: نمایش مانده بدهی‌ها و مطالبات

---

## نکات طراحی

- برنامه اقساط و محاسبات پردازشی از روی فیلدهای جدول `loans` (مبلغ، نرخ سود، تعداد اقساط و تاریخ‌ها) محاسبه می‌شود.
- `loan_transactions` فقط تاریخچه واقعی پرداخت‌ها را نگه می‌دارد.
- هر حرکت مالی وام حتماً دو جا ثبت می‌شود: لاگ وام + تراکنش حساب.