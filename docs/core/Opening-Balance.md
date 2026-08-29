# Opening Balance / Opening Position (Must Have سراسری)

کاربر امروز نصب می‌کند؛ مجبور نیست ۵ سال history وارد کند.

## قرارداد واحد

همه این‌ها از **`recordOpeningPosition` / `runAtomicFinancialOperation`** با `kind: opening_position` عبور می‌کنند — نه BUY/SELL جعلی.

| دارایی | ورودی کاربر | Journal (ساده) |
|--------|-------------|----------------|
| بانک / نقد | موجودی + ارز | Dr bank `fin_accounts` / Cr `opening_equity` |
| Crypto / Stock / FIF / Metal | qty + cost basis + asOf | Dr asset account / Cr `opening_equity` (یا income طبق gift policy) |
| وام بدهی | remaining principal | Dr `opening_equity` / Cr loan liability |
| طلب / وام پرداختی به دیگران | | Dr receivable / Cr `opening_equity` |

- `businessDate` / `asOf` = تاریخ مؤثر موجودی اولیه  
- `createdAt` = زمان ثبت در سیستم  
- Domain row با `type=opening_position` (یا معادل) در sub-ledger مربوط  
- جزئیات economicKind: `Canonical-Financial-Operation.md`

**MVP v1.0:** حداقل bank cash + loan remaining + یک opening crypto/stock در صورت فعال بودن آن فاز.

## Onboarding UX

گام اختیاری «موجودی اولیه» بعد از ساخت حساب‌ها — بدون block کردن استفاده روزانه اگر رد شود (موجودی صفر).
