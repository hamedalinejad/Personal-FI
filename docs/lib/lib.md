lib/ — کتابخانه‌ها و تنظیمات کمکی
این پوشه برای کدهایی است که نه Utils خالص هستند، نه Service کامل، بلکه تنظیمات و Wrapperهای کتابخانه‌های خارجی یا منطق‌های زیرساختی کوچک‌اند.
ساختار پیشنهادی
Bashlib/
├── react-query.ts          # تنظیمات TanStack Query
├── dayjs.ts                # تنظیم dayjs + تقویم شمسی
├── zod.ts                  # Schemaهای مشترک یا config
├── storage.ts              # Wrapper روی localStorage
├── constants.ts            # ثابت‌های سراسری
├── env.ts                  # متغیرهای محیطی
└── index.ts
مسئولیت‌ها





























فایلکاربردreact-query.tsتنظیم QueryClient، cache time، retrydayjs.tsفعال‌سازی پلاگین شمسی و locale فارسیstorage.tsخواندن/نوشتن امن در localStorageconstants.tsثابت‌هایی مثل نام اپ، نسخه، کلیدهاenv.tsمدیریت متغیرهای محیطی Vite
قوانین

اینجا Business Logic فیچرها نوشته نشود.
فقط زیرساخت و پیکربندی کتابخانه‌ها قرار گیرد.
تا حد امکان Type-Safe باشد.