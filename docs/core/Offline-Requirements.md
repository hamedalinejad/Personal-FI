# الزامات Offline (P0)

سیستم بدون اینترنت **کاملاً قابل استفاده** است.

| # | قاعده |
|---|--------|
| 1 | دیتابیس محلی (sql.js → IndexedDB) |
| 2 | عملیات اصلی وابسته به API خارجی نیست |
| 3 | قیمت: دستی، CSV، فایل محلی |
| 4 | API آنلاین فقط از طریق **Adapter** اختیاری |
| 5 | قطع اینترنت مانع ثبت تراکنش نمی‌شود |
| 6 | داده‌های opt-in آنلاین در صف محلی (اگر sync آینده) |
| 7 | Backup دستی و (در صورت فعال) خودکار |
| 8 | Export: JSON، CSV، فرمت داخلی `.personalfi` |
| 9 | Restore روی سیستم جدید **آزمایش‌شده** |
| 10 | پیوست‌ها همراه Backup |
| 11 | DB و Backup قابل رمزنگاری |
| 12 | اطلاعات حساس در Log نوشته نشوند |
| 13 | License با توکن امضاشده محلی — نه اعتبارسنجی دائمی سرور |
| 14 | خاموشی ناگهانی → نیمه‌ثبت نشود (atomic + persist PERSISTED + WAL) |

## قیمت در Offline

Offline ≠ ساختن قیمت لحظه‌ای از هیچ.

قیمت نمایشی همیشه با:

- تاریخ / asOf / marketDate
- منبع (manual, csv, api, …)
- زمان آخرین به‌روزرسانی + stale در صورت نیاز

مرجع: Technical-Architecture · Persistence-State-Machine · Price-Fetching · License-Offline

## Optimistic UI (CROSS-CUTTING BATCH-4 §7)

Optimistic financial UI must show pending state and confirm only after durable persist ACK; on failure, UI rolls back. Final financial values before persist are forbidden.

## Rebuild offline (X-013)

Valuation/rebuild use local last-known or manual prices with stale flags. Airplane mode must allow transaction + rebuild.

