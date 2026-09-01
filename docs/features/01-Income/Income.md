نام فیچر: Income
توضیح کلی:
این فیچر مسئولیت ثبت و مدیریت تراکنش‌های درآمد را بر عهده دارد.
درآمدهای تکرارشونده به صورت جداگانه در جدول مخصوص خود مدیریت می‌شوند و از روی آن‌ها تراکنش‌های واقعی تولید می‌شوند.

User Stories
Must Have:

ثبت درآمد جدید (مبلغ، تاریخ، حساب مقصد، توضیحات)
ارز درآمد = ارز حساب مقصد
ذخیره نرخ تبدیل لحظه ثبت (نسبت به baseCurrency کاربر)
ویرایش درآمد
مشاهده لیست درآمدها با فیلتر (تاریخ، حساب، دسته‌بندی)
ثبت و مدیریت درآمد تکرارشونده (جدول جدا)
مشاهده مجموع درآمد در بازه‌های زمانی مختلف (به ارز حساب و baseCurrency با نرخ تاریخی)

Should Have:

افزودن پیوست (فاکتور یا رسید)
جستجوی پیشرفته


Business Rules

هر درآمد باید به یک حساب بانکی واریز شود.
ارز درآمد حتماً با ارز حساب مقصد یکی است.
هنگام ثبت درآمد، نرخ تبدیل لحظه ثبت (نسبت به baseCurrency کاربر) ذخیره می‌شود.
ثبت درآمد باعث افزایش currentBalance حساب مقصد می‌شود.
ارزش تاریخی درآمد با نرخ زمان ثبت حفظ می‌شود.
درآمد تکرارشونده در جدول جدا نگهداری می‌شود و از روی آن تراکنش واقعی تولید می‌شود.
درآمد نمی‌تواند در آینده ثبت شود — تاریخ تراکنش باید ≤ امروز باشد (Job روزانه `generateRecurringIncomes` هم فقط زمانی تراکنش می‌سازد که `nextOccurrence` رسیده باشد، نه از پیش).
**ویرایش/حذف درآمد**: تراکنش درآمد پس از ثبت غیرقابل ویرایش است. برای اصلاح یا حذف، الگوی **دولایه Atomic** اجرا می‌شود (همه مراحل در یک BEGIN/COMMIT):

 **لایه ۱ — `inc_transactions`**:
 - رکورد قدیمی با `isVoided = true` علامت‌گذاری می‌شود (حذف نمی‌شود — audit trail)
 - یک رکورد جدید در `inc_transactions` با داده‌های اصلاح‌شده و `accountTransactionId` اشاره به تراکنش جدید `acc_transactions` ساخته می‌شود

 **لایه ۲ — `acc_transactions`**:
 - تراکنش اصل با `isVoided = true` علامت‌گذاری می‌شود
 - یک تراکنش معکوس (Reversal) ثبت می‌شود تا موجودی حساب درست شود

 > ⚠️ **قانون `getTotalIncome`**: این تابع و همه APIهای گزارش‌گیری فقط ردیف‌های `isVoided = false` از `inc_transactions` را جمع می‌زنند. در غیر این صورت مبلغ رکورد void‌شده و رکورد جدید هر دو در جمع می‌آیند و نتیجه غلط می‌شود.


Domain Entities
### ۱. Income Transaction (جدول: `inc_transactions`)

