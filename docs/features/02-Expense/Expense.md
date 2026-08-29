نام فیچر: Expense
توضیح کلی:
این فیچر مسئولیت ثبت و مدیریت تراکنش‌های هزینه را بر عهده دارد.
هزینه‌های تکرارشونده در جدول جداگانه نگهداری می‌شوند و از روی آن‌ها تراکنش واقعی تولید می‌شود.
ارز هزینه همیشه با ارز حساب یکی است و نرخ تبدیل لحظه ثبت ذخیره می‌شود تا ارزش تاریخی قابل محاسبه باشد.

User Stories
Must Have:

ثبت هزینه جدید (مبلغ، تاریخ، حساب مبدأ، توضیحات)
ارز هزینه = ارز حساب مبدأ
ذخیره نرخ تبدیل لحظه ثبت (نسبت به baseCurrency کاربر)
ویرایش هزینه
مشاهده لیست هزینه‌ها با فیلتر (تاریخ، حساب، دسته‌بندی)
ثبت و مدیریت هزینه تکرارشونده (جدول جدا)
مشاهده مجموع هزینه در بازه‌های زمانی مختلف (به ارز حساب و baseCurrency با نرخ تاریخی)

Should Have:

افزودن پیوست (فاکتور یا رسید)
جستجوی پیشرفته
هزینه اقساطی (در نسخه‌های بعدی)


Business Rules

هر هزینه باید از یک حساب بانکی پرداخت شود.
ارز هزینه حتماً با ارز حساب مبدأ یکی است.
هنگام ثبت هزینه، نرخ تبدیل لحظه ثبت (نسبت به baseCurrency کاربر) ذخیره می‌شود.
ثبت هزینه باعث کاهش currentBalance حساب مبدأ می‌شود.
موجودی حساب نمی‌تواند منفی شود (مگر حساب اعتباری در آینده).
ارزش تاریخی هزینه با نرخ زمان ثبت حفظ می‌شود.
هزینه تکرارشونده در جدول جدا نگهداری می‌شود و از روی آن تراکنش واقعی تولید می‌شود.
هزینه نمی‌تواند در آینده ثبت شود — تاریخ تراکنش باید ≤ امروز باشد (Job روزانه `generateRecurringExpenses` هم فقط زمانی تراکنش می‌سازد که `nextOccurrence` رسیده باشد، نه از پیش).
**ویرایش/حذف هزینه**: تراکنش هزینه پس از ثبت غیرقابل ویرایش است. برای اصلاح یا حذف، الگوی **دولایه Atomic** اجرا می‌شود (همه مراحل در یک BEGIN/COMMIT):

 **لایه ۱ — `exp_transactions`**:
 - رکورد قدیمی با `isVoided = true` علامت‌گذاری می‌شود (حذف نمی‌شود — audit trail)
 - یک رکورد جدید در `exp_transactions` با داده‌های اصلاح‌شده و `accountTransactionId` اشاره به تراکنش جدید `acc_transactions` ساخته می‌شود

 **لایه ۲ — `acc_transactions`**:
 - تراکنش اصل با `isVoided = true` علامت‌گذاری می‌شود
 - یک تراکنش معکوس (Reversal) ثبت می‌شود تا موجودی حساب درست شود

 > ⚠️ **قانون `getTotalExpense`**: این تابع و همه APIهای گزارش‌گیری فقط ردیف‌های `isVoided = false` از `exp_transactions` را جمع می‌زنند.


### ۱. Expense Transaction (جدول: exp_transactions)

id → UUID (Primary Key)
date → datetime (تاریخ هزینه)
amount → decimal (مبلغ هزینه — به ارز حساب)
currency → string (ارز هزینه = ارز حساب مبدأ)
exchangeRateToBase → decimal (نرخ تبدیل ارز تراکنش → `baseCurrency` کاربر در لحظه ثبت (نه الزاماً ریال/تتر — قرارداد کامل در `Currency-CrossRate.md`))
accountId → UUID (حساب مبدأ)
description → string (توضیحات)
category → string (دسته‌بندی: خوراک، حمل‌ونقل، مسکن، سرگرمی و ...)
hasAttachment → boolean
attachmentPath → string
recurringId → UUID (nullable — اگر از هزینه تکرارشونده تولید شده باشد)
accountTransactionId → UUID (لینک به `acc_transactions`)
isVoided → boolean (پیش‌فرض `false` — اگر `true`، این رکورد توسط `correctExpense`/`deleteExpense` باطل شده و در همه گزارش‌ها نادیده گرفته می‌شود)
reversedExpenseId → UUID (nullable — اگر این رکورد یک اصلاح است، id رکورد `exp_transactions` قبلی که void شده)
createdAt → datetime
updatedAt → datetime

۲. Recurring Expense (جدول: exp_recurring)

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

۳. Transaction (جدول مشترک acc_transactions)

هنگام ثبت هزینه، یک تراکنش از نوع withdrawal-expense ایجاد می‌شود.

