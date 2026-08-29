# 06 migration backup audit

## قرارداد Migration

مستندات به‌تنهایی migration را enforce نمی‌کند. در implementation این‌ها الزامی‌اند:

### جدول `schema_version`
- تک‌ردیفی یا key-value: `version INTEGER NOT NULL`, `appliedAt`
- هر تغییر schema = یک فایل migration شماره‌دار در `db/migrations/`

### جریان Startup
```text
open DB from IndexedDB
→ read schema_version
→ if version < app.expectedVersion → run migrations in order inside SQLite TRANSACTION
→ each migration idempotent یا با ثبت version فقط بعد از موفقیت
→ persist (temp-then-swap)
→ app ready
```

### قوانین
1. بدون `schema_version` معتبر، اپ نباید بنویسد (یا نسخه ۰ فرض و migration از ابتدا).
2. Migration شکست → اپ در حالت safe mode؛ overwrite روی DB اصلی نکند.
3. Backup باید `schemaVersion` را در متادیتا نگه دارد.
4. تا قبل از implementation واقعی `migrations.ts`، این بخش «قرارداد لازم‌الاجرا» است نه «انجام‌شده».

---

## قرارداد Backup / Restore

### Export (Backup)
فایل backup حداقل شامل:
- بایت‌های SQLite (یا archive)
- متادیتا JSON: `schemaVersion`, `appVersion`, `exportedAt`, `checksum` (مثلاً SHA-256 از بایت DB), `tableCounts` اختیاری

### Restore — Data Integrity Contract (قبل از پذیرش)
ترتیب اجباری؛ هر شکست → **abort بدون دست زدن به DB فعلی**:

```text
1. خواندن فایل + متادیتا
2. checksum match
3. schemaVersion خوانده/قابل‌فهم بودن (≤ app version یا migration-path موجود)
4. load در DB موقت (حافظه / کلید IndexedDB جدا: db_restore_temp)
5. PRAGMA integrity_check = ok
6. PRAGMA foreign_key_check خالی
7. وجود جداول ضروری (لیست سفید از schema)
8. اجرای migration روی temp تا رسیدن به version فعلی اپ (اگر لازم)
9. فقط پس از موفقیت همه مراحل → atomic swap: db_restore_temp جایگزین db_main
10. دور انداختن temp؛ UI موفقیت
```

### Atomic Restore
- DB قبلی تا لحظه swap نهایی دست‌نخورده می‌ماند.
- اگر هر مرحله از ۱–۸ شکست بخورد، کاربر همان داده قبلی را دارد.
- Restore نصفه هرگز `db_main` را overwrite نمی‌کند.

---

## قرارداد Audit Trail مالی

Immutable transaction کافی نیست؛ برای عملیات حساس باید ردپای عملیاتی مشخص باشد (آینده multi-user / license).

### فیلدهای مشترک Audit (روی جداول تراکنش مالی و عملیات حساس)

| فیلد | الزام v1 | توضیح |
|------|----------|--------|
| `createdAt` | بله | از قبل |
| `createdBy` | بله (nullable در single-user) | شناسه کاربر منطقی؛ در v1 می‌تواند `'local'` یا null |
| `operationId` | بله | UUID یکسان برای همه ردیف‌های یک `runAtomicFinancialOperation` |
| `reversalOf` / `relatedTransactionId` | بله وقتی reversal | لینک به عملیات/تراکنش اصلی |
| `source` | بله | `ui` \| `import` \| `system` \| `migration` \| `api` |
| `reason` | برای void/reversal/repair | متن کوتاه دلیل |

### جدول `fin_audit_log` (**Must Have**)

```text
id, operationId, action, entityTable, entityId,
actorId, source, reason, payloadSummary, createdAt
```

- برای تغییر وضعیت‌های حساس (void، restore، repair reconcile، تغییر تنظیمات امنیتی)
- payload کامل اسرار (API key) هرگز در audit ذخیره نشود