- `id` → UUID (Primary Key)
- `date` → datetime (تاریخ درآمد)
- `amount` → decimal (مبلغ درآمد — به ارز حساب)
- `currency` → string (ارز درآمد = ارز حساب مقصد)
- `exchangeRateToBase` → decimal (نرخ تبدیل ارز تراکنش → `baseCurrency` کاربر در لحظه ثبت (نه الزاماً ریال/تتر — قرارداد کامل در `Currency-CrossRate.md`))
- `accountId` → UUID (حساب مقصد)
- `description` → string (توضیحات)
- `category` → string (دسته‌بندی: حقوق، فریلنس، اجاره، سرمایه‌گذاری و ...)
- `hasAttachment` → boolean
- `attachmentPath` → string
- `recurringId` → UUID (nullable — اگر از درآمد تکرارشونده تولید شده باشد)
- `accountTransactionId` → UUID (لینک به `acc_transactions`)
- `isVoided` → boolean (پیش‌فرض `false` — اگر `true`، این رکورد توسط `correctIncome`/`deleteIncome` باطل شده و در همه گزارش‌ها نادیده گرفته می‌شود)
- `reversedIncomeId` → UUID (nullable — اگر این رکورد یک اصلاح است، id رکورد `inc_transactions` قبلی که void شده)
- `createdAt` → datetime
- `updatedAt` → datetime

۲. Recurring Income (جدول: `inc_recurring`)

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

۳. Transaction (جدول مشترک `acc_transactions`)

هنگام ثبت درآمد، یک تراکنش از نوع deposit-income ایجاد می‌شود.

> **تفاوت `inc_recurring` و `br_items` (Bills & Recurring)**:
>
> | ویژگی | `inc_recurring` | `br_items` |
> |-------|----------------|------------|
> | **هدف** | قالب برای تولید خودکار تراکنش درآمد | یادآوری و پیگیری وضعیت پرداخت/دریافت |
> | **جریان** | تراکنش مستقیماً در `inc_transactions` تولید می‌شود | `br_occurrences` ایجاد می‌شود، سپس کاربر تأیید می‌کند |
> | **مناسب برای** | درآمدهای کاملاً مکانیکی مثل حقوق یا اجاره دریافتی | قبوض و دریافتی‌هایی که مبلغ یا تاریخ ممکن است تغییر کند |
> | **لینک به `inc_transactions`** | از طریق `recurringId` | از طریق `br_occurrences.transactionId` |
>
> **قانون انتخاب**:
> - اگر درآمد **مبلغ ثابت** دارد و باید **به صورت خودکار** هر دوره ثبت شود → `inc_recurring`
> - اگر درآمد نیاز به **تأیید کاربر** دارد یا **مبلغ متغیر** است → `br_items` با `type=income`
> - **نباید** برای یک درآمد هم در `inc_recurring` و هم در `br_items` رکورد بسازید


APIهای داخلی (Internal APIs)
Income Transaction APIs:

createIncome(data) → ثبت درآمد + گرفتن نرخ تبدیل + ایجاد تراکنش + به‌روزرسانی مانده حساب
correctIncome(id, data) → اصلاح درآمد — **فقط از طریق Core Financial Operation**:
 1. **ممنوع:** Feature خودش acc را void/reverse دستی کند
 2. یک `runAtomicFinancialOperation` با `reversesOperationId = original.operationId`
 3. Core: `buildReversalPlan` + apply معکوس همه legs (domain + cash + journal)
 4. سپس (در همان یا op بعدی طبق product UX) ثبت income اصلاح‌شده به‌عنوان operation جدید
 5. Domain flags مثل `isVoided` فقط **derived از** status عملیات معکوس‌شده‌اند — نه موتور مستقل reversal
 2. INSERT تراکنش Reversal در `acc_transactions` (برای درست کردن موجودی حساب)
 3. INSERT رکورد جدید در `inc_transactions` با داده اصلاح‌شده، `reversedIncomeId=id`، و `accountTransactionId` اشاره به تراکنش جدید `acc_transactions`
 4. INSERT تراکنش جدید در `acc_transactions` برای مبلغ صحیح
updateIncomeMetadata(id, data) → ویرایش فقط فیلدهای غیرمالی (توضیحات، دسته‌بندی، پیوست‌ها)؛ تراکنش مالی و مانده حساب دست‌نخورده باقی می‌مانند
getAllIncomes(filters) → لیست با فیلتر (تاریخ، حساب، دسته)
getIncomeById(id)
getTotalIncome(startDate, endDate, accountId?, targetCurrency?) → مجموع درآمد با نرخ تاریخی — **فقط ردیف‌های `isVoided = false` از `inc_transactions`**

