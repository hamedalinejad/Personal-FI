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
