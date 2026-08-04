db/ — دیتابیس محلی
این پوشه مسئول تعریف و مدیریت دیتابیس Offline است (Dexie.js یا RxDB).
ساختار پیشنهادی
Bashdb/
├── index.ts                 # مقداردهی اولیه دیتابیس
├── schema.ts                # تعریف جداول و نسخه Schema
├── migrations/              # مهاجرت‌های نسخه‌های دیتابیس
│   ├── v1.ts
│   └── v2.ts
├── repositories/            # دسترسی به داده‌ها (اختیاری)
│   ├── accountRepository.ts
│   ├── transactionRepository.ts
│   └── ...
└── types.ts                 # انواع مرتبط با DB
مسئولیت‌ها

تعریف Schema تمام جداول (acc_accounts, txn_transactions, incomes_transactions و ...)
مدیریت نسخه دیتابیس و Migration
ایجاد اتصال اولیه به IndexedDB
فراهم کردن دسترسی یکپارچه به داده‌ها برای فیچرها

نکات مهم

Schema Versioning الزامی است تا آپدیت اپ داده کاربر را خراب نکند.
نام جداول باید با پیشوند فیچر مشخص باشد.
Repositoryها می‌توانند عملیات CRUD را کپسوله کنند.
تمام عملیات مالی حساس باید قابل Transactional بودن باشند (تا حد پشتیبانی Dexie/RxDB).

نمونه مفهومی Schema
TypeScript// مثال ساده
accounts: 'id, name, isArchived, createdAt'
transactions: 'id, accountId, type, date, amount'
incomes_transactions: 'id, accountId, date, amount'
expenses_transactions: 'id, accountId, date, amount'