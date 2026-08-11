# ⚠️ این فایل منسوخ شده است (DEPRECATED)

> **این فایل دیگر معتبر نیست و نباید برای پیاده‌سازی استفاده شود.**

## جایگزین

تمام مستندات مربوط به دریافت و مدیریت قیمت رمزارزها به فیچر مرکزی **Price Fetching** منتقل شده‌اند:

- **مستند اصلی:** [`docs/features/19-Price-Fetching/Price-Fetching.md`](../../19-Price-Fetching/Price-Fetching.md)
- **زیرفیچر کریپتو:** [`docs/features/19-Price-Fetching/19-01-Crypto-Prices/Crypto-Prices.md`](../../19-Price-Fetching/19-01-Crypto-Prices/Crypto-Prices.md)

## جداول معتبر

| جدول قدیمی (این فایل) | جدول معتبر (فیچر ۱۹) |
|-----------------------|----------------------|
| `inv_crypto_price_history` | `price_history` |
| `inv_crypto_price_sources` | `price_sources` |
| `inv_crypto_price_cache` | (حذف شد — cache درون `price_history` مدیریت می‌شود) |

## دلیل تغییر

فیچر Price Fetching (شماره ۱۹) یک معماری یکپارچه برای دریافت قیمت **همه** دارایی‌ها (کریپتو، سهام ایران، صندوق‌ها، فلزات) ارائه می‌دهد.  
ساختن جدول‌های جدا برای هر دسته دارایی باعث تکرار کد و ناسازگاری می‌شد.

---

*این فایل فقط برای رفرنس تاریخی نگهداری شده است.*
