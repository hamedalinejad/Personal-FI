# lib/ — کتابخانه‌ها و تنظیمات کمکی

این پوشه برای کدهایی است که نه Utils خالص هستند، نه Service کامل، بلکه **تنظیمات و Wrapperهای کتابخانه‌های خارجی** یا منطق‌های زیرساختی کوچک‌اند.

---

## ساختار پوشه

```bash
lib/
├── dayjs.ts                # تنظیم dayjs + پلاگین شمسی + locale فارسی
├── zod.ts                  # Schemaهای مشترک Zod یا config سراسری
├── constants.ts            # ثابت‌های سراسری (نام اپ، نسخه، enum‌های UI)
├── env.ts                  # متغیرهای محیطی Vite با type-safe wrapper
└── index.ts                # re-export مرکزی
```

> **چرا `react-query.ts` در این پوشه نیست؟**  
> TanStack Query/React Query برای کش‌کردن نتیجه fetch از API خارجی طراحی شده؛ در این پروژه هیچ API خارجی‌ای برای داده مالی وجود ندارد — همه داده‌ها از SQLite محلی می‌آیند. بنابراین TanStack Query **جزء وابستگی‌های این پروژه نیست** و هیچ `react-query.ts` یا `QueryClient` در این پوشه یا هیچ‌جای پروژه وجود ندارد. State ناشی از کوئری‌های دیتابیس در Zustand Storeها نگه‌داری می‌شود (به `docs/stores/stores.md` مراجعه کنید).

> **چرا `storage.ts` در این پوشه نیست؟**  
> لایه انتزاعی روی LocalStorage به‌صورت `localStorageService.ts` در `core/services/storage/` تعریف شده (به `docs/core/services/services.md` مراجعه کنید) تا در کنار سایر سرویس‌های زیرساختی مثل IndexedDB Service باشد. **دو فایل جداگانه برای یک مسئولیت ایجاد نشود** — هر کدی که با LocalStorage/Session Storage کار دارد از `core/services/storage/localStorageService.ts` استفاده می‌کند.

---

## مسئولیت هر فایل

| فایل | کاربرد | نکته |
|------|---------|------|
| `dayjs.ts` | فعال‌سازی `jalali` plugin، تنظیم locale فارسی، export یک instance پیکربندی‌شده | هرجا dayjs لازم است، از این فایل import شود نه از `dayjs` مستقیم |
| `zod.ts` | Schemaهای مشترک Zod که در چند فیچر استفاده می‌شوند (مثلاً schema UUID، schema مبلغ Decimal) | فقط Schema مشترک؛ Schema‌های اختصاصی هر فیچر داخل خود فیچر بمانند |
| `constants.ts` | ثابت‌های سراسری: نام اپ، شماره نسخه (`APP_VERSION`)، حداقل اندازه Batch دریافت قیمت، و هر enum ثابت UI که در بیش از یک فیچر استفاده می‌شود | `APP_VERSION` باید با `package.json > version` هماهنگ باشد (یا مستقیم از آن خوانده شود) |
| `env.ts` | خواندن type-safe متغیرهای محیطی Vite (`import.meta.env.*`) با مقادیر پیش‌فرض صریح؛ هرجا نیاز به env var هست از این فایل import شود | در production هیچ env var حساسی (API key و ...) در بسته نهایی Vite compile نشود — به «سیاست دسترسی به شبکه» در `Technical-Architecture.md` مراجعه کنید |

---

## قوانین

1. اینجا Business Logic فیچرها نوشته نشود.
2. فقط زیرساخت و پیکربندی کتابخانه‌ها قرار گیرد.
3. تا حد امکان Type-Safe باشد.
4. هیچ وابستگی به پوشه `features/` یا `stores/` نداشته باشد؛ فقط از `core/types/` می‌تواند import کند.
5. `constants.ts` برای ثابت‌های واقعاً سراسری است — ثابت‌های داخلی یک فیچر (مثل مقادیر enum یک جدول) داخل خود فیچر تعریف شوند.