Recurring Income APIs:

createRecurringIncome(data)
updateRecurringIncome(id, data)
toggleRecurring(id, active)
getAllRecurringIncomes
generateRecurringIncomes → تولید تراکنش‌های درآمد از روی قالب‌های فعال (Job روزانه)


روابط با سایر فیچرها

Accounts & Banking: به‌روزرسانی currentBalance
Currency & Multi-Currency: دریافت نرخ تبدیل لحظه‌ای
Transaction: ایجاد رکورد تراکنش
Reports و Dashboard: گزارش درآمد با نرخ تاریخی

> **نکته مهم**: برای یکسان‌سازی دسته‌بندی‌ها و جلوگیری از typo، لیست استاندارد دسته‌ها در فایل `99-Common-Categories/Categories.md` تعریف شده است. برای درآمدها باید از دسته‌های لیست درآمد استفاده شود.

> **نکته نام‌گذاری**: فیلد `accountTransactionId` لینک به `acc_transactions` است.

## قرارداد ثبت (پیاده‌سازی)

`createIncome` داخل یک `runAtomicFinancialOperation`:

1. validate: amount > 0، currency == account.currency، date ≤ today، account not archived
2. INSERT `inc_transactions` (isVoided=false)
3. INSERT `acc_transactions` با `type='deposit-income'`، relatedFeature=`income`، relatedId=inc id
4. INSERT journal lines: Dr bank `fin_accounts` / Cr income category `fin_accounts` (`lineKind=income`, `accountClass` مشتق)
5. به‌روز `acc_accounts.currentBalance` و `balanceAfterTransaction`
6. COMMIT → persist

`correctIncome` → `core.reverseOperation(original)` سپس operation جدید برای مبلغ درست؛ **بدون** void/reverse دستی موازی روی acc توسط Feature.

`getTotalIncome` / گزارش‌ها: فقط `isVoided = false`.

دسته‌ها: فقط از `99-Common-Categories/Categories.md` (لیست درآمد).

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

`inc_transactions` = **Domain sub-ledger** (جزئیات UI، دسته، recurring، metadata).

**SoT حسابداری و گزارش میان‌فیچری** = journal lines روی `fin_accounts` از طریق `runAtomicFinancialOperation`.

```text
Income UI
  → Financial Operation
  → Domain row (inc_transactions)
  → Journal (accountId…)
  → acc_transactions اگر cash بانکی
  → snapshots
```

**ممنوع:** گزارش Expense/Income کلی فقط از جدول domain بدون journal، یا جمع domain + journal با هم.

> **Immutable:** «ویرایش» مبلغ/کارمزد ممنوع؛ فقط `correctIncome` / reverse. ویرایش metadata غیرمالی مجاز. `Financial-Invariants` §14.

Income = economic classification (`fin_accounts` income)؛ منبع نقد = bank account جدا — Accounting Core هر دو leg را می‌نویسد.

## FEAT-P0 LOCK (Income)

Correction/reversal = new Financial Operation + `reversesOperationId`; original immutable (same as Expense P0-023).

## FEAT-P0-023 DEEP (Income)
Same as Expense: reversesOperationId; no double-count cash.

---
## P0-001/002/003 LOCK — Reversal ownership (Income)

| ممنوع | درست |
|--------|------|
| Feature void + manual acc reversal + new tx به‌صورت مراحل جدا | `core.reverseOperation(operationId)` |
| double reverse (Feature یک‌بار، Core یک‌بار) | فقط Core |
| فقط `isVoided=true` بدون lineage | `operationId`, `reversesOperationId`, `reversalOperationId` اجباری |

`isVoided` روی ردیف domain = **projection** از وضعیت operation معکوس‌شده؛ منبع حقیقت زنجیره = `fin_operations` lineage.

## P0-023 — correctIncome Core-only (reaffirm)
No Feature-local void+acc reverse pipeline.
