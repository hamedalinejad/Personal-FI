# Support Layers Audit — lib / stores / styles

تاریخ: 2026-09-01
وضعیت: اصلاحات مستنداتی اعمال شد
Scope: `docs/lib/lib.md` · `docs/stores/stores.md` · `docs/styles/styles.md`

## P0 — یافته‌ها و اصلاحات

### LIB-001 — مالکیت مبهم `sql.js` / `decimal.js`
**مشکل:** راهنمای lib می‌توانست wrapperهای sql.js/decimal.js را داخل `lib/` تشویق کند، در حالی که persistence زیر `core/db` و محاسبه مالی زیر Core/engines است.
**ریسک:** چند facade برای یک مسئولیت و دو محل ownership.
**اصلاح:** `sql.js` و persistence canonical زیر `core/db`؛ Decimal Engine مالک محاسبات؛ `lib/` فقط wrapper shared واقعی.

### LIB-002 — نسخه dependencyها فقط به‌صورت متنی
**مشکل:** «نسخه‌ها در package.json قفل می‌شوند» بدون تأکید روی lockfile و single source of version.
**اصلاح:** manifest + lockfile تنها SoT نسخه؛ docs فقط role/ownership را ثابت می‌کند.

### LIB-003 — خطر secret از `env.ts`
**مشکل:** وجود type-safe `import.meta.env` می‌توانست به تصور secret store منجر شود.
**اصلاح:** API key/license/private key/credential ممنوع در bundle و `env.ts`; کلید کاربر برای Price Fetching طبق service contract در session storage.

### LIB-004 — ارجاع اشتباه `date-fns/jalali`
**مشکل:** راهنمای implementation از `date-fns/jalali` نام می‌برد ولی ساختار canonical `lib/` بر پایه dayjs است.
**اصلاح:** dayjs به‌عنوان wrapper واقعی؛ Canonical Date semantics در Core/Feature docs.

## STORES-001 — Decimal/Map در global state
**مشکل:** `Map<string, Decimal>` برای نرخ‌ها با قرارداد serializable و DecimalString هم‌راستا نبود.
**اصلاح:** `Record<string, string>`؛ Store فقط serializable decimal strings.

## STORES-002 — محاسبه مالی داخل Store
**مشکل:** `convert()` به‌صورت function داخل store می‌توانست Store را مالک engine مالی کند.
**اصلاح:** Currency/Decimal Engine مالک محاسبه؛ Store فقط cache/facade.

## STORES-003 — `isOnline` به‌عنوان مجوز شبکه
**مشکل:** online بودن مرورگر ممکن است با اجازه شبکه اشتباه گرفته شود.
**اصلاح:** `isOnline` فقط UI signal؛ Network Access Policy تنها مرجع مجوز request.

## STORES-004 — persist و نشت داده مالی
**مشکل:** قرارداد persist صریحاً مرز مالی کافی نداشت.
**اصلاح:** فقط state کم‌حجم UI/session قابل persist؛ amount/quantity/fee/holding/balance/operationId ممنوع در LocalStorage.

## STORES-005 — optimistic financial state
**مشکل:** global store ممکن بود قبل از durability موفق، وضعیت مالی را نمایش دهد.
**اصلاح:** invalidate/reload فقط پس از COMMIT و persist موفق.

## STYLES-001 — `direction:ltr` روی رشته کامل مالی
**مشکل:** اعمال LTR روی کل رشته دارای sign/currency/text می‌تواند bidi را بدتر کند.
**اصلاح:** number token جدا + `bdi`؛ CSS فقط presentation.

## STYLES-002 — Tailwind major نامشخص
**مشکل:** syntax کلاسیک Tailwind بدون تعیین major ثبت شده بود؛ در migration به v4 می‌تواند شکست build بدهد.
**اصلاح:** syntax باید دقیقاً با major نصب‌شده در manifest/lockfile منطبق باشد و v3/v4 مخلوط نشوند.

## STYLES-003 — Design token ناقص
**مشکل:** focus token و state/accessibility در سطح shared contract صریح نبود.
**اصلاح:** token contract مشترک برای focus/state/financial/asset و الزام عدم انتقال معنی مالی فقط با رنگ.

## STYLES-004 — Offline asset boundary
**مشکل:** offline بودن فقط برای font ذکر شده بود.
**اصلاح:** rendering نباید به CDN/remote font/remote stylesheet وابسته باشد.

## چیزهایی که عمداً حذف نشد

- هیچ field مالی یا legacy field حذف نشد.
- هیچ Feature route جدیدی ایجاد نشد.
- Zustand به ledger تبدیل نشد.
- `acc_transactions` دوباره به SoT نقد برگردانده نشد.
- Tailwind حذف نشد؛ فقط قرارداد version-sensitive شد.

## قبل از شروع کدنویسی

1. `package.json` + lockfile با library matrix همسو شوند.
2. ESLint boundary برای Feature → Core / lib / stores اعمال شود.
3. تست serialization برای Storeهای persisted اضافه شود.
4. تست نمایش عدد RTL/LTR و sign/currency انجام شود.
5. golden fixtures مالی همچنان gate اصلی release باشند.
