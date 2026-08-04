قوانین کلی پوشه core

بدون وابستگی به فیچرها: core نباید هیچ importی از پوشه features داشته باشد.
قابلیت استفاده مجدد: هر چیزی که اینجا نوشته می‌شود باید در چندین بخش پروژه قابل استفاده باشد.
قابلیت تست: utils و services باید به راحتی Unit Test شوند.
Offline-First: سرویس‌ها باید حالت آفلاین را در نظر بگیرند.
Type-Safe: تمام بخش‌ها با TypeScript قوی نوشته شوند.


وابستگی‌های پیشنهادی





























بخشکتابخانه‌های پیشنهادیتاریخ شمسیdayjs + jalaliday یا moment-jalaaliState ManagementzustandValidationzodID Generationuuid یا nanoidEvent Busپیاده‌سازی ساده خودمان یا mitt

خلاصه مسئولیت‌ها

























پوشهمسئولیت اصلیutilsتوابع خالص و کمکیhooksReact Hooks مشترکservicesمنطق زیرساختی و Side Effectهاtypesتعاریف TypeScript مشترک
text