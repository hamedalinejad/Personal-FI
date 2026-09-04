# فیچر: Bills & Recurring Transactions (قبوض و تراکنش‌های تکرارشونده)

## توضیح کلی

این فیچر مسئولیت مدیریت **قبوض** و **تراکنش‌های تکرارشونده** (هزینه یا درآمد دوره‌ای) را بر عهده دارد.
کاربر می‌تواند قبوض ماهانه، اشتراک‌ها، اجاره، حقوق و هر پرداخت یا دریافت دوره‌ای را تعریف کند تا سیستم آن‌ها را یادآوری کند و در صورت تمایل به صورت خودکار ثبت نماید.

این فیچر با فیچرهای **Expense** و **Income** در ارتباط است و تراکنش‌های واقعی را از طریق آن‌ها ایجاد می‌کند.

> **تفاوت با `inc_recurring` و `exp_recurring`**:
>
> | ویژگی | `inc_recurring` / `exp_recurring` | `br_items` |
> |-------|----------------------------------|------------|
> | **هدف** | تولید خودکار تراکنش بدون نیاز به تأیید | یادآوری + پیگیری وضعیت پرداخت |
> | **جریان** | تراکنش مستقیم در `inc/exp_transactions` | `br_occurrences` → تأیید کاربر → تراکنش |
> | **مبلغ** | ثابت | ثابت یا متغیر (`isVariableAmount`) |
> | **وضعیت** | ندارد (تراکنش یا تولید می‌شود یا نه) | `pending / paid / overdue / skipped` |
> | **مناسب برای** | حقوق ثابت، اجاره ثابت | قبض برق، اینترنت، اشتراک با مبلغ متغیر |
>
> **قانون**: برای یک تراکنش تکرارشونده فقط از **یکی** از این دو روش استفاده کنید.

---

## User Stories

### Must Have
- تعریف قبض یا تراکنش تکرارشونده (هزینه یا درآمد)
- تعیین دوره تکرار (ماهانه، هفتگی، سالانه، سفارشی)
- تعیین تاریخ سررسید بعدی
- یادآوری قبل از سررسید
- ثبت دستی پرداخت/دریافت
- مشاهده لیست قبوض و تراکنش‌های نزدیک به سررسید
- مشاهده وضعیت پرداخت (پرداخت‌شده / در انتظار / معوق)

### Should Have
- ثبت خودکار تراکنش در تاریخ سررسید (با تأیید کاربر)
- اتصال به پاکت بودجه
- پیوست فاکتور یا قبض
- تاریخچه پرداخت‌های هر مورد
- مبلغ متغیر (مثلاً قبض برق)

---

## Business Rules

1. هر مورد می‌تواند از نوع **هزینه** (`expense`) یا **درآمد** (`income`) باشد.
2. دوره تکرار می‌تواند `weekly`, `monthly`, `yearly` یا `custom` باشد.
3. در تاریخ سررسید (یا چند روز قبل)، سیستم یادآوری ارسال می‌کند.
4. هنگام ثبت پرداخت/دریافت:
 - یک تراکنش واقعی در فیچر Expense یا Income ایجاد می‌شود.
 - وضعیت آن دوره به `paid` تغییر می‌کند.
 - تاریخ سررسید بعدی محاسبه می‌شود.
5. اگر تا بعد از سررسید پرداخت نشود، وضعیت `overdue` می‌شود.
6. مبلغ می‌تواند ثابت یا متغیر باشد.
7. حذف فیزیکی وجود ندارد — فقط غیرفعال‌سازی (`isActive = false`).
8. **پایان تکرار (`endDate`):** اگر `nextDueDate` محاسبه‌شده بعد از `endDate` باشد، هیچ Occurrence جدیدی تولید نمی‌شود و `isActive` آن مورد به‌صورت خودکار `false` می‌شود. این بررسی هم در `generateUpcomingOccurrences` (Job دوره‌ای) و هم در `markAsPaid` (هنگام به‌روزرسانی `nextDueDate`) انجام می‌شود.

