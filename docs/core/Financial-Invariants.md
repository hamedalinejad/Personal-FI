# Financial Invariants — ممنوعیت‌ها و الزامات (Must)

هر implementation که یکی از این‌ها را نقض کند **باگ بحرانی** است و قبل از release مالی قابل قبول نیست.

---

## 1. ممنوع: float / number برای مبالغ مالی

| الزام | جزئیات |
|--------|--------|
| ذخیره | TEXT decimal string |
| محاسبه | فقط `decimal.js` (یا معادل decimal) |
| ممنوع | `number` / IEEE float در Domain، Event payload مالی، Journal، API مبالغ |

Event Bus و TypeScript types مالی = **string**.

---

## 2. الزام: نرخ تبدیل در زمان تراکنش

| فیلد | نقش |
|------|-----|
| `exchangeRateToBase` | روی هر domain tx / journal / cash leg که ارز ≠ base است |
| `baseCurrencyAtOperation` | روی `fin_operations` قفل |
| `conversionPath` | Must اگر >1 hop |

**ممنوع:** گزارش تاریخی با نرخ «الان».  
`amountInBase` پس از persist **immutable**.

---

## 3. الزام: کارمزد جدا

| لایه | قرارداد |
|------|---------|
| Domain | feeAmount / breakdown / CanonicalFeeEvent |
| Cost basis | feeIn / feeFromProceeds / fee_burn جدا از قیمت خام |
| Journal | lineKind=`fee` + treatment مشخص |

**ممنوع:** پنهان کردن fee داخل price بدون ثبت قابل‌گزارش.  
بازده/P&L بدون fee = گزارش ناقص.

---

## 4. الزام: Journal دوطرفه متوازن

هر `runAtomicFinancialOperation`:

```text
Σ amountInBase(debit) = Σ amountInBase(credit)
برای همان operationId
```

بدون journal متوازن → **COMMIT ممنوع**.  
Reversal هم باید journal را void/معکوس کند.

---

## 5. الزام: دقت واحدهای کوچک (کریپتو و غیره)

| نوع | منبع precision |
|-----|----------------|
| Token qty | `asset.decimals` (مثلاً BTC 8، ETH تا 18 طبق registry) |
| پول | CurrencyRecord / Rounding-Policy |
| ممنوع | گرد کردن زودرس به 2 رقم برای crypto qty |

ذخیره quantity به‌صورت decimal string با precision دامنه.

---

## 6. الزام: نسخه‌بندی schema + Migration

| قانون | |
|--------|--|
| هر تغییر schema | `schemaVersion` + migration chain |
| ممنوع | DROP COLUMN / تغییر معنای فیلد بدون دوره سازگاری |
| Backup | schemaVersion + checksum + integrity_check قبل از restore |
| `fin_operations.engineVersions` | قفل فرمول‌های cost/rounding/fx/loan |

بدون migration plan → release ممنوع.

---

## 7. الزام: اعتبارسنجی ورودی

قبل از COMMIT حداقل:

```text
amount / quantity > 0 جایی که معنا دارد (مگر type صریح اجازه صفر/علامت بدهد)
fee >= 0
rate > 0 وقتی لازم است
price > 0 برای price_history
accountId / instrumentId معتبر
```

منفی بودن موجودی ناشی از bug → DB CHECK در حد ممکن + Domain reject.

---

## 8. الزام: همزمانی چند تب

| قانون v1 | |
|----------|--|
| Single-writer per `databaseId` | `navigator.locks` + BroadcastChannel |
| Tab غیر-writer | financial write → `WRITER_REQUIRED` |
| Conflict | version در `db_meta`؛ LWW خاموش ممنوع |
| Persist | فقط holder قفل |

چند دستگاه / cloud sync = **Out of Scope v1**؛ conflict resolution آن در v2 تعریف می‌شود.

---

## ارجاعات

- `Canonical-Financial-Operation.md`
- `core/db/*` (persist, journal, fixtures)
- `Rounding-Policy.md`
- `Product-Map-FA.md` فازبندی

---

## 9. Snapshot هرگز SoT گزارش نیست (بدون استثنا)

```text
Ledger / Journal  →  Calculation  →  Report
Snapshot = فقط cache optimization (اختیاری)
```

| منبع | مجاز در Report API؟ |
|------|---------------------|
| `fin_journal_lines` + domain ledger | **بله** (SoT) |
| `currentBalance`, `balanceAfterTransaction`, `remainingBalance`, holding qty snapshot, `port_snapshots` | **فقط** اگر همان عدد از calculation/rebuild تأیید شده باشد و به‌عنوان cache؛ **نه** به‌عنوان حقیقت مستقل |

**ممنوع:** `getFinancialReport` / Dashboard / Net Worth که مستقیم از snapshot بدون مسیر ledger بخواند.

Reconcile: expected همیشه از ledger؛ actual می‌تواند snapshot باشد تا drift پیدا شود.
