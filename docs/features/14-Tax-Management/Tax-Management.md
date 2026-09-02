# فیچر: Tax Management (مدیریت مالیات)

## توضیح کلی

این فیچر به کاربر کمک می‌کند مالیات‌ها و عوارض مرتبط با فعالیت‌های مالی و سرمایه‌گذاری خود را پیگیری، محاسبه و مدیریت کند. 
تمرکز آن روی نیازهای یک کاربر شخصی ایرانی است (نه حسابداری شرکتی کامل).

موارد قابل پوشش:
- مالیات بر درآمد (در صورت نیاز)
- مالیات نقل و انتقال یا سود سرمایه‌گذاری (در صورت اعمال)
- عوارض و مالیات‌های مرتبط با دارایی
- یادآوری موعدهای مالیاتی
- نگهداری اسناد و سوابق مالیاتی

این فیچر بیشتر نقش **پیگیری و آماده‌سازی اطلاعات** را دارد و جایگزین مشاور مالیاتی یا نرم‌افزارهای تخصصی اظهارنامه نیست.

---

## User Stories

### Must Have
- ثبت رویداد مالیاتی (نوع، مبلغ، تاریخ، وضعیت)
- دسته‌بندی انواع مالیات و عوارض
- مشاهده لیست مالیات‌های پرداخت‌شده و در انتظار
- یادآوری موعد پرداخت مالیات
- اتصال پرداخت مالیات به حساب بانکی
- مشاهده مجموع مالیات‌های پرداخت‌شده در بازه زمانی

### Should Have
- پیوست اسناد و فیش‌های پرداخت
- برآورد ساده مالیات بر اساس درآمد یا سود
- گزارش سالانه مالیات‌ها
- تفکیک مالیات مرتبط با سرمایه‌گذاری‌ها

---

## Business Rules

1. هر رکورد مالیاتی باید نوع مشخصی داشته باشد.
2. وضعیت مالیات می‌تواند `pending`, `paid`, `overdue`, `cancelled` باشد.
3. هنگام پرداخت مالیات (**یک بار ورود به Ledger — **):
 - **فقط یک** ردیف `acc_transactions` ساخته می‌شود با `type = 'withdrawal-expense-tax'` (یا `deposit-income-tax` برای بازگشت).
 - **ممنوع**: ساختن Expense عمومی (`withdrawal-expense`) و سپس یک تراکنش Tax جدا — باعث double-count در Ledger می‌شود.
 - جریان اتمیک پیشنهادی داخل `markAsPaid` / `payTax`:
 1. `runAtomicFinancialOperation`: INSERT همان یک `acc_transactions` با type اختصاصی Tax + به‌روز balance حساب
 2. UPDATE `tax_records`: `status=paid`, `paidDate`, `accountId`, `accountTransactionId` = id همان تراکنش
 - اگر UI از مسیر Expense عمومی استفاده کند، باید همان type Tax را بنویسد یا به `payTax` делеگیت کند — نه دو API پشت‌سرهم که هر کدام INSERT جدا بزنند.
 - موجودی حساب فقط یک بار تغییر می‌کند.
4. مالیات‌های معوق باید در یادآوری‌ها و داشبورد نمایش داده شوند.
5. حذف فیزیکی وجود ندارد — فقط تغییر وضعیت.
6. محاسبات پیچیده مالیاتی (اظهارنامه رسمی) خارج از محدوده این فیچر است.
7. برای هر تراکنش مالیاتی، `exchangeRateToBase` در لحظه پرداخت ذخیره می‌شود تا ارزش تاریخی قابل محاسبه باشد.

---

## Domain Entities

### ۱. Tax Record (جدول: `tax_records`)

- `id` → UUID (Primary Key)
- `title` → string (مثلاً «مالیات عملکرد ۱۴۰۴» یا «عوارض خودرو»)
- `taxType` → string (`income`, `capital_gains`, `property`, `vehicle`, `other`)
- `amount` → decimal
- `currency` → string (پیش‌فرض IRR)
- `dueDate` → datetime
- `paidDate` → datetime (nullable)
- `status` → string (`pending`, `paid`, `overdue`, `cancelled`)
- `taxYear` → number (عدد سال مالیاتی — مثلاً 1404 یا 2026)
- `taxCalendar` → string (`jalali` | `gregorian`) — **اجباری با taxYear**؛ بدون تقویم، عدد سال تفسیرپذیر نیست
- در پیاده‌سازی فقط `taxYear` + `taxCalendar` نوشته شود (فیلد `year` به‌تنهایی استفاده نشود)
- `description` → string
- `accountId` → UUID (حساب پرداخت‌کننده — nullable)
- `accountTransactionId` → UUID (لینک به `acc_transactions` — nullable)
- `relatedFeature` → string (نوع `RelatedFeature` — تعریف مرکزی در `core/types/types.md`؛ nullable — برای مالیات مرتبط با یک زیرفیچر خاص، مقدار دقیق آن زیرفیچر استفاده می‌شود: `crypto_exchange`, `stocks_iran`, `fif`, `metals`, `physical_assets`)
- `relatedId` → UUID (nullable)
- `hasAttachment` → boolean
- `attachmentPath` → string
- `exchangeRateToBase` → decimal (نرخ ارز پرداخت → baseCurrency کاربر — )
- `createdAt` → datetime
- `updatedAt` → datetime

