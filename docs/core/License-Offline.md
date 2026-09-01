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