> **تفاوت `exp_recurring` و `br_items` (Bills & Recurring)**:
>
> | ویژگی | `exp_recurring` | `br_items` |
> |-------|----------------|------------|
> | **هدف** | قالب برای تولید خودکار تراکنش هزینه | یادآوری و پیگیری وضعیت پرداخت |
> | **جریان** | تراکنش مستقیماً در `exp_transactions` تولید می‌شود | `br_occurrences` ایجاد می‌شود، سپس کاربر تأیید می‌کند |
> | **مناسب برای** | هزینه‌های کاملاً ثابت که نیاز به تأیید ندارند | قبوض با مبلغ متغیر (برق، گاز، آب) یا نیاز به تأیید کاربر |
> | **لینک به `exp_transactions`** | از طریق `recurringId` | از طریق `br_occurrences.transactionId` |
>
> **قانون انتخاب**:
> - اگر هزینه **مبلغ ثابت** دارد و باید **به صورت خودکار** هر دوره ثبت شود → `exp_recurring`
> - اگر هزینه نیاز به **تأیید کاربر** دارد یا **مبلغ متغیر** است (مثل قبض برق) → `br_items` با `type=expense`
> - **نباید** برای یک هزینه هم در `exp_recurring` و هم در `br_items` رکورد بسازید


APIهای داخلی (Internal APIs)
Expense Transaction APIs:

createExpense(data) → ثبت هزینه + گرفتن نرخ تبدیل + ایجاد تراکنش + کاهش مانده حساب
correctExpense(id, data) → اصلاح هزینه — **الزاماً Atomic (BEGIN/COMMIT)**:
 1. `exp_transactions[id].isVoided = true` + `acc_transactions[accountTransactionId].isVoided = true`
 2. INSERT تراکنش Reversal در `acc_transactions` (برای درست کردن موجودی حساب)
 3. INSERT رکورد جدید در `exp_transactions` با داده اصلاح‌شده، `reversedExpenseId=id`، و `accountTransactionId` اشاره به تراکنش جدید `acc_transactions`
 4. INSERT تراکنش جدید در `acc_transactions` برای مبلغ صحیح
updateExpenseMetadata(id, data) → ویرایش فقط فیلدهای غیرمالی (توضیحات، دسته‌بندی، پیوست‌ها)؛ تراکنش مالی و مانده حساب دست‌نخورده باقی می‌مانند
getAllExpenses(filters) → لیست با فیلتر (تاریخ، حساب، دسته)
getExpenseById(id)
getTotalExpense(startDate, endDate, accountId?, targetCurrency?) → مجموع هزینه با نرخ تاریخی — **فقط ردیف‌های `isVoided = false` از `exp_transactions`**

Recurring Expense APIs:

createRecurringExpense(data)
updateRecurringExpense(id, data)
toggleRecurring(id, active)
getAllRecurringExpenses
generateRecurringExpenses → تولید تراکنش‌های هزینه از روی قالب‌های فعال (Job روزانه)


روابط با سایر فیچرها

Accounts & Banking: کاهش currentBalance
Currency & Multi-Currency: دریافت نرخ تبدیل لحظه‌ای
Transaction: ایجاد رکورد تراکنش
Reports و Dashboard: گزارش هزینه با نرخ تاریخی
Budget: تأثیر روی بودجه ماهانه

> **نکته نام‌گذاری**: لینک به `acc_transactions` با نام `accountTransactionId` تعریف شود (یکسان‌سازی با Loan و Cheque).

## قرارداد ثبت (پیاده‌سازی)

`createExpense` داخل یک `runAtomicFinancialOperation`:

1. validate: amount > 0، currency == account.currency، date ≤ today، موجودی کافی (ledger mode)
2. INSERT `exp_transactions` (isVoided=false)
3. INSERT `acc_transactions` با `type='withdrawal-expense'`، relatedFeature=`expense`، relatedId=exp id
4. INSERT journal lines: Dr expense category `fin_accounts` / Cr bank `fin_accounts` (`lineKind=expense`)
5. به‌روز snapshot حساب
6. COMMIT → persist

`correctExpense`: همان الگوی دولایه void+reversal+insert جدید.

`getTotalExpense` / گزارش‌ها: فقط `isVoided = false`.

دسته‌ها: فقط از `99-Common-Categories/Categories.md` (لیست هزینه).

---

## تاریخ کسب‌وکار در برابر UTC

فیلد اصلی کاربر: **`businessDate`** (`YYYY-MM-DD` میلادی در DB).

```text
todayBusiness = calendar date در timezone تنظیمات کاربر (نه خام Date.now() بدون TZ)
accept if businessDate <= todayBusiness
```

`createdAt` = UTC timestamp ثبت سیستم — برای «آیا آینده است؟» استفاده **نشود**.  
نیمه‌شب جلالی/UTC: فقط `businessDate` مبنا است.

---

## نقش در معماری حسابداری

`exp_transactions` = **Domain sub-ledger** (جزئیات UI، دسته، recurring، metadata).

**SoT حسابداری و گزارش میان‌فیچری** = journal lines روی `fin_accounts` از طریق `runAtomicFinancialOperation`.

```text
Expense UI
  → Financial Operation
  → Domain row (exp_transactions)
  → Journal (accountId…)
  → acc_transactions اگر cash بانکی
  → snapshots
```

**ممنوع:** گزارش Expense/Income کلی فقط از جدول domain بدون journal، یا جمع domain + journal با هم.
