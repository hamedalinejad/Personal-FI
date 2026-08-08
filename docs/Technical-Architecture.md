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
└── styles/
```