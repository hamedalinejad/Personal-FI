نام فیچر: Income
توضیح کلی:
این فیچر مسئولیت ثبت و مدیریت تراکنش‌های درآمد را بر عهده دارد.
درآمدهای تکرارشونده به صورت جداگانه در جدول مخصوص خود مدیریت می‌شوند و از روی آن‌ها تراکنش‌های واقعی تولید می‌شوند.

User Stories
Must Have:

ثبت درآمد جدید (مبلغ، تاریخ، حساب مقصد، توضیحات)
ارز درآمد = ارز حساب مقصد
ذخیره نرخ تبدیل لحظه ثبت (نسبت به دلار/تتر)
ویرایش درآمد
مشاهده لیست درآمدها با فیلتر (تاریخ، حساب، دسته‌بندی)
ثبت و مدیریت درآمد تکرارشونده (جدول جدا)
مشاهده مجموع درآمد در بازه‌های زمانی مختلف (به ریال و دلار/تتر با نرخ تاریخی)

Should Have:

افزودن پیوست (فاکتور یا رسید)
جستجوی پیشرفته


Business Rules

هر درآمد باید به یک حساب بانکی واریز شود.
ارز درآمد حتماً با ارز حساب مقصد یکی است.
هنگام ثبت درآمد، نرخ تبدیل لحظه ثبت (نسبت به دلار/تتر) ذخیره می‌شود.
ثبت درآمد باعث افزایش currentBalance حساب مقصد می‌شود.
ارزش تاریخی درآمد با نرخ زمان ثبت حفظ می‌شود.
درآمد تکرارشونده در جدول جدا نگهداری می‌شود و از روی آن تراکنش واقعی تولید می‌شود.
درآمد نمی‌تواند در آینده ثبت شود مگر اینکه از طریق درآمد تکرارشونده تولید شده باشد.
ویرایش درآمد باعث به‌روزرسانی مانده حساب می‌شود.


Domain Entities
۱. Income Transaction (جدول: incomes_transactions)

id → UUID (Primary Key)
date → datetime (تاریخ درآمد)
amount → decimal (مبلغ درآمد — به ارز حساب)
currency → string (ارز درآمد = ارز حساب مقصد)
exchangeRateToUSD → decimal (نرخ تبدیل لحظه ثبت نسبت به دلار/تتر)
accountId → UUID (حساب مقصد)
description → string (توضیحات)
category → string (دسته‌بندی: حقوق، فریلنس، اجاره، سرمایه‌گذاری و ...)
hasAttachment → boolean
attachmentPath → string
incomes_recurring_id → UUID (nullable — اگر از درآمد تکرارشونده تولید شده باشد)
- Bank_transactions_id → UUID (لینک به `AccountsBanking_transactions` → accountTransactionId)
createdAt → datetime
updatedAt → datetime

۲. Recurring Income (جدول: incomes_recurring)

id → UUID (Primary Key)
title → string (عنوان درآمد تکرارشونده)
amount → decimal
currency → string
accountId → UUID
category → string
description → string
interval → string (monthly, weekly, yearly, custom)
startDate → datetime
endDate → datetime (اختیاری)
nextOccurrence → datetime
isActive → boolean
createdAt → datetime
updatedAt → datetime

۳. Transaction (جدول مشترک AccountsBanking_transactions)

هنگام ثبت درآمد، یک تراکنش از نوع deposit-income ایجاد می‌شود.


APIهای داخلی (Internal APIs)
Income Transaction APIs:

createIncome(data) → ثبت درآمد + گرفتن نرخ تبدیل + ایجاد تراکنش + به‌روزرسانی مانده حساب
updateIncome(id, data) → ویرایش درآمد + به‌روزرسانی تراکنش و مانده حساب
getAllIncomes(filters) → لیست با فیلتر (تاریخ، حساب، دسته)
getIncomeById(id)
getTotalIncome(startDate, endDate, accountId?, targetCurrency?) → مجموع درآمد با نرخ تاریخی

Recurring Income APIs:

createRecurringIncome(data)
updateRecurringIncome(id, data)
toggleRecurring(id, active)
getAllRecurringIncomes()
generateRecurringIncomes() → تولید تراکنش‌های درآمد از روی قالب‌های فعال (Job روزانه)


روابط با سایر فیچرها

Accounts & Banking: به‌روزرسانی currentBalance
Currency & Multi-Currency: دریافت نرخ تبدیل لحظه‌ای
Transaction: ایجاد رکورد تراکنش
Reports و Dashboard: گزارش درآمد با نرخ تاریخی

> **نکته مهم**: برای یکسان‌سازی دسته‌بندی‌ها و جلوگیری از typo، لیست استاندارد دسته‌ها در فایل `99-Common-Categories/Categories.md` تعریف شده است. برای درآمدها باید از دسته‌های لیست درآمد استفاده شود.

---

## روابط با سایر فیچرها

Accounts & Banking: به‌روزرسانی currentBalance
Currency & Multi-Currency: دریافت نرخ تبدیل لحظه‌ای
Transaction: ایجاد رکورد تراکنش
Reports و Dashboard: گزارش درآمد با نرخ تاریخی

> **نکته نام‌گذاری**: فیلد `Bank_transactions_id` لینک به `AccountsBanking_transactions` است. در فیچرهای دیگر (مثل Loan و Cheque) نام این فیلد `accountTransactionId` است. برای یکسان‌سازی، بهتر است در آینده همه‌جا از `accountTransactionId` استفاده شود.