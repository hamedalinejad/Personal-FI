# 05 constraints polymorphic

## قرارداد CHECK Constraints در SQLite (P0 Decimal TEXT)

مبالغ، quantity، price، rate به‌صورت **TEXT** (decimal string) ذخیره می‌شوند.  
**SQLite مقایسه عددی قابل‌اتکا روی TEXT ندارد** — نباید به‌عنوان تنها محافظ صحت Decimal به آن تکیه کرد.

### سه لایه اعتبارسنجی (اجباری)

```text
API Validation          (shape، required، enum)
        ↓
Domain Decimal Validation  (decimal.js parse + rules)
        ↓
SQLite Structural Constraint   (NOT NULL، length، enum type — نه مقایسه عددی مالی)
```

### ممنوع به‌عنوان تنها محافظ (و گمراه‌کننده روی TEXT)

```sql
-- ممنوع اتکا برای correctness مالی:
CHECK (feeAmount >= 0)
CHECK (quantity >= 0)
CHECK (price > 0)
CHECK (averageBuyPrice >= 0)
CHECK (exchangeRateToBase > 0)
CHECK (amount > 0)
```

روی TEXT، `" 10 "`, `"1..2"`, `"abc"`, `"--10"` یا ترتیب lexicographic ممکن است رفتار غیرعددی بدهد. **این CHECKها جایگزین Domain نیستند.**

### CHECK ساختاری مجاز (نمونه schema)

```sql
-- structural only — نه correctness عددی
CHECK (length(trim(amount)) > 0)
CHECK (amount IS NOT NULL)
CHECK (feeAmount IS NULL OR length(trim(feeAmount)) > 0)
CHECK (type IN ('buy','sell','transfer_in','transfer_out'))  -- enum-like
CHECK (currentBalance IS NOT NULL)  -- وجود فیلد cache؛ مقدار را Domain می‌نویسد
-- purityRatio اگر REAL باشد مقایسه عددی OK؛ اگر TEXT باشد مثل بقیه در Domain
```

### قوانین
1. **تمام Decimal stringها قبل از persist** باید توسط Decimal Parser کاننیکال شوند (مثلاً `"12.500000"` → canonical طبق PrecisionPolicy).
2. **هیچ محاسبه مالی** (`+ − × ÷`، جمع مانده، P&L، کارمزد) نباید توسط SQLite انجام شود — فقط Decimal Engine در Domain.
3. **ممنوع:** `SUM(amount)` / `SUM(quantity)` روی ستون‌های مالی TEXT.
4. Domain validate می‌کند (پیام کاربرپسند)؛ DB فقط structural + FK.
5. `PRAGMA foreign_keys = ON` در هر اتصال sql.js **اجباری** است.

---

## سیاست Foreign Key کامل

برای سیستم مالی تقریباً immutable، حذف parent نباید تاریخچه child را پاک کند مگر استثنای صریح.

### پیش‌فرض پروژه

| رابطه نوعی | ON DELETE | دلیل |
|------------|-----------|------|
| `acc_transactions.accountId` → accounts | **RESTRICT** | حذف حساب دارای تاریخچه ممنوع |
| تراکنش‌های سرمایه‌گذاری → holding/fund/platform | **RESTRICT** | تاریخچه معاملات حفظ شود |
| `*_transactions.accountTransactionId` → acc_transactions | **RESTRICT** یا SET NULL فقط اگر لینک اختیاری مستند شده | |
| `price_history.sourceId` → price_sources | **SET NULL** | تاریخچه قیمت بعد از حذف منبع منطقی بماند |
| `price_sync_settings` → sources/symbols | **CASCADE** قابل‌قبول برای تنظیمات غیرمالی | |
| لاگ‌ها / reminders وابسته به رکورد عملیاتی | **CASCADE** یا RESTRICT طبق حساسیت | |
| اسناد `docs_links` | **CASCADE** از document؛ **RESTRICT** از entity مالی اگر لازم | |

