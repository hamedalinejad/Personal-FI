# License Domain (خارج از Accounting — Offline-first)

## مرز

```text
Personal-FI Core
       │
License Manager
       │
License File (signed, local)
```

```text
Application
  → License Validator (محلی)
  → در صورت مجاز: باز کردن Database File کاربر
  → All financial data داخل SQLite آن کاربر
```

- **یک SQLite per user/tenant** — بدون `userId`/`tenantId` روی هر ردیف مالی
- License **هرگز** داخل جداول حسابداری/تراکنش embed نمی‌شود
- شکست license ≠ invalidate کردن history مالی روی دیسک

## License Verification = کاملاً Local (P0)

کاربر برای استفاده روزمره **نیاز به اینترنت ندارد**.

```text
license.json (یا معادل باینری امضاشده)
  signature
  product
  edition
  features[]
  expiry
  deviceBinding?
```

| فیلد | نقش |
|------|-----|
| `licenseId` | شناسه |
| `productId` | Personal-FI |
| `edition` | free / pro / investor / loan / accounting / … |
| `features[]` | مثلاً `loans`, `funds`, `crypto` |
| `issuedAt` / `expiresAt` | |
| `deviceBinding?` | اختیاری |
| `customerId?` | |
| `signature` | امضا با private key سرور؛ verify با public key داخل اپ |

- **Private key هیچ‌وقت داخل برنامه نیست**
- Verify = cryptographic local فقط
- Server فقط برای: **activation · renewal · analytics · support** (opt-in)
- Startup روزمره → **بدون** تماس سرور

**Invariant:** License آینده نباید Core را آنلاین کند.

## Edition System (P0)

همان Core برای همه؛ تفاوت فقط در feature flags و UI:

| Edition (نمونه) | UI فعال (نمونه) | Accounting Core |
|-----------------|-----------------|-----------------|
| Personal-FI Free | Accounts پایه + Transactions | بله (پشت‌صحنه) |
| Personal-FI Pro | + Reports پیشرفته | بله |
| Personal-FI Investor | Crypto / Stocks / Funds / Metals | بله |
| Personal-FI Loan | Loans + Reports | بله |
| Personal-FI Accounting | + Accounting UI (CoA, Journal browser) | بله + UI |

```json
{
  "edition": "investor",
  "features": ["loans", "funds", "crypto"],
  "accountingUi": false
}
```

`Accounting UI = disabled` ≠ خاموش بودن journal.  
Accounting Core همیشه برای صحت مالی وجود دارد.

## Standalone Module (Edition محدود)

```text
فقط وام:
  Core + Loans + Reports

فقط صندوق:
  Core + Funds + Reports

فقط Crypto:
  Core + Crypto + Reports

کامل:
  Core + Accounts + Income + Expense + Loans + Crypto + Stocks + Funds + Metals + Planning + …
```

Featureها **optional** هستند؛ **Financial Integrity Core همیشه یکی است**.

اتصال نقدی: `CashSettlementPort` → LocalSettlement یا Accounts (طبق edition).

## مرز قطعی

```text
User Financial DB  ≠  License State
```

- License در store جدا (نه جدول داخل SQLite مالی)
- اعتبارسنجی روزمره بدون اینترنت
- انقضا → حداکثر Feature disable / Read-only — **نه** wipe یا قفل نابودکننده DB
- Export/Backup همیشه ممکن

**ممنوع:** `licenseId` روی journal line یا financial transaction.

Domain: این سند؛ implementation در `license/` نه داخل Featureهای مالی.

---

## Product / Capabilities layers (مستند آینده — نه implementation الان)

```text
Product: Free | Personal | Professional | Custom
  └── Capabilities: loan.basic, loan.advanced, investment.crypto, …
```

License Module فقط می‌گوید:

```json
{
  "enabledFeatures": { "loan": true, "crypto": false, "funds": true },
  "edition": "personal",
  "licenseState": "active",
  "expiry": "...",
  "gracePeriod": "..."
}
```

**Loan Domain هیچ چیز از License نمی‌داند.**  
Application لایه feature flags را اعمال می‌کند.

---

## آمادگی آینده بدون آلوده کردن Journal به License (P0)

**همچنان:** `licenseId` روی journal line یا تراکنش مالی **ممنوع**.

برای چند پروفایل محلی / migration آینده بدون wipe:

| مکان | فیلد |
|------|------|
| اختیاری در ردیف‌های دامنه | `owner_id` پیش‌فرض `'default'` (پروفایل منطقی داخل همان فایل DB) |
| جدا از DB مالی | جدول/فایل `licenses` : `{ id, features[], signature, edition, expiry }` |

چک entitlement فقط در **Capability-API / Application** (مثلاً JWT یا فایل امضاشده آفلاین)، نه داخل Loan Domain.

اگر `owner_id` اضافه می‌شود: add-column با default — نه embed کردن features لایسنس داخل ledger.

---

## Workspace / Role / License (P3 — آینده تجاری)

لایه‌های دسترسی **خارج از ledger**:

```text
Workspace (مثلاً یک فایل DB یا پروفایل)
  └── Role (owner / viewer / …)   // وقتی multi-user شد
License Token (امضاشده محلی)
  └── features / edition / expiry
```

- Domain مالی Role/License را import نمی‌کند
- Application قبل از نشان دادن UI/Command، entitlement را چک می‌کند
- **بدون** تماس سرور برای استفاده روزمره (token محلی)

---

## DATA ACCESS ≠ FEATURE ACCESS (P0 تجاری)

```text
DATA ACCESS     = مستقل از LICENSE  (خواندن/export تاریخچه همیشه)
FEATURE ACCESS  = وابسته به LICENSE / capability gates
```

Expired license → داده inaccessible **نمی‌شود**؛ حداکثر featureهای جدید محدود.

مشخص کن: expiry behavior · grace · clock tampering policy · restore other device · offline activation.

Capability Gate در Application/UI:

`loan.basic` · `loan.advanced` · `crypto.basic` · …

**نه** داخل Core Ledger: `if premium: calculate...`

فقط Loan license → سیستم سالم بدون dependency اجباری به Investment.