### قوانین
1. هر atomic financial op یک `operationId` مشترک روی تمام ردیف‌های نوشته‌شده در همان COMMIT دارد.
2. Reversal باید `reversalOf` / `relatedTransactionId` پر کند.
3. Import انبوه `source='import'` می‌گیرد.
4. حذف فیزیکی ردیف audit ممنوع.

---

## قرارداد Snapshot در برابر Ledger

| لایه | نقش | mutable؟ |
|------|-----|----------|
| Ledger (`*_transactions`, `acc_transactions`) | منبع حقیقت رویدادها | append-only / void+reversal |
| Snapshot (holding quantity, cashBalance, currentBalance, totalInvested, averages, remaining loan, …) | کش مشتق برای سرعت | mutable ولی **فقط** از مسیر atomic رسمی |

### قوانین
1. **Ledger authoritative است**؛ Snapshot هرگز منبع حقیقت برای Repair نیست (هم‌راستا با ).
2. هر Feature که Snapshot دارد باید `rebuildXFromLedger(id)` داشته باشد (یا از helper مشترک).
3. `runAtomicFinancialOperation` باید در یک COMMIT هم ledger و هم snapshot را بنویسد؛ به‌روزرسانی snapshot بیرون از آن مسیر ممنوع است.
4. بعد از کشف اختلاف reconcile: فقط **Repair صریح** (`rebuild*FromLedger` با تأیید کاربر) snapshot را اصلاح می‌کند — نه نوشتن معکوس از snapshot روی ledger.
5. لیست حداقل rebuildها: Account balance، Crypto/Stock/FIF/Metals holdings، Brokerage/Platform cash، Loan remaining.

```text
Ledger correct + Snapshot wrong → rebuild snapshot from ledger
Ledger wrong → reversal/corrective transactions (never silent snapshot edit as truth)
```

### الگوی عمومی اصلاح تراکنش دولایه (Two-Layer Atomic Correction)

هر فیچری که جدول اختصاصی تراکنش دارد (`inc_transactions`، `exp_transactions`، `chk_cheques`، ...) **و** این تراکنش‌ها در `acc_transactions` هم ثبت می‌شوند، باید برای اصلاح/حذف از این الگو پیروی کند — نه فقط از یک لایه:

```
BEGIN TRANSACTION;

── لایه ۱: جدول اختصاصی فیچر ──────────────────────────────────────
 feature_table[id].isVoided = true -- علامت‌گذاری رکورد قدیمی
 INSERT new_feature_row (data_corrected, reversedId=id, ...) -- رکورد جدید

── لایه ۲: acc_transactions ────────────────────────────────────────
 acc_transactions[accountTransactionId].isVoided = true -- void تراکنش اصلی
 INSERT reversal_acc_tx (type=reversal, amount=-original) -- معکوس موجودی
 INSERT new_acc_tx (type=original_type, amount=corrected) -- تراکنش صحیح جدید

COMMIT;
```

> **قانون فیلتر گزارش‌گیری**: هر API که از جدول اختصاصی فیچر جمع می‌زند (`getTotalIncome`، `getTotalExpense`، ...) **باید** `WHERE isVoided = false` داشته باشد. در غیر این صورت رکورد void‌شده و رکورد جدید هر دو در جمع می‌آیند و نتیجه غلط می‌شود.
>
> **فیلد `isVoided`**: باید در جدول اختصاصی هر فیچر (نه فقط `acc_transactions`) وجود داشته باشد — این الزامی است، نه اختیاری.

---

## Multi-Tab Concurrency

**v1 invariant (Critical):** `Only one active writer per databaseId`.

سایر Tabها: **read-only** یا blocked برای financial write تا writer آزاد شود.


sql.js در هر Tab یک کپی در RAM دارد. بدون هماهنگی، Last-Write-Wins می‌تواند تراکنش Tab دیگر را در IndexedDB overwrite کند.

