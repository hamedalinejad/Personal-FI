# 02 storage persistence

## قرارداد Amount Storage (v1 — حتمی)

**مدل رسمی DB و Domain:** `TEXT` / string با decimal (نه float، نه INTEGER minor به‌عنوان SoT).

| نوع | ذخیره |
|-----|--------|
| MoneyAmount | TEXT decimal string؛ precision از CurrencyRecord / Rounding-Policy |
| AssetQuantity | TEXT decimal string (crypto decimals از asset registry) |
| Rate / Price | TEXT decimal string |

**Minor unit:** فقط تبدیل در Presentation یا API بانکی (`toMinorUnit`/`fromMinorUnit`) — ستون‌های مالی اصلی INTEGER نیستند.

محاسبات فقط با `decimal.js` طبق `Rounding-Policy.md`. ارجاع قدیمی Blueprint «Minor Unit integer» **باطل** است.


## مسیر فایل‌های دیتابیس

```bash
core/db/
├── db.ts # تعریف دیتابیس و اتصال
├── schema.sql # تعریف جداول با SQL
├── models.ts # TypeScript types برای هر جدول
├── migrations.ts # مدیریت مایگRATION‌های SQLite
├── queries/ # کوئری‌های SQL تجمیع شده
│ ├── reports.ts # کوئری‌های گزارش‌گیری
│ └── analytics.ts # کوئری‌های تحلیلی
└── index.ts # Export اصلی
```

## قرارداد ماندگاری مالی

برای سیستم حسابداری، کاربر فقط وقتی باید «ثبت شد» ببیند که داده **واقعاً persist** شده باشد.

### مسیر اجباری هر عملیات مالی موفق

```text
BEGIN (SQLite transaction)
 → validate
 → write all related rows
COMMIT (SQLite)
 → serialize DB → Write-to-temp-then-swap در IndexedDB (await کامل)
 → فقط بعد از resolve موفق swap → UI «ثبت شد»
```

قوانین:
1. **UI Success فقط بعد از persist موفق IndexedDB** — نه بعد از COMMIT درون‌حافظه‌ای sql.js به‌تنهایی.
2. اگر swap شکست بخورد → UI خطا؛ کاربر نباید فکر کند داده ذخیره شده؛ در صورت امکان rollback منطقی یا علامت «unsaved».
3. `beforeunload` / `visibilitychange` فقط برای تلاش اضافی flush پس‌زمینه؛ **جایگزین مسیر بالا نیستند**.
4. دکمه‌های ثبت تا پایان persist غیرفعال/loading بمانند تا double-submit و حس کاذب موفقیت پیش نیاید.

---

## صف ماندگاری و محدودیت حجم sql.js

sql.js کل DB را در RAM نگه می‌دارد و هر persist کل فایل را serialize می‌کند. برای نسخه ۱ قابل‌قبول است، ولی این قراردادها **الزامی**اند:

### Persistence Queue
- یک صف سریال (`persistenceQueue`) فقط یک serialize/swap در هر لحظه.
- عملیات مالی await همان job صف را می‌کنند (تا UI Success درست باشد).
- debounce فقط برای flushهای غیربحرانی (تنظیمات UI، نه خرید/فروش/قسط).

### محدودیت‌های شناخته‌شده v1
| ریسک | mitigation نسخه ۱ |
|------|-------------------|
| RAM بالا با ده‌ها هزار تراکنش + price_history | هشدار در Settings وقتی تخمین حجم از آستانه گذشت؛ تشویق به Backup |
| Freeze هنگام serialize | serialize سنگین ترجیحاً در Worker؛ UI با progress «در حال ذخیره…» |
| kill موبایل وسط نوشتن | Write-to-temp-then-swap؛ هرگز overwrite مستقیم `db_main` |
| رشد بی‌رویه price_history | dedupe + امکان پاک‌سازی قدیمی در آینده |

### مسیر ارتقا (نه v1)
OPFS / SQLite WASM با نوشتن افزایشی — فقط به‌عنوان مسیر شناخته‌شده؛ بازطراحی از صفر لازم نباشد.

---

## Worker Strategy

