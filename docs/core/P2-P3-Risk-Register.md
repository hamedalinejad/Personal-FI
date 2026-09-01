# P2 / P3 Risk Register

## P2 — کیفیت محصول و ایران‌پسندی (بعد از هسته مالی، قبل از polish نهایی)

| # | ریسک | اثر | وضعیت | سند کنترل | قانون |
|---|------|-----|--------|-----------|--------|
| 1 | نبود Import Preview | ورود داده خراب | ✅ / تقویت | Import-Infrastructure | Preview → Validation → Commit؛ بدون commit خودکار |
| 2 | نبود Backup/Restore تست‌شده | از دست رفتن داده | ✅ | db/06-migration-backup | Backup رمزدار `.personalfi` + Restore با integrity + **تست CI** |
| 3 | نبود مدیریت Attachments | از دست رفتن سند | ✅ / تقویت | Document-Management | فایل مستقل + contentHash + metadata |
| 4 | عدم پشتیبانی جلالی | مشکل ایران | ✅ | types · iran | ذخیره ISO UTC؛ نمایش جلالی |
| 5 | نبود نرمال‌سازی اعداد فارسی | خطای ورود | ✅ **قفل** | iran · types | Parser ارقام فارسی/عربی → ASCII قبل از decimal |
| 6 | وابستگی به API آنلاین | نقض offline | ✅ | Price-Fetching · Technical-Arch | Adapter اختیاری؛ manual/csv کافی |
| 7 | قیمت بدون تاریخ و منبع | ارزش‌گذاری ضعیف | ✅ | Price-Fetching | Price point: asOf/marketDate + source + instrumentId |
| 8 | نبود ثبت خطای API | عیب‌یابی دشوار | ✅ **قفل** | Feature-API · types | errorCode + correlationId/operationId |

## P3 — مقیاس و محصول تجاری (عمداً دیرتر)

| # | ریسک | اثر | وضعیت | سند کنترل | قانون |
|---|------|-----|--------|-----------|--------|
| 1 | گزارش متکی به Cache کهنه | گزارش قدیمی | ✅ / تقویت | Reports · Rebuild | rebuild + نمایش `lastRebuiltAt` / stale |
| 2 | نبود سطح دسترسی آینده | نسخه تجاری | ✅ **قفل** | License-Offline | Workspace / Role / License جدا از ledger |
| 3 | اتصال مستقیم License به سرور | شکست offline | ✅ | License-Offline | Token/فایل امضاشده محلی؛ سرور فقط activation |

P2 را می‌توان پس از P0/P1 هسته شروع کرد. P3 نباید هسته مالی را بلوکه کند.
