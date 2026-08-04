نام فیچر: Expense
توضیح کلی:
این فیچر مسئولیت ثبت و مدیریت تراکنش‌های هزینه را بر عهده دارد.
هزینه‌های تکرارشونده در جدول جداگانه نگهداری می‌شوند و از روی آن‌ها تراکنش واقعی تولید می‌شود.
ارز هزینه همیشه با ارز حساب یکی است و نرخ تبدیل لحظه ثبت ذخیره می‌شود تا ارزش تاریخی قابل محاسبه باشد.

User Stories
Must Have:

ثبت هزینه جدید (مبلغ، تاریخ، حساب مبدأ، توضیحات)
ارز هزینه = ارز حساب مبدأ
ذخیره نرخ تبدیل لحظه ثبت (نسبت به دلار/تتر)
ویرایش هزینه
مشاهده لیست هزینه‌ها با فیلتر (تاریخ، حساب، دسته‌بندی)
ثبت و مدیریت هزینه تکرارشونده (جدول جدا)
مشاهده مجموع هزینه در بازه‌های زمانی مختلف (به ریال و دلار/تتر با نرخ تاریخی)

Should Have:

افزودن پیوست (فاکتور یا رسید)
جستجوی پیشرفته
هزینه اقساطی (در نسخه‌های بعدی)


Business Rules

هر هزینه باید از یک حساب بانکی پرداخت شود.
ارز هزینه حتماً با ارز حساب مبدأ یکی است.
هنگام ثبت هزینه، نرخ تبدیل لحظه ثبت (نسبت به دلار/تتر) ذخیره می‌شود.
ثبت هزینه باعث کاهش currentBalance حساب مبدأ می‌شود.
موجودی حساب نمی‌تواند منفی شود (مگر حساب اعتباری در آینده).
ارزش تاریخی هزینه با نرخ زمان ثبت حفظ می‌شود.
هزینه تکرارشونده در جدول جدا نگهداری می‌شود و از روی آن تراکنش واقعی تولید می‌شود.
هزینه نمی‌تواند در آینده ثبت شود مگر اینکه از طریق هزینه تکرارشونده تولید شده باشد.
ویرایش هزینه باعث به‌روزرسانی مانده حساب می‌شود.


Domain Entities
۱. Expense Transaction (جدول: expenses_transactions)

id → UUID (Primary Key)
date → datetime (تاریخ هزینه)
amount → decimal (مبلغ هزینه — به ارز حساب)
currency → string (ارز هزینه = ارز حساب مبدأ)
exchangeRateToUSD → decimal (نرخ تبدیل لحظه ثبت نسبت به دلار/تتر)
accountId → UUID (حساب مبدأ)
description → string (توضیحات)
category → string (دسته‌بندی: خوراک، حمل‌ونقل، مسکن، سرگرمی و ...)
hasAttachment → boolean
attachmentPath → string
recurringId → UUID (nullable — اگر از هزینه تکرارشونده تولید شده باشد)
createdAt → datetime
updatedAt → datetime

۲. Recurring Expense (جدول: expenses_recurring)

id → UUID (Primary Key)
title → string (عنوان هزینه تکرارشونده)
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

۳. Transaction (جدول مشترک txn_transactions)

هنگام ثبت هزینه، یک تراکنش از نوع withdrawal-expense ایجاد می‌شود.


APIهای داخلی (Internal APIs)
Expense Transaction APIs:

createExpense(data) → ثبت هزینه + گرفتن نرخ تبدیل + ایجاد تراکنش + کاهش مانده حساب
updateExpense(id, data) → ویرایش هزینه + به‌روزرسانی تراکنش و مانده حساب
getAllExpenses(filters) → لیست با فیلتر (تاریخ، حساب، دسته)
getExpenseById(id)
getTotalExpense(startDate, endDate, accountId?, targetCurrency?) → مجموع هزینه با نرخ تاریخی

Recurring Expense APIs:

createRecurringExpense(data)
updateRecurringExpense(id, data)
toggleRecurring(id, active)
getAllRecurringExpenses()
generateRecurringExpenses() → تولید تراکنش‌های هزینه از روی قالب‌های فعال (Job روزانه)


روابط با سایر فیچرها

Accounts & Banking: کاهش currentBalance
Currency & Multi-Currency: دریافت نرخ تبدیل لحظه‌ای
Transaction: ایجاد رکورد تراکنش
Reports و Dashboard: گزارش هزینه با نرخ تاریخی
Budget: تأثیر روی بودجه ماهانه