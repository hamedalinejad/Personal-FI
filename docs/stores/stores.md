stores/ — مدیریت State با Zustand
این پوشه شامل Storeهای سراسری و مشترک است.
ساختار پیشنهادی
Bashstores/
├── useAppStore.ts           # تنظیمات عمومی اپ (تم، زبان و ...)
├── useAccountStore.ts       # State مرتبط با حساب‌ها (در صورت نیاز سراسری)
├── useCurrencyStore.ts      # نرخ ارز و ارز پایه
├── useUiStore.ts            # State رابط کاربری (سایدبار، مودال و ...)
└── index.ts
چه چیزهایی داخل Store بروند؟

























مناسب برای Storeنامناسب برای Storeتنظیمات سراسری اپداده سنگین و لیست‌های بزرگ دیتابیسState مربوط به UI سراسریمنطق پیچیده کسب‌وکارنرخ ارز جاریداده‌هایی که فقط یک صفحه لازم داردوضعیت آنلاین/آفلاینکش گزارش‌های سنگین
قوانین

Store نباید جایگزین دیتابیس شود.
داده اصلی مالی در db بماند؛ Store فقط State لازم برای UI و تنظیمات را نگه دارد.
Storeها را کوچک و مشخص نگه دارید (نه یک Store غول‌پیکر).
در صورت نیاز، Persist برای تنظیمات (زبان، تم) فعال شود.

نمونه مسئولیت Storeها

useAppStore → language, theme, baseCurrency
useCurrencyStore → rates, lastUpdated, convert()
useUiStore → sidebarOpen, activeModal, globalLoading