| کار | Thread |
|-----|--------|
| UI / React | Main |
| sql.js queries سبک (CRUD تک‌تراکنش) | Main یا Worker — در v1 Main مجاز اگر < ~50ms |
| serialize کامل DB برای persist | **Worker ترجیحی**؛ اگر Worker نبود، Main با UI blocking کوتاه + indicator |
| گزارش‌ها / P&L / Portfolio روی حجم بالا | **اجباری Worker** (یا حداقل chunked async با yield به UI) |
| Adapter شبکه قیمت | async روی Main قابل‌قبول؛ CPU parse سنگین → Worker |

قوانین:
1. هیچ گزارش سنگینی نباید Main Thread را بیش از یک فریم طولانی منجمد کند.
2. API لایه Domain می‌تواند `runInWorker: true` برای queryهای تحلیلی داشته باشد.
3. Service Worker ≠ SQL Worker: SW فقط App Shell + WASM cache؛ محاسبات SQL در Dedicated Worker جدا.

---

## Persist State Machine

`db_meta.persistState` یکی از:

| State | معنی |
|-------|------|
| `IDLE` | main معتبر؛ pending خالی |
| `PREPARED` | serialize+checksum آماده |
| `PENDING_WRITTEN` | `db_pending` نوشته شده |
| `MAIN_BACKED_UP` | `db_backup` ← کپی main قبلی |
| `SWAPPED` | main ← pending در یک IDB transaction |
| `VERIFIED` | checksum/meta با main match |
| `COMPLETED` | = IDLE پس از پاک کردن pending |
| `RECOVERY` | boot در حال انتخاب main/backup/pending |

قوانین:
1. گام‌های `PENDING_WRITTEN` → `MAIN_BACKED_UP` → `SWAPPED` در **یک** IDB transaction تا حد ممکن (یا flagهای durable بین steps).
2. Crash در `PENDING_WRITTEN`: main سالم؛ pending دور انداخته یا validate جدا.
3. Crash در `SWAPPED` قبل از VERIFIED: boot با integrity_check روی main.
4. UI Saved فقط در `COMPLETED`.

### رشد حجم sql.js
با رشد price_history/transactions: Worker serialize، debounce غیرمالی، و در آینده partition اختیاری history — v1 همان full blob با state machine بالا.

### Backup سلامت
Backup/Recovery **همیشه**:
```text
checksum match
+ PRAGMA integrity_check = 'ok'
+ schemaVersion سازگار یا migratable
+ required tables present
```
فقط checksum کافی نیست.

### Backup به‌عنوان قابلیت اصلی محصول
- Onboarding: الزام به درک backup
- Dashboard: وضعیت آخرین backup + CTA
- نه فقط مدفون در Settings

### ستون deprecated — قالب استاندارد
برای هر تغییر schema:
```text
deprecated column | canonical column | read: dual | write: canonical only | drop: major+N after migrate
```
ثبت در migration notes؛ اصل «داده حذف نشود» = no DROP بدون دوره سازگاری.

### Restore modes
| mode | رفتار |
|------|--------|
| `replace` | کل DB با backup پس از validate (پیش‌فرض ایمن) |
| `merge` | v2+؛ نیاز به strategy: skip/rename on UUID collision، operationId collision → reject یا remap |

v1: فقط **replace** پس از integrity_check. Merge بدون strategy مستند **ممنوع**.

### جدول `fin_operations` (Must)
```text
id, baseCurrencyAtOperation, businessDate, sourceFeature,
reversesOperationId?, conversionPath?,
status NOT NULL,
persistAttemptCount DEFAULT 0,
lastPersistErrorCode?,
lastPersistAttemptAt?,
createdAt
```
همراه `db_meta.pendingCommit` برای recovery بعد از crash بین SQL COMMIT و IDB swap — جزئیات `Canonical-Financial-Operation.md`.

---

## UI «ثبت شد» = فقط بعد از IndexedDB swap موفق (P0)

sql.js در RAM است. روی موبایل ضعیف یا kill شدن Tab، دادهٔ DIRTY ممکن است از بین برود.

```text
SQL COMMIT (RAM)  ≠  داده امن روی دیسک
UI «ثبت شد»      =  فقط پس از PERSISTED (swap IndexedDB موفق)
```

- نمایش موفقیت بعد از فقط COMMIT حافظه **ممنوع**
- timeout/خطای persist → FAILED + پیام خطا؛ نه تیک سبز گمراه‌کننده
