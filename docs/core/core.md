قوانین کلی پوشه core

بدون وابستگی به فیچرها: core نباید هیچ importی از پوشه features داشته باشد.
قابلیت استفاده مجدد: هر چیزی که اینجا نوشته می‌شود باید در چندین بخش پروژه قابل استفاده باشد.
قابلیت تست: utils و services باید به راحتی Unit Test شوند.
Offline-First: سرویس‌ها باید حالت آفلاین را در نظر بگیرند.
Type-Safe: تمام بخش‌ها با TypeScript قوی نوشته شوند.


## وابستگی‌های پیشنهادی

| بخش | کتابخانه‌های پیشنهادی |
|------|----------------------|
| تاریخ شمسی | `dayjs` + `@dayjs/plugin/jalali` یا `moment-jalaali` |
| State Management | `zustand` |
| Validation | `zod` |
| ID Generation | `uuid` یا `nanoid` |
| Event Bus | پیاده‌سازی ساده خودمان یا `mitt` |

---

## خلاصه مسئولیت‌ها

| دسته | مسئولیت اصلی |
|------|--------------|
| `utils` | توابع خالص و کمکی (بدون وابستگی به React) |
| `hooks` | React Hooks مشترک (فقط اگر در بیش از یک فیچر استفاده شود) |
| `services` | منطق زیرساختی و Side Effects (API، Storage، Notification) |
| `types` | تعاریف TypeScript مشترک |