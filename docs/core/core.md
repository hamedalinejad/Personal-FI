# core/ — قوانین کلی و وابستگی‌های پوشه core

پوشه `core` شامل همه کدهای زیرساختی و مشترک پروژه است که فیچرها به آن‌ها وابسته هستند، اما core به هیچ فیچری وابسته نیست.

---

## قوانین کلی

1. **بدون وابستگی به فیچرها**: `core` هیچ `import`ی از پوشه `features/` نداشته باشد.
2. **قابلیت استفاده مجدد**: هر چیزی که اینجا نوشته می‌شود باید در چندین بخش پروژه قابل استفاده باشد.
3. **قابلیت تست**: `utils` و `services` باید به راحتی Unit Test شوند (توابع Pure، بدون Side Effect پنهان).
4. **Offline-First**: سرویس‌ها باید حالت آفلاین را در نظر بگیرند — هر سرویسی که با شبکه کار می‌کند باید طبق «سیاست دسترسی به شبکه» در `Technical-Architecture.md` رفتار کند.
5. **Type-Safe**: تمام بخش‌ها با TypeScript قوی نوشته شوند. از `any` پرهیز شود.
6. **Decimal-Safe**: هرگز `Number` یا `parseFloat` برای مبالغ مالی استفاده نشود — فقط `Decimal.js`.
7. **Rounding-Policy**: هر محاسبه مالی که نیاز به گرد کردن دارد باید از `utils/money/round.ts` و طبق `docs/core/rounding/Rounding-Policy.md` انجام شود. Round در میانه محاسبه زنجیره‌ای ممنوع است.

---

## وابستگی‌های پروژه (کتابخانه‌های خارجی)

| بخش | کتابخانه | توضیح |
|-----|----------|-------|
| **محاسبات مالی** | `decimal.js` | **الزامی برای تمام محاسبات مالی** — هرگز از `Number` یا `float` برای مبالغ استفاده نشود |
| **دیتابیس** | `sql.js` | SQLite در WASM — ذخیره‌سازی اصلی در IndexedDB |
| **تاریخ شمسی** | `dayjs` + `dayjs-jalali` | پیکربندی مرکزی در `lib/dayjs.ts` |
| **State Management** | `zustand` | Storeهای سبک و ماژولار |
| **Validation** | `zod` | اعتبارسنجی ورودی‌ها و Schema تعریف Type |
| **ID Generation** | `uuid` | تولید UUID v4 در `utils/id/generateId.ts` |
| **Event Bus** | `mitt` یا پیاده‌سازی ساده | ارتباط بین فیچرها بدون coupling مستقیم |
| **Styling** | `tailwindcss` | کلاس‌های utility؛ متغیرهای رنگ مالی در `styles/themes.css` |

> **چرا TanStack Query/React Query در لیست نیست؟** 
> این کتابخانه برای کش‌کردن نتایج fetch از API خارجی طراحی شده. در این پروژه هیچ API خارجی برای داده مالی وجود ندارد — همه داده‌ها از SQLite محلی می‌آیند. State کوئری‌های دیتابیس در Zustand Storeها نگه‌داری می‌شود.

---

## خلاصه مسئولیت‌ها

| پوشه | مسئولیت اصلی | سند کامل |
|------|--------------|----------|
| `db/` | لایه دیتابیس SQLite، Schema، Migration، قانون Minor Unit | `docs/core/db/db.md` |
| `utils/` | توابع خالص: تاریخ، عدد، پول، اعتبارسنجی، رشته | `docs/core/utils/utils.md` |
| `hooks/` | React Hooks مشترک (فقط برای بیش از یک فیچر) | `docs/core/hooks/hooks.md` |
| `services/` | سرویس‌های زیرساختی: ارز، EventBus، Storage، VersionCheck، Logger | `docs/core/services/services.md` |
| `types/` | TypeScript Types مشترک: TransactionType، RelatedFeature، AppEvent، AssetCategory | `docs/core/types/types.md` |
| `rounding/` | **سیاست گرد کردن اعداد — Critical Cross-Cutting** | `docs/core/rounding/Rounding-Policy.md` |

## اسناد Domain مشترک
- `Cost-Basis-Engine.md` — موتور واحد cost basis برای همه Investmentها
- `db.md` — journal، reconcile، fixtures عددی
- `rounding/Rounding-Policy.md` — precision
- `types/types.md` — انواع مشترک
- `Canonical-Financial-Operation.md` — الگوی واحد Operation→Journal→Snapshot→Persist
- `Financial-Invariants.md` — ممنوعیت‌های مالی و الزامات release
- `Accounting-Core.md` — **SoT حسابداری** (COA, journal, ارجاع Operation/Opening/Reconcile)
- `Parties.md` — طرف حساب (ref_parties)
- `Account-Layers.md` — Financial vs Accounting vs Party
- `License-Offline.md` — license فایل امضاشده، خارج از DB مالی
- `Opening-Balance.md` — موجودی/پوزیشن اولیه سراسری
- `Import-Infrastructure.md` — pipeline وارد کردن CSV/JSON
- `Corporate-Action-Engine.md` — CA عمومی (stock/crypto/fund)
- `Raw-vs-Derived-Data.md` — حقایق ثبت‌شده vs محاسبات
- `Precision-Policy.md` — scale per currency/instrument
- `Feature-API-Contract.md` — Command/Query، TS API، sourceType
- `Core-Engines.md` — لیست engineهای مرکزی
- `Source-of-Truth-Matrix.md` — یک سؤال → یک منبع
- `Loan-Component-Classification.md`
- `Data-Preservation-Contract.md`
- `Data-Dictionary.md`
- `Unit-Policy.md`
- `iran/README.md` — Iran Core
- `Instrument-Identity.md`
- `Date-Semantics-Matrix.md`
- `Canonical-Ownership-Matrix.md`
- `Audit-vs-Financial-Event.md`
- `Storage-Abstraction.md`
- `Investment-Three-Layers.md`
- `fixtures/README.md` — Golden fixtures
- `Data-Model-Relationship-Matrix.md`
- `SPEC-FREEZE.md`