### ۲. Tax Category (جدول: `tax_categories`) — اختیاری

- `id` → UUID
- `name` → string
- `code` → string
- `description` → string
- `isActive` → boolean

---

## APIهای داخلی

### Tax Record APIs
- `createTaxRecord(data)` → ثبت مالیات جدید (بدون تراکنش واقعی)
- `updateTaxRecord(taxRecordId, data)` → ویرایش مالیات
- `getAllTaxRecords(filters)` → فیلتر بر اساس سال، نوع، وضعیت
- `getTaxRecordById(taxRecordId)` → دریافت جزئیات مالیات
- `payTax(taxRecordId, { paidDate, accountId, amount? })` → **مسیر اصلی** 
 یک atomic op: یک `acc_transactions` با `withdrawal-expense-tax`/`deposit-income-tax` + لینک به tax_record + status=paid. **دو بار INSERT ممنوع.** 
 > **توجه**: پارامترهای `relatedFeature`/`relatedId` از امضای این تابع حذف شده‌اند — این فیلدها فقط در زمان ایجاد رکورد (`createTaxRecord`) یا ویرایش (`updateTaxRecord`) قابل تنظیم‌اند و به منشأ مالیاتی رکورد اشاره دارند، نه به عملیات پرداخت. تنظیم آن‌ها در `payTax` باعث می‌شد با مقادیر اولیه رکورد تداخل ایجاد شود و پیوند audit trail گم شود.
- `markAsPaid(taxRecordId, paidDate, accountId, accountTransactionId, ...)` → فقط وقتی تراکنش Tax **از قبل** با type صحیح ساخته شده (مثلاً import)؛ اگر type عمومی expense باشد باید reject شود تا double-count نشود.
- `changeStatus(taxRecordId, status)` → تغییر وضعیت (pending, paid, overdue, cancelled) بدون ساخت ledger مگر از مسیر payTax
- `getPendingTaxes` / `getOverdueTaxes`

### Summary APIs
- `getTaxSummary(taxYear?, taxCalendar?)` → مجموع پرداخت‌شده و در انتظار
- `getTaxesByType(taxYear?, taxCalendar?)`
- `getAnnualTaxReport(taxYear, taxCalendar)` → سال بدون تقویم ناقص است

---

## روابط با سایر فیچرها

- **Accounts & Banking**: ایجاد تراکنش Expense/Income و کاهش/افزایش موجودی حساب
- **Expense**: ایجاد تراکنش هزینه هنگام پرداخت مالیات (برای مالیات‌های هزینه‌محور)
- **Income**: ایجاد تراکنش درآمد هنگام بازگشت مالیات (در صورت وجود)
- **Investment**: پیگیری مالیات احتمالی سود سرمایه‌گذاری (از طریق `relatedFeature` با مقدار دقیق زیرفیچر — یکی از `crypto_exchange`, `stocks_iran`, `fif`, `metals`)
- **Physical Assets**: عوارض و مالیات خودرو یا ملک (از طریق `relatedFeature=physical_assets`)
- **Notification & Reminder**: یادآوری موعد پرداخت
- **Document Management**: نگهداری فیش و اسناد مالیاتی
- **Reports / Dashboard**: نمایش مالیات‌های نزدیک و مجموع پرداختی

---

## انواع مالیات پیشنهادی

| نوع | مثال | نوع تراکنش |
|------|------|------------|
| `income` | مالیات بر درآمد مشاغل / حقوق | Expense |
| `capital_gains` | مالیات سود سرمایه‌گذاری (در صورت اعمال) | Expense |
| `property` | مالیات یا عوارض ملک | Expense |
| `vehicle` | عوارض خودرو | Expense |
| `other` | سایر عوارض و مالیات‌ها | Expense |

---

## نکات طراحی