---

## Domain Entities

### ۱. Bill/Recurring Item (جدول: `br_items`)

- `id` → UUID (Primary Key)
- `title` → string (مثلاً «اجاره خانه» یا «حقوق ماهانه»)
- `type` → string (`expense` یا `income`)
- `amount` → decimal (مبلغ پایه — در صورت ثابت بودن)
- `isVariableAmount` → boolean (آیا مبلغ هر دوره تغییر می‌کند؟)
- `currency` → string (پیش‌فرض IRR)
- `accountId` → UUID (حساب پیش‌فرض برای پرداخت/دریافت)
- `category` → string (دسته‌بندی)
- `interval` → string (`weekly`, `monthly`, `yearly`, `custom`)
- `customIntervalDays` → number (برای حالت custom — nullable)
- `startDate` → datetime
- `endDate` → datetime (nullable — در صورت محدود بودن)
- `nextDueDate` → datetime (تاریخ سررسید بعدی)
- `reminderDaysBefore` → number (nullable — تعداد روز قبل از سررسید برای یادآوری این مورد؛ اگر مقدار داشته باشد، مقدار سراسری `notif_settings.daysBefore` برای `category='bill'` را override می‌کند؛ اگر `null` باشد، از `notif_settings.daysBefore` به‌عنوان مقدار پیش‌فرض استفاده می‌شود)
- `autoCreateTransaction` → boolean (ثبت خودکار تراکنش؟)
- `envelopeId` → UUID (پاکت بودجه مرتبط — nullable)
- `isActive` → boolean
- `description` → string
- `createdAt` → datetime
- `updatedAt` → datetime

### ۲. Bill/Recurring Occurrence (جدول: `br_occurrences`)

- `id` → UUID
- `brItemId` → UUID
- `dueDate` → datetime
- `amount` → decimal (مبلغ نهایی این دوره)
- `status` → string (`pending`, `paid`, `overdue`, `skipped`)
- `paidDate` → datetime (nullable)
- `exchangeRateToBase` → decimal (nullable — **نرخ تبدیل ارز occurrence/پرداخت → baseCurrency کاربر** در لحظه پرداخت؛ asOf + source طبق Currency-CrossRate. «نرخ تتر» فقط برچسب UI است وقتی base=IRR و quote=USDT — P0-075)
- `transactionId` → UUID (لینک به تراکنش واقعی `exp_transactions.id` یا `inc_transactions.id` — nullable)
- `accountTransactionId` → UUID (لینک به `acc_transactions.id` — nullable)
- `note` → string
- `createdAt` → datetime
- `updatedAt` → datetime

> **نکته لینک در `markAsPaid`**:
> - `transactionId` → `exp_transactions.id` (اگر `type=expense`) یا `inc_transactions.id` (اگر `type=income`)
> - `accountTransactionId` → `acc_transactions.id` (تراکنش بانکی مرتبط)
> - هر دو در یک عملیات atomic پر می‌شوند

---

## APIهای داخلی

### Recurring Item APIs
- `createRecurringItem(data)` → تعریف مورد جدید
- `updateRecurringItem(brItemId, data)`
- `getAllRecurringItems(filters)` → فیلتر بر اساس نوع، وضعیت فعال و ...
- `getRecurringItemById(brItemId)`
- `deactivateRecurringItem(brItemId)`
- `getUpcomingItems(days)` → موارد نزدیک به سررسید

### Occurrence APIs
- `getOccurrences(brItemId)`
- `getPendingOccurrences`
- `getOverdueOccurrences`
- `markAsPaid(brOccurrenceId, amount?, date?, accountId?, exchangeRateToBase?)`
 → ثبت پرداخت/دریافت + ایجاد تراکنش در `exp/inc_transactions` + `acc_transactions` + لینک‌ها + به‌روزرسانی `nextDueDate`؛ اگر بعد از `endDate` → `isActive = false`.
