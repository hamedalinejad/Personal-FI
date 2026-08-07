سرویس‌های زیرساختی و پایه که منطق کسب‌وکار مشترک یا ارتباط با سیستم‌های خارجی را مدیریت می‌کنند.
ساختار پیشنهادی
Bashservices/
├── currency/
│   ├── currencyService.ts
│   ├── exchangeRateProvider.ts
│   └── types.ts
├── eventBus/
│   └── eventBus.ts
├── storage/
│   ├── localStorageService.ts
│   └── indexedDbService.ts
├── notification/
│   └── notificationService.ts
├── logger/
│   └── logger.ts
└── index.ts
سرویس‌های اصلی
Currency Service

دریافت نرخ تبدیل لحظه‌ای (ریال، دلار، تتر و ...)
کش کردن نرخ‌ها برای حالت آفلاین
تبدیل مبلغ بین ارزها
قفل کردن نرخ در لحظه ثبت تراکنش

Event Bus

ارتباط بین فیچرها بدون وابستگی مستقیم
رویدادهایی مثل:
TransactionCreated
AccountBalanceUpdated
BudgetExceeded
LoanPaymentDue


Storage Service

لایه انتزاعی روی LocalStorage و IndexedDB
LocalStorage: فقط برای تنظیمات UI (پیکربندی داشبورد، تم، وضعیت منوها، فیلترهای ذخیره‌شده)
IndexedDB: داده‌های مالی حساس (تراکنش‌ها، حساب‌ها، سرمایه‌گذاری‌ها، دارایی‌ها)

Notification Service

مدیریت اعلان‌های درون‌برنامه‌ای
یادآوری سررسیدها، بودجه و اهداف

Logger

ثبت خطاها و رویدادهای مهم
مناسب برای Debug و مانیتورینگ

قوانین

سرویس‌ها نباید مستقیماً به UI وابسته باشند.
بهتر است به صورت Singleton یا از طریق Dependency Injection در دسترس باشند.
تمام Side Effectها (API، Storage و ...) باید از طریق سرویس‌ها انجام شوند.