### قرارداد نسخه ۱
1. **Single-Writer lock** با `navigator.locks` (در صورت پشتیبانی) روی نام `personal-fi-db-writer`.
2. قبل از persist: خواندن `db_meta.version` از IndexedDB؛ اگر با version حافظه یکی نبود → **Conflict** — UI: «داده از Tab دیگر تازه‌تر است؛ Reload».
3. بعد از swap موفق: `version++` در meta.
4. اگر `navigator.locks` نبود: هشدار در UI وقتی چند Tab تشخیص داده شد (`BroadcastChannel('personal-fi')` heartbeat) + توصیه به یک Tab.
5. عملیات مالی در Tab غیر-holder قفل: صف یا reject با پیام واضح — نه silent LWW.

v1 عمداً multi-active-writer کامل نیست؛ هدف جلوگیری از از دست رفتن commit بدون اطلاع کاربر است.

### جزئیات Writer ownership
```text
databaseId در db_meta
writerTabId + heartbeat via BroadcastChannel('personal-fi')
navigator.locks.request('personal-fi-db-writer-' + databaseId)
```
- Tab غیر-writer: `runAtomicFinancialOperation` → reject `WRITER_REQUIRED`
- Stale writer (heartbeat timeout): election Tab جدید
- Persist فقط توسط holder قفل
- دو Tab هرگز دو serialize موازی روی همان databaseId انجام نمی‌دهند


---

## Backup Package و Restore Migration-Aware

### فایل Backup (نه فقط raw SQLite)
```text
{
  format: 'personal-fi-backup',
  schemaVersion: number,
  appVersion: string,
  databaseId: string,
  createdAt: ISO,
  checksum: string,  // of sqliteBlob
  sqliteBlob: ...    // or separate file + sidecar JSON
}
```
بدون schemaVersion + checksum → در v1 به‌عنوان backup کامل **رد** می‌شود.

### Restore pipeline (اجباری)
```text
1. parse package + checksum match
2. load into TEMP sql.js instance (نه db_main)
3. PRAGMA integrity_check / quick_check
4. verify required tables + foreign_keys
5. if backup.schemaVersion < app.schemaVersion → run migration chain on TEMP
6. re-verify integrity + schemaVersion == app
7. serialize TEMP → persist slots (backup current main first) → swap
8. fin_audit_log restore event
```
اگر migration fail → TEMP دور انداخته می‌شود؛ `db_main` قبلی سالم می‌ماند.

`beforeunload` هرگز مسیر اصلی save نیست و جایگزین pipeline بالا نمی‌شود.

---

## Backward Compatibility Contract (حفظ داده)

1. **ممنوع** در migration تولیدی: `DROP COLUMN` روی داده مالی بدون دوره deprecate + export اجباری.
2. **ممنوع**: تغییر معنای semantic یک ستون موجود (مثلاً `amount` از gross به net) بدون ستون جدید و backfill.
3. افزودن ستون: nullable یا default امن؛ داده قدیمی معتبر می‌ماند.
4. Rename: ستون جدید + کپی + خواندن dual-write در یک نسخه؛ حذف قدیمی فقط در major بعدی پس از migrate همه backupها.
5. اصل محصول: **هیچ فیلد تاریخی از بین نرود** — legacy fee بدون breakdown حفظ می‌شود (الگوی سهام).

---

---

## فرمت رسمی Backup: `.personalfi`

First-class product artifact (نه فقط «Export SQLite» خام).

```text
archive.personalfi  (zip یا container معادل)
  manifest.json
  database.sqlite
  checksums.json      // sha256 of sqlite + manifest
  optional/
    encrypted.payload // اگر کاربر رمز گذاشت
```

### `manifest.json` (حداقلی)

```json
{
  "format": "personalfi-backup",
  "formatVersion": 1,
  "schemaVersion": 12,
  "appVersion": "1.0.0",
  "databaseId": "uuid",
  "createdAt": "ISO-UTC",
  "baseCurrencyAtExport": "IRR"
}
```

Restore: validate manifest + checksum → temp DB → integrity_check → FK → migrate → swap.  
Support/migration/license recovery همگی روی همین فرمت سوار می‌شوند.