>
> ### P0-074 — Occurrence amount immutability / amendment
> - مبلغ اصلی occurrence هنگام generate ذخیره می‌شود و **با markAsPaid بازنویسی خام نمی‌شود**.
> - اگر `amount` پاس‌داده‌شده ≠ `occurrence.amount` اصلی: یک **amendment event** (یا فیلدهای `originalAmount` + `paidAmount` + `amountAmendedAt`/`amendmentReason`) ثبت می‌شود؛ original حفظ می‌گردد.
> - `paidAmount` / effective amount برای ledger از amendment یا amount آرگومان می‌آید؛ history loss ممنوع.

- `skipOccurrence(brOccurrenceId)` → رد کردن این دوره
- `updateOccurrenceAmount(brOccurrenceId, amount)` → برای مبالغ متغیر

### Scheduler APIs
- `generateUpcomingOccurrences` → تولید Occurrenceهای آینده (Job دوره‌ای)؛ اگر `nextDueDate` محاسبه‌شده بعد از `endDate` باشد، Occurrence جدید تولید نمی‌شود و `isActive = false` می‌شود (طبق Business Rule 8)
- `checkOverdueOccurrences` → به‌روزرسانی وضعیت معوق‌ها
- `sendReminders` → ارسال یادآوری‌ها

---

## روابط با سایر فیچرها

- **Expense**: ایجاد تراکنش هزینه هنگام پرداخت قبض
- **Income**: ایجاد تراکنش درآمد هنگام دریافت حقوق یا درآمد دوره‌ای
- **Accounts & Banking**: تأثیر روی موجودی حساب
- **Budget**: کسر از پاکت بودجه در صورت اتصال
- **Notification & Reminder**: یادآوری سررسیدها
- **Dashboard**: نمایش قبوض نزدیک و معوق
- **Reports**: گزارش هزینه‌ها و درآمدهای تکرارشونده

---

## منطق محاسبه تاریخ سررسید بعدی

| Interval | منطق |
|----------|------|
| `weekly` | +۷ روز |
| `monthly` | همان روز از ماه بعد |
| `yearly` | همان روز و ماه از سال بعد |
| `custom` | + `customIntervalDays` روز |

اگر روز مورد نظر در ماه بعد وجود نداشته باشد (مثلاً ۳۱)، آخرین روز ماه در نظر گرفته می‌شود.

---

## وضعیت‌های Occurrence

| وضعیت | معنی |
|------|------|
| `pending` | در انتظار پرداخت/دریافت |
| `paid` | انجام شده |
| `overdue` | از تاریخ سررسید گذشته و هنوز انجام نشده |
| `skipped` | توسط کاربر رد شده |

---

## نکات طراحی

- برای قبوض با مبلغ متغیر (برق، گاز، آب) فیلد `isVariableAmount` فعال می‌شود و کاربر هنگام پرداخت مبلغ نهایی را وارد می‌کند.
- ثبت خودکار تراکنش بهتر است با تأیید کاربر انجام شود تا از ثبت اشتباه جلوگیری شود.
- در Dashboard بخش «سررسیدهای نزدیک» و «معوق‌ها» باید برجسته نمایش داده شود.
- این فیچر فقط قالب و زمان‌بندی را مدیریت می‌کند؛ تراکنش مالی واقعی همیشه از طریق Expense یا Income ثبت می‌شود.
- `exchangeRateToBase` در زمان پرداخت روی occurrence ذخیره می‌شود (نرخ → baseCurrency کاربر + ترجیحاً rateAsOf/source). «تتر» فقط نمایش است وقتی applicable — P0-075.

---

## راهنمای پیاده‌سازی
- `br_items` قالب یادآوری؛ `br_occurrences` نمونه دوره
- پرداخت occurrence → ساخت income/expense یا فقط mark paid طبق type
- با `inc_recurring`/`exp_recurring` تداخل نکند (قانون انتخاب در Income/Expense)
- Job: تولید occurrenceهای due؛ Notification سررسید

