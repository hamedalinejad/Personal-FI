# JSON Policy for Financial Data (P0)

JSON برای این‌ها **مجاز** است:

- metadata
- provider payload / external response خام
- user custom settings
- engineVersions / conversionPath (ساختار مشخص)
- rule payloadهای versioned (IranCore)

JSON برای این‌ها **منبع اصلی (canonical) نیست** و نباید جایگزین ستون‌های typed شود:

| ممنوع به‌عنوان SoT در JSON | دلیل |
|---------------------------|------|
| Fee Tiers (اصلی) | query / validation سخت |
| Quantity / Money / Price | integrity و decimal |
| Loan Schedule کامل | reconcile و versioning |
| Cost Basis state اصلی | rebuild و audit |

**قانون:** مقادیر پولی و مقداری در ستون‌های typed (TEXT decimal string + currency) ذخیره می‌شوند.  
JSON فقط مکمل است، نه ledger پنهان.

اگر tierها در JSON بودند و جدول `ln_loan_fee_tiers` وجود دارد → **جدول typed SoT است**؛ JSON legacy/import فقط.

---

## MoneyString و JSON (P0) — جلوگیری از Number

پول همیشه **decimal string** است. `JSON.stringify` / `JSON.parse` به‌تنهایی کافی نیست؛ هر `Number()` روی مسیر مالی کریپتو/وام را خراب می‌کند.

### قوانین

1. **ممنوع:** `z.number()` / `number` type برای amount, price, qty, rate, fee, balance
2. **الزامی:** branded type مثلاً `MoneyString` / `DecimalString` در `core/types`
3. Zod: `z.string().regex(/^-?\d+(\.\d+)?$/)` یا schema اختصاصی Money
4. **reviver** برای import/export JSON: همه کلیدهای پولی → string + parse با decimal.js
5. بعد از `JSON.parse` بدون reviver، قبل از Domain باید **re-hydrate** به decimal.js انجام شود

```text
wire/JSON  →  string
Domain     →  decimal.js
DB         →  TEXT
```