- این فیچر برای کاربر شخصی طراحی شده و نباید پیچیده شود.
- تمرکز روی ثبت، پیگیری وضعیت و یادآوری است، نه محاسبه قانونی دقیق.
- امکان اتصال به سال مالیاتی مشخص (مثلاً ۱۴۰۴) برای گزارش‌گیری بهتر وجود داشته باشد.
- در Dashboard می‌توان مجموع مالیات‌های در انتظار و نزدیک به سررسید را نمایش داد.
- `exchangeRateToBase` در زمان ثبت/پرداخت ذخیره می‌شود.
- پرداخت مالیات فقط از `payTax` (**P0-085**): **یک** financial operation / یک `acc_transactions` با type اختصاصی tax (`withdrawal-expense-tax` / `deposit-income-tax`).
  - مسیر Expense عمومی (`withdrawal-expense`) برای پرداخت tax **reject** یا **delegate به payTax** — دو INSERT موازی ممنوع (duplicate ledger).
- در نسخه‌های بعدی می‌توان قالب‌های آماده برای انواع رایج مالیات اضافه کرد.

---

## قرارداد Tax Metadata روی تراکنش‌های سرمایه‌گذاری

Tax Feature جداست، ولی **دادهٔ لازم برای محاسبه بعدی مالیات باید از همان لحظه ثبت معامله حفظ شود** — بعداً قابل بازیابی از هیچ‌جا نیست («هیچ فیلدی از بین نره»).

### فیلدهای مشترک (روی جداول تراکنش Investment)

روی `inv_crypto_transactions`, `inv_stocks_iran_transactions`, `inv_fif_transactions`, `inv_metals_transactions` (و در صورت نیاز physical):

| فیلد | نوع | توضیح |
|------|-----|--------|
| `taxLotId` | UUID nullable | گروه lot برای FIFO/LIFO آینده |
| `costBasisAmount` | decimal nullable | مبنای هزینه در لحظه (پس از fee تخصیص‌یافته) |
| `costBasisCurrency` | string nullable | |
| `proceedsAmount` | decimal nullable | عایدی فروش/ابطال قبل از مالیات (برای sell/redemption) |
| `realizedGainAmount` | decimal nullable | سود/زیان تحقق‌یافته محاسبه‌شده در همان atomic op |
| `isTaxableEvent` | boolean | پیش‌فرض true برای sell/dividend؛ false برای transfer داخلی در صورت تعریف |
| `taxExemptReason` | string nullable | اگر مشمول نیست |
| `taxYear` | number nullable | سال مالیاتی business (جلالی یا میلادی طبق تنظیم — در v1 عدد سال businessDate) |
| `withholdingTaxAmount` | decimal nullable | مالیات کسرشده در مبدأ (مثلاً بخشی از feeTax سهام) |
| `linkedTaxRecordId` | UUID nullable | لینک به `tax_records` بعد از ایجاد رکورد مالیاتی |

### قوانین
1. در `runAtomicFinancialOperation` فروش/سود نقدی، حداقل `isTaxableEvent`, `costBasisAmount`/`proceedsAmount` یا `realizedGainAmount`, `taxYear` باید در همان COMMIT نوشته شوند (اگر قابل محاسبه باشند).
2. Tax Feature **منبع حقیقت رویداد** نیست؛ از این metadata + reconcile می‌خواند و `tax_records` می‌سازد.
3. `feeTax` در سهام ایران بخشی از کارمزد است و در `withholdingTaxAmount` یا تفکیک fee نیز منعکس می‌شود (از قبل `feeTax` وجود دارد).
4. انتقال داخلی (transfer بین صرافی‌های خود کاربر) معمولاً `isTaxableEvent=false` مگر قانون خلاف بگوید.
5. حذف این فیلدها از schema ممنوع است حتی اگر UI مالیات در v1 ساده باشد.

### API پل
- `tax.getTaxableEvents(filters)` → خواندن از تراکنش‌های Investment با `isTaxableEvent=true`
- `tax.attachTaxRecord(transactionRef, taxRecordId)` → پر کردن `linkedTaxRecordId`

### قواعد سال مالیاتی
- همیشه جفت `(taxYear, taxCalendar)` ذخیره و فیلتر شود.
- گزارش سالانه: `getAnnualTaxReport(taxYear, taxCalendar)`.
- پیش‌فرض UI از تنظیمات `dateFormat` کاربر (`jalali`/`gregorian`) می‌آید ولی در رکورد snapshot می‌شود.

---

## feeTax در برابر Tax Liability (P0-084 LOCK)

feeTax = transaction cost only. Tax liability = tax_events / tax_records. Explicit relationship via linkedTaxEventId only; never sum feeTax into tax paid.

