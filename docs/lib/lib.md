# lib/ — کتابخانه‌ها و تنظیمات کمکی

این پوشه برای کدهایی است که نه Utils خالص هستند، نه Service کامل، بلکه **تنظیمات و Wrapperهای کتابخانه‌های خارجی** یا منطق‌های زیرساختی کوچک‌اند.

---

## ساختار پوشه

```bash
lib/
├── dayjs.ts # تنظیم dayjs + پلاگین شمسی + locale فارسی
├── zod.ts # Schemaهای مشترک Zod یا config سراسری
├── constants.ts # ثابت‌های سراسری (نام اپ، نسخه، enum‌های UI)
├── env.ts # متغیرهای محیطی Vite با type-safe wrapper
└── index.ts # re-export مرکزی
```

> **چرا `react-query.ts` در این پوشه نیست؟** 
> TanStack Query/React Query برای کش‌کردن نتیجه fetch از API خارجی طراحی شده؛ در این پروژه هیچ API خارجی‌ای برای داده مالی وجود ندارد — همه داده‌ها از SQLite محلی می‌آیند. بنابراین TanStack Query **جزء وابستگی‌های این پروژه نیست** و هیچ `react-query.ts` یا `QueryClient` در این پوشه یا هیچ‌جای پروژه وجود ندارد. State ناشی از کوئری‌های دیتابیس در Zustand Storeها نگه‌داری می‌شود (به `docs/stores/stores.md` مراجعه کنید).

> **چرا `storage.ts` در این پوشه نیست؟** 
> لایه انتزاعی روی LocalStorage به‌صورت `localStorageService.ts` در `core/services/storage/` تعریف شده (به `docs/core/services/services.md` مراجعه کنید) تا در کنار سایر سرویس‌های زیرساختی مشابه (مثل `sessionStorageService`) باشد. توجه: `indexedDbService` عمداً در پروژه وجود ندارد — نوشتن/خواندن IndexedDB مستقیماً در `core/db/db.ts` با الگوی Write-to-temp-then-swap انجام می‌شود (به بخش «چرا `indexedDbService.ts` از پروژه حذف شد؟» در `services.md` مراجعه کنید). **دو فایل جداگانه برای یک مسئولیت ایجاد نشود** — هر کدی که با LocalStorage/Session Storage کار دارد از `core/services/storage/localStorageService.ts` استفاده می‌کند.

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

---

## راهنمای پیاده‌سازی
- Wrapperهای **کتابخانه‌های واقعاً مستقر در پروژه** فقط در صورت داشتن مسئولیت عمومی در این پوشه قرار می‌گیرند.
- `sql.js` و persistence زیر مالکیت `core/db` هستند؛ `decimal.js` مالکیت محاسبات/engines را دارد؛ این پوشه فقط wrapperی را نگه می‌دارد که واقعاً در runtime نیاز به facade/config مشترک دارد.
- `dayjs` برای presentation/date utilities این پروژه؛ منطق Canonical Date و Date-Semantics در Core/Feature docs باقی می‌ماند.
- تنظیمات init یک‌بار در bootstrap اپ انجام می‌شود؛ init تکراری در featureها ممنوع است.

---

## کتابخانه‌های اصلی و دلیل انتخاب

| Library | دلیل | محل مالکیت/runtime |
|---------|------|---------------------|
| **decimal.js** | محاسبات مالی دقیق؛ ممنوعیت float | Core calculation/engines؛ wrapper فقط در صورت نیاز |
| **dayjs** (+ plugin جلالی) | تاریخ و presentation تقویمی | `lib/dayjs.ts` |
| **uuid** | PK از نوع UUID v4 | Core ID generation |
| **sql.js** | SQLite در مرورگر برای offline-first | `core/db/`؛ **نه** `lib/` |
| **zod** | اعتبارسنجی schema در مرز API/UI | `lib/zod.ts` برای schema مشترک |

### Library Version / Ownership Contract

نسخه دقیق dependencyها فقط از **manifest قفل‌شده پروژه** (`package.json` و lockfile) معتبر است. این سند نباید نسخه‌ای را حدس بزند یا نسخه را به‌صورت موازی نگه دارد.

قواعد:

1. برای هر dependency فقط **یک محل تعریف نسخه** وجود دارد: manifest + lockfile.
2. `docs/lib/lib.md` فقط نقش، ownership و قرارداد استفاده را تعریف می‌کند.
3. اضافه‌کردن dependency جدید باید هم‌زمان دلیل، scope، offline impact و محل import مجاز آن مستند شود.
4. libraryی که فقط برای یک feature لازم است نباید بدون دلیل به shared `lib/` ارتقا پیدا کند.
5. dependencyهای مخصوص شبکه/API خارجی باید داخل feature/infrastructure همان feature باشند، نه `lib/` عمومی.
6. upgrade کتابخانه‌ای که روی محاسبات مالی، parsing یا persistence اثر دارد باید golden fixtureهای مرتبط را دوباره اجرا کند.

### Import Boundary

```text
UI / Feature
   ↓
Public facade یا core utility
   ↓
lib wrapper (فقط اگر shared wrapper لازم باشد)
   ↓
external library
```

ممنوع:

```text
Feature A → internal file of Feature B
Feature → raw package configuration
UI → direct sql.js / raw DB
```

### Security / Env Contract

`import.meta.env` در اپ مرورگری **secret store نیست**. هیچ API key، license secret، private key یا credential نباید در `env.ts` به‌عنوان مقدار قابل bundle تعریف شود. اگر feature نیاز به API key کاربر دارد، آن key طبق قرارداد `core/services/storage/sessionStorageService` مدیریت می‌شود و به bundle نهایی راه پیدا نمی‌کند.

### یافته‌های ممیزی این بخش

- نام `date-fns/jalali` در راهنمای قبلی با ساختار واقعی `lib/` هم‌خوان نبود و با `dayjs` تداخل مفهومی داشت؛ اصلاح شد.
- `sql.js` و persistence قبلاً به‌عنوان wrapper احتمالی `lib/` معرفی می‌شدند در حالی که مالکیت واقعی در `core/db` است؛ اصلاح شد.
- «نسخه‌ها در package.json قفل می‌شوند» به‌تنهایی قرارداد کافی نیست؛ lockfile و manifest تنها SoT نسخه شدند.
- `env.ts` نباید حتی از نظر قراردادی محل نگهداری secret باشد؛ مرز bundle در سند صریح شد.
