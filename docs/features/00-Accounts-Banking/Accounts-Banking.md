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
type → string (با پیشوند: deposit-income, withdrawal-expense, transfer-out, transfer-in, withdrawal-loan, deposit-investment, withdrawal-investment, ...)
amount → decimal (مبلغ)
feeAmount → decimal (nullable — کارمزد تراکنش در صورت وجود)
feeCurrency → string (nullable — ارز کارمزد: IRR, USDT و ...)
exchangeRateToBase → decimal (nullable — نرخ تتر لحظه تراکنش)
balanceAfterTransaction → decimal (مانده حساب پس از این تراکنش)
accountId → UUID (حساب مرتبط)
description → string (توضیحات)
relatedFeature → string (نوع `RelatedFeature` — تعریف مرکزی در core/types/types.md؛ مقادیر: income, expense, cheque, loan, crypto_exchange, stocks_iran, fif, metals, physical_assets, budget, tax, goals)

relatedId → UUID (شناسه رکورد در فیچر مرتبط)
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
getCurrentBalance(accountId)

Transaction:

createTransaction(data)
updateTransaction(id, data)   // فقط برای update متنی (description و ...)
voidTransaction(id, reason, relatedTransactionId?)   // لغو تراکنش و ثبت reversed
getTransactionsByAccount(accountId, filters)
getTransactionById(id)

Transfer:

transferBetweenAccounts(sourceAccountId, targetAccountId, amount, description)