### قوانین
1. **هیچ FK به جدول تراکنش مالی نباید CASCADE از parent کسب‌وکاری داشته باشد** مگر سند صریح خلاف بگوید.
2. حذف منطقی (archive / isActive=false / isVoided) بر حذف فیزیکی ترجیح داده می‌شود.
3. هر FK در `schema.sql` باید صریحاً `ON DELETE` / `ON UPDATE` داشته باشد؛ پیش‌فرض خام SQLite (NO ACTION) بدون مستندسازی ممنوع است.
4. فهرست کامل FKها هنگام implementation در `schema.sql` + این جدول سیاست نگهداری می‌شود.

---

## لینک بین Feature و Cash — یک SoT

**Canonical (Must):** جدول `acc_transaction_links`

```text
UNIQUE(accTransactionId, relatedFeature, relatedId)
```

| لایه | نقش |
|------|-----|
| `acc_transaction_links` | **SoT رابطه** bank tx ↔ domain event |
| `acc_transactions.relatedFeature` + `relatedId` | **فقط سازگاری/مهاجرت یا denormalized cache** — نباید با links تناقض داشته باشد؛ در write path فقط از API نوشته می‌شود که **همزمان links را upsert** می‌کند |

**ممنوع:** دو رابطه canonical مستقل که یکی چیز دیگری بگوید.

اگر فقط یکی پر باشد: لینک ناقص → reconcile orphan.

---

## Polymorphic FK: `relatedFeature` + `relatedId` (جزئیات validate)

SQLite نمی‌تواند enforce کند که `relatedId` به جدول درست اشاره می‌کند.

### mitigations الزامی

1. **Enum بسته** `RelatedFeature` فقط از `core/types` (از قبل موجود).
2. **Validate در Domain** داخل `runAtomicFinancialOperation`: وجود ردیف هدف قبل از INSERT در `acc_transactions`.
3. **جدول `acc_transaction_links` (Must Have)**:
```sql
UNIQUE(accTransactionId, relatedFeature, relatedId)
-- index برای join گزارش cross-feature
```
هر `acc_transactions` با related غیرnull باید حداقل یک ردیف لینک هم‌خوان داشته باشد (یا related روی خود tx + لینک mirror).
4. **Reconcile**: برای هر `acc_transactions` با related غیرnull، بررسی وجود هدف؛ orphan = گزارش خطا.
5. **ممنوع**: نوشتن `relatedFeature`/`relatedId` از UI بدون عبور از API فیچر مالک.

> محدودیت intrinsic polymorphic FK پذیرفته شده است؛ correctness با Domain + Reconcile + تست integration جبران می‌شود.

---

## تقویت Integrity لینک Polymorphic

FK واقعی SQLite ممکن نیست؛ mitigations **لایه‌ای**:

1. **Validate همزمان با INSERT** (داخل همان BEGIN atomic): وجود ردیف هدف؛ وگرنه COMMIT نشود.
2. **جدول `ref_integrity_queue` (Must Have)**: مسیر یکپارچگی اجباری — نه قابلیت جانبی.
3. **Reconcile اجباری در مسیرهای حساس**: قبل از Backup و بعد از Restore، `reconcileOrphanLinks` برای `acc_transactions` و سایر polymorphic tables.
4. **ممنوع DELETE فیزیکی** parent تا وقتی child link دارد (هم‌راستا با ON DELETE RESTRICT روی FKهای واقعی).
5. تست integration: حذف/void والد نباید child را بی‌سرپرست رها کند بدون گزارش.

این همچنان Weak Integrity نسبت به FK واقعی است، ولی mitigations **الزامی در runtime**اند:
1. CHECK `relatedFeature` ∈ enum بسته (لیست در types) در صورت امکان + validate Domain.
2. قبل از COMMIT: SELECT وجود `relatedId` در جدول map[relatedFeature].
3. `reconcileOrphanLinks` در Backup/Restore و دوره‌ای در Settings «سلامت داده».
4. UI هرگز relatedId را بدون انتخاب entity از API فیچر مالک نمی‌نویسد.
5. مسیر آینده Should Have: جدول link اختصاصی per pair برای روابط پرتکرار (کاهش polymorphic surface).

