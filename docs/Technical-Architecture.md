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


۳. ساختار پوشه‌بندی پروژه (Folder Structure)
Bashsrc/
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
├── db/                    # تنظیمات دیتابیس (Dexie/RxDB schemas)
├── stores/                # Zustand stores
├── api/                   # Internal API بین فیچرها
├── assets/
└── styles/