| مفهوم | کجا | نقش حسابداری |
|--------|-----|----------------|
| **`feeTax` (سهام و مشابه)** | breakdown کارمزد معامله (`inv_stocks_*`) | **هزینه معامله / transaction cost** — وارد cost basis یا کاهش proceeds همان trade |
| **`withholdingTaxAmount`** | metadata همان trade | مبلغ کسر در مبدأ (اغلب برابر یا جزئی از feeTax) — هنوز **نه** لزوماً `tax_records` |
| **Tax liability / `tax_records`** | فیچر Tax | بدهی/تعهد مالیاتی کاربر برای دوره (اظهار، پرداخت `payTax`) |

**ممنوع:** یکی فرض کردن «feeTax روی خرید سهام» با «بدهی مالیات سالانه در Tax Management».

جریان درست:
1. Trade ثبت می‌شود؛ `feeTax` در P&L/cost همان معامله اثر دارد.
2. در صورت نیاز، taxable event metadata پر می‌شود.
3. `tax_records` جدا ساخته/لینک می‌شود (`linkedTaxRecordId`) وقتی کاربر/قوانین بدهی دوره‌ای را ثبت می‌کند.
4. پرداخت بدهی فقط از `payTax` — نه با دوبار شمردن feeTax به‌عنوان expense مالیات.

### قانون ضد Double-Count feeTax و withholding

```text
feeTax              → فقط در breakdown کارمزد معامله و cost/P&L همان trade
withholdingTaxAmount → همان مبلغ (یا جزئی از آن) برای metadata مالیاتی؛ کپی معنایی نه هزینه دوم
```

گزارش Expense/Tax:
- **نباید** `Σ feeTax` را به‌عنوان «مالیات پرداخت‌شده» به `tax_records` اضافه کند.
- گزارش مالیات دوره‌ای فقط از `tax_records` / `payTax`.
- اگر `withholdingTaxAmount` پر است و برابر `feeTax` است → یک مبلغ اقتصادی؛ دو برچسب.

در UI: feeTax زیر «هزینه معامله»؛ withholding فقط در بخش tax metadata / گزارش taxable events.

---

## tax_events مرکزی

به‌جای تکرار کامل metadata در هر investment table:

```text
tax_events: id, taxYear, calendar, eventKind, amount, currency, sourceOperationId, linkedRecordIds…
investment tx: linkedTaxEventId? (nullable)
```

SoT بدهی/رویداد مالیاتی = Tax feature. Investment فقط reference + حداقل فیلدهای لازم cost/proceeds برای محاسبه.

### Lifecycle با Domain Reversal
- `sourceOperationId` روی `tax_events`
- با `reverseOperation`: `voidTaxEvent` یا `reverseTaxEvent` (immutable audit)
- گزارش سال: `WHERE status = active` (voided حذف)

مدل: TaxableEvent · Rule · Basis · Rate · Amount · Status · Period · Evidence. MVP ساده؛ Engine قابل گسترش.

Rules versioned: `ruleId`, effectiveFrom/To, jurisdiction, version — تراکنش قدیم با قانون جدید recalculate silent نمی‌شود.

---

## feeTax ≠ tax event (P0)

`feeTax` روی معامله (مثلاً سهام) = هزینه همان trade.  
جایگزین `tax_events` / رکورد مالیاتی دوره‌ای **نیست**.

## FEAT-P0 LOCK (Tax)

Tax period key: **`(taxYear, taxCalendar)`** everywhere (snapshots and investment tax metadata).
v1 may default calendar from settings but field must not be dropped.

## FEAT-P0-049/050 LOCK (Tax payment & feeTax)

### Payment (P0-049)
Tax payment = **one** Financial Operation with one cash leg (tax-specific).
Expense reports may **categorize** that same operation — must not create a second cash movement.

### feeTax vs tax event (P0-050)
- `feeTax` on trade = transaction cost economics only
- Tax domain event/liability = separate
- Withholding = one economic amount; never expense twice

## FEAT-P0-048 DEEP
All tax snapshots key (taxYear, taxCalendar). Investment tax links use linkedTaxEventId; calendar never implicit-only.

## FEAT-P0-049 DEEP
Tax payment creates one cash leg. Expense category view may reference same operationId — no second cash tx.

## FEAT-P0-050 DEEP
feeTax on trades = cost component. tax_events = liability/payment domain. Withholding not posted twice as expense+feeTax.



### P0-086 — Investment tax metadata: single SoT

- **New writes**: only central tax event (`tax_events` / `linkedTaxEventId` on the investment operation). Feature-local tax metadata fields on inv_* transactions are **not** written by new code.
- **Legacy fields** (`isTaxableEvent`, `costBasisAmount`, `proceedsAmount`, `realizedGainAmount`, `taxYear`, `withholdingTaxAmount`, `taxLotId`, `linkedTaxRecordId`, …): **read-only** for migration/display; migration job may backfill `linkedTaxEventId`.
- Competing SoT (writing both legacy columns and tax_events as authority) = forbidden.
