Technical Architecture Document
نام پروژه: Personal Finance & Investment Management System
نوع سند: Technical Architecture
نسخه: 1.0.0
تاریخ: ۱۴۰۵/۰۴/۲۳
۱. اهداف معماری

Offline-First کامل
Privacy-First (تمام داده‌ها محلی بمانند)
ماژولار و قابل گسترش
عملکرد بالا حتی با حجم بالای داده (ده‌ها هزار تراکنش)
قابلیت تبدیل آسان به اپ موبایل و دسکتاپ
نگهداری و توسعه آسان در بلندمدت

۲. پایه دیتابیس

نسخه اول پروژه از **SQLite** با کتابخانه **sql.js** استفاده می‌کند.

```text
SQLite (WASM)

↓

sql.js

↓

IndexedDB
```

### دلایل انتخاب SQLite:

| ویژگی | پشتیبانی |
|-------|---------|
| **Foreign Keys** | ✅ پشتیبانی رسمی |
| **Transactions** | ✅ اتمیک و قابل بازگشت |
| **Views** | ✅ ساخت نمای پیچیده |
| **Indexes** | ✅ سرعت بالای جستجو |
| **SQL Standard** | ✅ استاندارد و شناخته شده |
| **Migrations** | ✅ ابزارهای قدرتمند |
| **Backup/Restore** | ✅ ساده (کپی فایل) |
| **Cloud Sync Ready** | ✅ آماده برای همگام‌سازی آینده |

### نکات فنی:

- تمام محاسبات مالی باید با decimal.js انجام شوند
- تمام مبالغ باید به کوچک‌ترین واحد پول ذخیره شوند (Minor Unit Storage)
- تراکنش‌ها تغییرناپذیر هستند - برای اصلاح تراکنش جدید ایجاد شود
- تمام تاریخ‌ها باید به صورت UTC ذخیره شوند

### سازگاری PWA و موبایل آفلاین (الزامی)

sql.js دیتابیس را در حافظه نگه می‌دارد و اتصال افزایشی به IndexedDB ندارد؛ برای اجرای پایدار به‌عنوان PWA نصب‌شده روی موبایل، موارد زیر **الزامی** است (جزئیات کامل در `core/db/db.md`):

- نوشتن دیتابیس با الگوی **Write-to-temp-then-swap** انجام شود تا خرابی فایل در صورت قطع ناگهانی (رفتن اپ به پس‌زمینه) رخ ندهد.
- نوشتن‌ها Debounce شوند و روی رویداد `visibilitychange`/`beforeunload` یک flush اجباری انجام شود.
- در اولین اجرا `navigator.storage.persist()` فراخوانی شود تا مرورگر (خصوصاً Safari/iOS) داده‌ها را در کمبود فضا حذف نکند.
- **Service Worker** برای Cache کردن App Shell و فایل WASM سنگین sql.js الزامی است (بدون آن، اپ نصب‌شده روی موبایل بدون اینترنت لود نمی‌شود).
- **Web App Manifest** (`manifest.json`) با آیکون، `display: standalone` و `start_url` باید تعریف شود.
- یادآوری پشتیبان‌گیری دوره‌ای (Export فایل SQLite) در Dashboard نمایش داده شود، چون ماندگاری IndexedDB روی موبایل تضمین‌شده نیست.
- مسیر ارتقای آینده در صورت رشد حجم داده: **wa-sqlite با OPFS**.


۳. ساختار پوشه‌بندی پروژه (Folder Structure)

```bash
src/
├── core/                  # هسته مشترک
│   ├── utils/             # Utilities (تاریخ شمسی، فرمت اعداد و ...)
│   ├── hooks/             # Hookهای مشترک
│   ├── services/          # سرویس‌های پایه (Currency, Event Bus و ...)
│   └── types/             # TypeScript Types مشترک
│
├── features/              # هر فیچر به صورت مستقل
│   ├── accounts/
│   ├── income/
│   ├── expense/
│   ├── cheque/
│   ├── debt-loan/
│   ├── investment/
│   ├── physical-assets/
│   ├── budget/
│   ├── goals/
│   ├── bills/
│   └── settings/
│
├── components/            # کامپوننت‌های UI مشترک
├── lib/                   # کتابخانه‌های کمکی
├── db/                    # تنظیمات دیتابیس (sql.js + SQLite)
│   ├── db.ts              # اتصال به دیتابیس
│   ├── schema.sql         # تعریف جداول با SQL
│   ├── models.ts          # TypeScript types
│   ├── migrations.ts      # مدیریت مایگRATION‌ها
│   └── queries/           # کوئری‌های SQL
├── stores/                # Zustand stores
├── api/                   # Internal API بین فیچرها
├── assets/
├── styles/
public/
├── manifest.json          # Web App Manifest (نصب PWA روی موبایل)
├── sw.ts                  # Service Worker (Cache App Shell + WASM sql.js)
└── icons/                 # آیکون‌های PWA
```