# Financial Invariants — ممنوعیت‌ها و الزامات (Must)

هر implementation که یکی از این‌ها را نقض کند **باگ بحرانی** است و قبل از release مالی قابل قبول نیست.

---

## 1. ممنوع: float / number برای مبالغ مالی

**این تصمیم قفل است و تغییر نمی‌کند** (BTC, ETH, سهام, units, طلا, نرخ, fee).

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

---

## 10. Price Fetching کاملاً secondary است

```text
Transaction  →  واقعیت تاریخی (SoT معامله)
Price Provider → فقط Valuation / نمایش پرتفوی
```

### No external price dependency for transaction correctness

| عمل | نیاز به اینترنت / Price API؟ |
|-----|------------------------------|
| ثبت BUY/SELL/انتقال/قسط/درآمد/هزینه | **خیر** — همیشه مجاز آفلاین |
| صحت ledger / journal / cost basis معامله | فقط فیلدهای همان tx (price، qty، fee، rates ذخیره‌شده) |
| Portfolio valuation / Unrealized | `price_history` محلی: last known یا manual؛ برچسب stale |

**ممنوع:**
- block کردن `runAtomicFinancialOperation` به‌خاطر down بودن API قیمت
- محاسبه correctness معامله با قیمت زنده provider به‌جای قیمت ثبت‌شده در tx
- Historical P&L با rate/price «امروز» به‌جای as-of معامله

کاربر در فرم معامله **قیمت را وارد یا از suggestion اختیاری** می‌گیرد؛ پس از ثبت، آن قیمت بخشی از تاریخچه است.

---

## 11. مدل تاریخ‌ها حفظ شود

تفکیک زیر **باید بماند** (به‌ویژه ایران):

`createdAt` · `eventAt` · `businessDate` · `settlementDate` · `marketDate` · `dueDate` · `paymentDate` · `fetchedAt`

**Invariant:** `businessDate ≠ createdAt` ممکن و عادی است؛ گزارش کسب‌وکار روی businessDate/settlementDate است نه فقط UTC create.

---

## 12. Repair هرگز مخفی نیست

```text
Detect inconsistency
  → Show (UI)
  → Explain (expected vs actual)
  → User explicitly approves
  → Audit (fin_audit_log)
  → Repair (rebuild/repair API)
```

**ممنوع:** اصلاح بی‌سروصدای `currentBalance` / holding / remainingBalance در پس‌زمینه.

Reconcile می‌تواند **read-only** drift را گزارش کند؛ repair فقط با flag/API صریح کاربر.

---

## 13. Accounting در برابر Investment

```text
Accounting (Journal + fin_accounts)  = System of Financial Truth میان‌فیچری
Investment / Loan / Income…        = Specialized Subledger
```

خرید BTC نمونه:

```text
Crypto subledger + Cash + Cost basis + Journal
همه با یک operationId
```

Investment «جدا از حسابداری» به‌معنای دو حقیقت موازی **نیست**.

---

## 14. تراکنش مالی Immutable — اصلاح فقط با Reversal

```text
Original Operation
       ↓
Reversal Operation   (void + inverse journal/domain)
       ↓
Corrected Operation  (در صورت نیاز، operation جدید)
```

| عمل | مجاز؟ |
|-----|--------|
| `UPDATE` مبلغ / quantity / fee مالی | **خیر** |
| «ویرایش تراکنش مالی» در UI به‌معنای overwrite | **خیر** |
| Correction / Reversal / correctX API | **بله** |
| ویرایش metadata غیرمالی (توضیح، category، label، پیوست) | **بله** اگر به ledger/journal/amount دست نزند |

همه Featureها (Income، Expense، Crypto، …) یکسان: **اصلاح** نه **ویرایش مالی**.

---

## 15. Raw Facts در برابر Derived

جزئیات: `docs/core/Raw-vs-Derived-Data.md`.

- **Raw** از بین نمی‌رود و SoT تاریخچه است  
- **Derived** همیشه قابل rebuild است و SoT مستقل نیست  
- در اختلاف snapshot و ledger: **ledger برنده است**

---

## 16. IRR ≠ دو ارز؛ Toman فقط نمایش

| لایه | |
|------|--|
| **Currency code در DB** | فقط `IRR` |
| **UI unit** | `rial` \| `toman` (ترجیح کاربر) |
| تبدیل نمایش | `1 Toman = 10 Rial` |

**ممنوع:** `TOM` / `IRT` به‌عنوان currency مستقل در ledger که با IRR موازی شود.

تاریخ‌ها (حفظ): Jalali نمایش · Gregorian/UTC ذخیره · businessDate / settlementDate / marketDate / dueDate جدا.

---

## 17. Local-First (نه فقط Offline UI)

```text
Internet = Enhancement
Internet ≠ Dependency
```

بدون شبکه باید کار کند: Accounts, Transactions, Accounting, Loans, Investments (ثبت), Reports, Backup, Restore.

Price API فقط valuation را تازه می‌کند؛ قطعی بودن ledger به آن وابسته نیست.

### Portfolio بدون اینترنت

```text
Portfolio ≠ broken
→ آخرین price_history معتبر + برچسب «آخرین قیمت: تاریخ…»
→ isStale
```

محاسبه fail به‌خاطر نبود API **ممنوع**.

---

## 18. Tax جدا از price/fee خام معامله

```text
Gross proceeds − cost basis − fees  →  realized gain
taxable gain (طبق قانون) → Tax Event مستقل (tax_events)
```

**ممنوع:** گم شدن مالیات داخل فیلد price یا یکی‌گرفتن feeTax با کل tax liability بدون `tax_events`.

Feature فقط mapping؛ SoT مالیات = tax domain.

**قفل:** `reconcile ≠ repair` — repair فقط پس از تأیید کاربر + audit.

Field-level kinds: `Field-Level-SoT.md` (RAW/DERIVED/SNAPSHOT/EXTERNAL_REPORTED).