```text
Template → Occurrence → confirm/policy → Financial Operation
```
Recurring **template ≠** financial transaction.


---

## Recurring ≠ Transaction Source مستقل (P0)

```text
Recurring Rule
     ↓
Generate / Confirm Transaction
     ↓
Accounting Operation (Income/Expense/…)
```

Recurring **خودش** موجودی را تغییر نمی‌دهد.
فقط قانون + occurrence است؛ پول فقط با Operation مالی جابه‌جا می‌شود.

---
## P0-025 DEEP — exclusive template source

هر occurrence مالی فقط **یک** generator دارد:

- `sourceKind`: `bills_recurring` | `income_recurring` | `expense_recurring` | …
- `sourceTemplateId` + `scheduledOccurrenceKey` یکتا

ممنوع: هم Bills و هم Income template برای همان تاریخ/مبلغ بدون unique link دو transaction بسازند.

## P0-026 DEEP — occurrence → operation

`br_occurrences` (یا معادل):

- `financialOperationId` **canonical** (الزامی پس از materialize)
- لینک domain typed: `domainFeature` + `domainTxId` با validate — نه یک `transactionId` polymorphic مبهم تنها

## P0-027 DEEP — Standalone settlement

`accountTransactionId` / cash result: **nullable**
Materialize از `CashSettlementPort`؛ بدون Accounts هم occurrence+domain ledger+journal ممکن است.

## P0-028 DEEP — dedupe keys

```text
UNIQUE(templateId, scheduledOccurrenceKey)
+ operationId idempotency on generate
```

Job/notification state به‌تنهایی برای جلوگیری از duplicate کافی **نیست**.

## P0-029 DEEP — day-31 month clamp

Policy صریح روی template:

```text
anchorDay: 1..31
monthClamp: last_day_of_month   // 31 در فوریه → 28/29؛ در ماه ۳۰روزه → 30
```

بعد از clamp، occurrence همان ماه را «drift دائمی به 30» نمی‌کند مگر policy جدا `sticky_clamped_day`.
پیش‌فرض پیشنهادی v1: **always from anchorDay + clamp per month** (نه sticky).


## Catch-up policy (CROSS-CUTTING BATCH-2 §5)

If scheduler misses days: `catchUpPolicy` = `single_latest` | `all_missed` | `skip_missed` (per item or global default). Occurrences keep unique `scheduledOccurrenceKey`.

## Bills BR locks (P0)

Full BR-001…BR-007: `BILLS-BR-001-007-LOCKS.md`

## Locks full text (from BILLS-BR-001-007-LOCKS.md)

# Bills / Recurring Locks BR-001 … BR-007 (P0)

## BR-001 — No duplicate occurrences
```text
UNIQUE(brItemId, scheduledOccurrenceKey)
```
Plus operation idempotency on pay/generate.

## BR-002 — Day-31 monthly drift
`anchorDay` + month clamp policy (`last_day` etc.); after clamp, no permanent silent drift to 30 unless sticky policy (existing P0-029 style).

## BR-003 — Missed periods
`catchUpPolicy`: `single_latest` | `all_missed` | `skip_missed` (BATCH-2 §5).

## BR-004 — autoCreateTransaction modes
Explicit mode enum, e.g. `manual_confirm` | `auto_create` | `auto_create_with_notify` — each with confirmation semantics documented; no ambiguous single boolean.

## BR-005 — Scheduled vs paid amount
`scheduledAmount` (occurrence) vs `paidAmount` / amendment (P0-074); originals preserved.

## BR-006 — Payment vs due date
Payment operation uses `paymentDate`; due remains `dueDate`. Cash/as-of use payment/effective cash dates.

## BR-007 — Standalone
Bills can run with optional CashSettlementPort when Accounts not integrated; document dependency (IE-007 pattern).

Status: **LOCKED** 2026-09-02