---

## سیاست کاهش Polymorphic Link

`relatedFeature` + `relatedId` **فقط** جایی که رابطه واقعاً چندجدول است (مثلاً `acc_transactions` به چند منبع رویداد).

### ترجیح FK واقعی
| رابطه | به‌جای polymorphic |
|--------|---------------------|
| crypto tx → holding | `holdingId` FK |
| stock tx → brokerage | `brokerageId` FK |
| loan payment → loan | `loanId` FK |
| cheque → account | `accountId` FK |
| document → یک entity مشخص پرتکرار | جدول link اختصاصی یا FK مستقیم |

### Polymorphic مجاز
- `acc_transactions.related*` (ورود به cash از منابع مختلف)
- `docs_links` / notifications به چند نوع entity
- `fin_journal_entries.related*` برای audit میان‌فیچری

هر polymorphic: validate قبل از COMMIT + reconcile orphan + **`acc_transaction_links` Must** برای روابط cash.

هدف: سطح Accounting-critical با FK واقعی؛ polymorphic حداقل و کنترل‌شده.

---

## Instrument Registry مرکزی

جدول `ref_instruments` (Core):

| فیلد | نقش |
|------|-----|
| `id` | UUID = **instrumentId** سراسری |
| `assetCategory` | crypto \| stock \| fif \| metal \| other |
| `displaySymbol` | label قابل‌تغییر |
| `name` | |
| `externalRef` | JSON: assetKey / ISIN / fundId / metalType+purity |

Holdingها و `price_history` فقط به `ref_instruments.id` (یا کلید معادل پایدار category-scoped که در registry ثبت شده) اشاره می‌کنند.

| دسته | هویت در registry |
|------|------------------|
| crypto | assetKey ثبت‌شده → instrument id |
| stock | ISIN/UUID پایدار — **نه symbol** |
| fif | fundId |
| metal | metalType + purity |

**Invariant:** `symbol` / `displaySymbol` هرگز UNIQUE identity holding نیست.

---

جزئیات: `docs/core/Instrument-Identity.md`

Polymorphic برای notes/tags/generic. **روابط حساس** (Loan→Party, Tx→Instrument, Line→Account): FK واقعی ترجیح.

---

## Decimal روی TEXT — CHECK عددی کافی نیست (P0)

SQLite affinity برای TEXT مقایسه عددی قابل‌اتکا روی `CHECK (amount > 0)` نمی‌دهد.

**Domain (اجباری با decimal.js):**
```text
input
  → trim
  → Decimal.parse (رد: "abc", "1..2", "--10", " 10 " با فضای معنی‌دار غلط، خالی)
  → validate علامت/حد (≥0, >0, …)
  → normalize canonical string طبق PrecisionPolicy / instrument scale
  → SQLite TEXT
```

**DB فقط structural:**
- `NOT NULL` روی فیلدهای اجباری
- `CHECK (length(trim(col)) > 0)`
- enum-like CHECK روی type/status
- **نه** `CHECK (col >= 0)` به‌عنوان correctness مالی

**ممنوع در SQL:**
- aggregation مالی با `SUM`/`AVG` روی TEXT decimal
- مقایسه عددی برای business rule فقط در SQL

**اجباری در Documentation/Code review:** هر PR که `SUM(` روی amount/quantity/price بزند رد می‌شود مگر ستون non-financial INTEGER باشد.

جزئیات: `Implementation-Pitfalls.md` · `Precision-Policy.md` · `Rounding-Policy.md`

---
## P0-007 — Polymorphic link enforce

On every write of relatedFeature/relatedId:

1. relatedFeature ∈ closed enum (`types.md`)
2. relatedId exists in mapped table (runtime validate inside operation)
3. Prefer real FK when single-target; polymorphic only for docs/notifications/generic links
4. Periodic reconcile for orphans → ref_integrity_queue
