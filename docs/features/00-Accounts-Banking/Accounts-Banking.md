فیچر: Accounts & Banking
توضیح کلی:
مدیریت حساب‌های بانکی واقعی (جاری، پس‌انداز، سپرده و غیره). صندوق نقدی، کیف پول و صرافی در فیچرهای جداگانه مدیریت می‌شوند.

Business Rules

- موجودی حساب نمی‌تواند منفی شود (مگر حساب اعتباری در آینده).
- انتقال وجه بین حساب‌ها باعث ایجاد دو تراکنش مستقل می‌شود (برداشت از مبدا + واریز به مقصد).
- نام حساب باید منحصر به فرد باشد.
- حذف حساب وجود ندارد — فقط آرشیو (Soft Archive).
- تراکنش‌ها پس از ثبت تغییرناپذیر هستند؛ برای اصلاح، تراکنش reversed/voided ثبت می‌شود.
- مانده حساب بعد از هر تراکنش در فیلد `balanceAfterTransaction` snapshot می‌شود (برای جلوگیری از بازپخش تراکنش‌ها و تغییر دستی).

Domain Entities
1. Account (جدول: acc_accounts)

id → UUID (Primary Key)
name → string (نام حساب)
accountNumber → string (شماره حساب)
iban → string (شماره شبا)
cardNumber → string (شماره کارت)
branchName → string (نام شعبه)
bankName → string (نام بانک)
currency → string (ارز حساب: IRR, USDT, USD و ...)
accountType → enum (جاری، پس‌انداز، سپرده ثابت، ...)
currentBalance → decimal (مانده فعلی)
isArchived → boolean
notes → text (یادداشت)
createdAt → datetime
updatedAt → datetime

2. Transaction (جدول: acc_transactions)

id → UUID (Primary Key)
date → datetime (تاریخ تراکنش)
type → string (نوع `TransactionType` — تعریف مرکزی و تنها enum معتبر در core/types/types.md؛ مقادیر: deposit-income, withdrawal-expense, transfer-in, transfer-out, deposit-loan, withdrawal-loan, withdrawal-expense-tax, deposit-income-tax, withdrawal-cheque, deposit-cheque, deposit-investment, withdrawal-investment)
amount → decimal (مبلغ)
feeAmount → decimal (nullable — کارمزد تراکنش در صورت وجود)
feeCurrency → string (nullable — ارز کارمزد: IRR, USDT و ...)
exchangeRateToBase → decimal (nullable — نرخ تتر لحظه تراکنش)
balanceAfterTransaction → decimal (مانده حساب پس از این تراکنش)
accountId → UUID (حساب مرتبط)
description → string (توضیحات)
relatedFeature → string (نوع `RelatedFeature` — **فهرست کامل و تنها مرجع معتبر**: `core/types/types.md → RelatedFeature`؛ کپی لیست اینجا نگه داشته نمی‌شود تا از drift جلوگیری شود)

relatedId → UUID (شناسه رکورد در فیچر مرتبط)

> **Polymorphic FK (باگ ۵۴)**: SQLite این جفت را enforce نمی‌کند. وجود ردیف هدف باید در Domain validate شود؛ orphanها با `reconcileAccount` / `reconcileAll` قابل کشف‌اند. جزئیات در `core/db/db.md`.
isVoided → boolean (آیا تراکنش لغو شده؟ به‌جای حذف/ویرایش مستقیم)
relatedTransactionId → UUID (nullable — برای تراکنش‌های reversed، لینک به تراکنش اصلی)
createdAt → datetime
updatedAt → datetime

> **نکته**: برای سرمایه‌گذاری‌ها (واریز/برداشت از/به صرافی، کارگزاری، پلتفرم):
> - `type = 'deposit-investment'` یا `type = 'withdrawal-investment'`
> - `relatedFeature = 'crypto_exchange'` یا `relatedFeature = 'stocks_iran'` یا `relatedFeature = 'fif'` یا `relatedFeature = 'metals'`
> - `relatedId` به جدول مخصوص آن فیچر لینک می‌شود

APIهای داخلی
Account:

createAccount(data)
updateAccount(id, data)   // فقط ویرایش اطلاعات حساب
getAllAccounts(includeArchived = false)
getAccountById(id)
archiveAccount(id)
getCurrentBalance(accountId, mode: 'cached' | 'ledger' = 'cached')
> - **`cached`** (پیش‌فرض): مقدار `acc_accounts.currentBalance` (Snapshot — سریع، برای نمایش UI)
> - **`ledger`**: بازمحاسبه از مجموع `acc_transactions` با فراخوانی معادل `rebuildAccountFromLedger` (کند ولی همیشه دقیق — برای عملیات حساس مثل برداشت، انتقال، یا Reconciliation)
>
> ⚠️ **BUG-025**: `currentBalance` Snapshot است نه Ledger. برای هر عملیاتی که روی صحت موجودی حساس است (برداشت، انتقال)، حتماً `mode='ledger'` استفاده شود — جزئیات در `core/db/db.md → BUG-025`.

Transaction:

createTransaction(data)
updateTransaction(id, data)   // فقط برای update متنی (description و ...)
voidTransaction(id, reason, relatedTransactionId?)   // لغو تراکنش و ثبت reversed
getTransactionsByAccount(accountId, filters)
getTransactionById(id)

Transfer:

transferBetweenAccounts(sourceAccountId, targetAccountId, amount, description)
> **الزاماً Atomic (BEGIN/COMMIT)**:
> 1. INSERT تراکنش مبدا: `type='transfer-out'`، `relatedFeature='accounts'`، `relatedId=targetAccountId`
> 2. INSERT تراکنش مقصد: `type='transfer-in'`، `relatedFeature='accounts'`، `relatedId=sourceAccountId`
> 3. آپدیت `currentBalance` هر دو حساب
>
> `relatedFeature='accounts'` برای هر دو رکورد — طبق تعریف `types.md`: «انتقال/تعدیل مستقیم بین حساب‌ها».