Technical Architecture Document
نام پروژه: Personal Finance & Investment Management System
نوع سند: Technical Architecture
نسخه: 1.0.0
تاریخ: ۱۴۰۵/۰۴/۲۳
۱. اهداف معماری

Offline-First کامل
Privacy-First (تمام داده‌ها محلی بمانند)
ماژولار و قابل گسترش
عملکرد بالا حتی با حجم بالای داده (ده‌ها هزار تراکنش)
قابلیت تبدیل آسان به اپ موبایل و دسکتاپ
نگهداری و توسعه آسان در بلندمدت

۲. پایه دیتابیس

نسخه اول پروژه از **SQLite** با کتابخانه **sql.js** استفاده می‌کند.

```text
SQLite (WASM)

↓

sql.js

↓

IndexedDB
```

### دلایل انتخاب SQLite:

| ویژگی | پشتیبانی |
|-------|---------|
| **Foreign Keys** | ✅ پشتیبانی رسمی |
| **Transactions** | ✅ اتمیک و قابل بازگشت |
| **Views** | ✅ ساخت نمای پیچیده |
| **Indexes** | ✅ سرعت بالای جستجو |
| **SQL Standard** | ✅ استاندارد و شناخته شده |
| **Migrations** | ✅ ابزارهای قدرتمند |
| **Backup/Restore** | ✅ ساده (کپی فایل) |
| **Cloud Sync Ready** | ✅ آماده برای همگام‌سازی آینده |

### نکات فنی:

- تمام محاسبات مالی باید با decimal.js انجام شوند
- تمام مبالغ باید به کوچک‌ترین واحد پول ذخیره شوند (Minor Unit Storage)
- تراکنش‌ها تغییرناپذیر هستند - برای اصلاح تراکنش جدید ایجاد شود
- تمام تاریخ‌ها باید به صورت UTC ذخیره شوند

### سازگاری PWA و موبایل آفلاین (الزامی)

sql.js دیتابیس را در حافظه نگه می‌دارد و اتصال افزایشی به IndexedDB ندارد؛ برای اجرای پایدار به‌عنوان PWA نصب‌شده روی موبایل، موارد زیر **الزامی** است (جزئیات کامل در `core/db/db.md`):

- نوشتن دیتابیس با الگوی **Write-to-temp-then-swap** انجام شود تا خرابی فایل در صورت قطع ناگهانی رخ ندهد.
- **Persist مالی (باگ ۴۳)**: UI «ثبت شد» فقط بعد از COMMIT + await موفق IndexedDB swap؛ `beforeunload`/`visibilitychange` فقط best-effort هستند و روی موبایل تضمین نیستند.
- **Persistence queue + Worker (باگ‌های ۴۴–۴۵)**: serialize سنگین و گزارش‌های حجیم نباید Main Thread را قفل کنند؛ جزئیات در `core/db/db.md`.
- در اولین اجرا `navigator.storage.persist()` فراخوانی شود.
- **Service Worker** برای Cache کردن App Shell و WASM sql.js الزامی است.
- **Migration / Backup-Restore atomic (باگ‌های ۴۶–۴۸)**: قرارداد در `db.md` و `Settings-Tools.md` — بدون integrity check، Restore مجاز نیست.
- **Internal API (باگ ۴۹)**: UI و Feature A هرگز مستقیماً به جداول Feature B یا sql.js خام دسترسی ندارند؛ فقط از طریق API عمومی همان Feature.
- **Atomic Financial Operation (باگ ۵۰)**: قالب مشترک BEGIN→validate→writes→COMMIT→persist در `db.md`.
- **Web App Manifest** (`manifest.json`) با آیکون، `display: standalone` و `start_url` باید تعریف شود.
- یادآوری پشتیبان‌گیری دوره‌ای (Export فایل SQLite) در Dashboard نمایش داده شود، چون ماندگاری IndexedDB روی موبایل تضمین‌شده نیست.
- مسیر ارتقای آینده در صورت رشد حجم داده: **wa-sqlite با OPFS**.

### سیاست دسترسی به شبکه (Network Access Policy) — الزامی، حاکم بر کل اپ

اپ اصولاً یک سیستم **Offline-First** است و هیچ بخشی از آن — جز موارد صراحتاً استثنا‌شده زیر — حق ندارد بدون اقدام آگاهانه کاربر به اینترنت وصل شود. این قانون از نسخه ۱ روی همه فیچرها (خصوصاً `19-Price-Fetching`) حاکم است.

**قانون کلی:** هیچ درخواست شبکه‌ای در Startup، در باز شدن هر صفحه، یا در پس‌زمینه بدون رضایت قبلی/آگاهانه کاربر اجرا نمی‌شود.

**استثناهای مجاز** (فقط همین سه مورد؛ هر مورد جدید باید صریحاً به همین لیست اضافه شود، نه به‌صورت پیش‌فرض مجاز فرض شود):

1. **بررسی نسخه (Version Check)** — **استثنای صریح Offline-first (BUG-032)**: هر بار باز شدن اپ، در پس‌زمینه و بدون مسدود کردن UI، یک درخواست سبک به Endpoint استاتیک نسخه ممکن است زده شود. این Network **فقط وقتی کاربر opt-in کرده** (`autoVersionCheckEnabled=true`) اجرا می‌شود — **پیش‌فرض نصب تازه = false (BUG-C02 Offline-by-default)**.
   - پیش‌فرض نصب تازه: `autoVersionCheckEnabled=false` (کاملاً آفلاین تا opt-in). با روشن کردن دستی در Settings، Startup می‌تواند یک درخواست نسخه بزند.
   - در Onboarding/Settings/Install docs باید نوشته شود: «با روشن بودن بررسی نسخه، در Startup یک درخواست شبکه زده می‌شود».
   - بدون این شفافیت، ادعای «کاملاً آفلاین» گمراه‌کننده است.
   - این درخواست **هیچ داده مالی یا شخصی کاربر را ارسال نمی‌کند** — فقط شماره نسخه فعلی اپ (برای مقایسه) و هیچ شناسه‌ای که بتواند به کاربر خاصی نسبت داده شود.
   - شکست این درخواست (آفلاین بودن، سرور در دسترس نبودن) **کاملاً بی‌صدا** مدیریت می‌شود؛ هیچ خطا یا پیامی به کاربر نشان داده نمی‌شود و اپ دقیقاً مثل قبل کار می‌کند.
   - کاربر می‌تواند از تنظیمات (`stg_settings`، کلید `autoVersionCheckEnabled`) این بررسی خودکار را کاملاً خاموش کند؛ در آن صورت بررسی نسخه فقط با کلیک دستی روی «بررسی به‌روزرسانی» در صفحه تنظیمات انجام می‌شود.
2. **اعتبارسنجی لایسنس (License Validation)** — **در نسخه ۱ اصلاً وجود ندارد** (سیستم فعلاً تک‌کاربره و بدون لایسنس است، طبق مدل «هر کاربر = یک فایل دیتابیس مستقل» در `db.md`). وقتی در نسخه‌های بعدی قابلیت اشتراک/لایسنس‌دهی اضافه شد، اعتبارسنجی لایسنس هم مثل بررسی نسخه رفتار می‌کند:
   - فقط در Startup اپ (و اختیاراً با یک تلاش مجدد دوره‌ای طولانی، مثلاً هر ۲۴ ساعت یک‌بار، نه بیشتر) یک Request سبک برای تأیید اعتبار کلید لایسنس زده می‌شود.
   - **Grace Period اجباری**: اگر سرور لایسنس در دسترس نبود (کاربر آفلاین یا سرور Down)، اپ هرگز بلافاصله قفل نمی‌شود؛ آخرین وضعیت معتبر لایسنس (کش‌شده محلی، همراه با `lastValidatedAt`) تا حداقل یک بازه Grace مشخص (مثلاً ۱۴ روز از آخرین اعتبارسنجی موفق) معتبر فرض می‌شود — دقیقاً برای این‌که کاربری که واقعاً می‌خواهد آفلاین کار کند، هرگز به‌خاطر لایسنس قفل نشود.
   - این بخش باید در همان زمان طراحی نسخه لایسنس‌دار، به‌عنوان سند جدا (`Licensing.md`) با جزئیات کامل مستند شود؛ این پاراگراف فقط اصل «چطور با اصل Offline-First سازگار بماند» را از حالا قفل می‌کند تا در طراحی نهایی فراموش نشود.

3. **به‌روزرسانی Service Worker (App Shell Update)** — رفتار استاندارد PWA (W3C): مرورگر به‌صورت خودکار و دوره‌ای (`navigator.serviceWorker.register` / `updatefound`) فایل `sw.js` را برای یافتن نسخه جدید App Shell چک می‌کند. این از قانون کلی مستثناست چون:
   - بخشی از چرخه عمر عادی PWA است، نه یک ویژگی محصول قابل خاموش کردن.
   - هیچ داده مالی یا شخصی کاربر رد و بدل نمی‌شود — فقط فایل‌های استاتیک اپ (JS، CSS، WASM).
   - رفتار کاملاً استاندارد W3C است و توسط مرورگر کنترل می‌شود، نه کد اپ.
   - **تفاوت با استثنای ۱ (Version Check)**: Version Check یک درخواست اپ‌محور برای نمایش شماره نسخه به کاربر است؛ App Shell Update یک درخواست مرورگر‌محور برای بارگذاری فایل‌های جدید کد است — دو مکانیزم جداگانه با هدف جداگانه.
   - نصب نسخه جدید بعد از دانلود، طبق رفتار استاندارد Service Worker، تا بسته/باز شدن مجدد Tab توسط کاربر به تعویق می‌افتد (`skipWaiting` فقط با تأیید کاربر استفاده شود).

> **نکته مهم**: `19-Price-Fetching` **جزو این استثناها نیست**. دریافت قیمت دارایی‌ها (کریپتو، سهام، صندوق، فلزات) طبق `Price-Fetching.md` همیشه یا با کلیک صریح کاربر یا با Auto-Sync که خودِ کاربر روشن کرده انجام می‌شود — نه به‌صورت خودکار در Startup مثل بررسی نسخه. تفاوت کلیدی: بررسی نسخه هیچ دادهٔ کاربر را لمس نمی‌کند و صرفاً یک عدد ثابت را می‌خواند؛ دریافت قیمت به تعداد و نوع دارایی‌های واقعی کاربر (اطلاعات مالی حساس) وابسته است و به همین دلیل استاندارد سخت‌گیرانه‌تری دارد.


۳. ساختار پوشه‌بندی پروژه (Folder Structure)

```bash
src/
├── core/                  # هسته مشترک
│   ├── utils/             # Utilities (تاریخ شمسی، فرمت اعداد و ...)
│   ├── hooks/             # Hookهای مشترک
│   ├── services/          # سرویس‌های پایه (Currency, Event Bus و ...)
│   └── types/             # TypeScript Types مشترک
│
├── features/              # هر فیچر به صورت مستقل
│   ├── accounts/
│   │   ├── public-api.ts  # تنها نقطه ورود مجاز برای سایر فیچرها و UI
│   │   └── ...            # منطق داخلی، db queries، domain services
│   ├── income/
│   ├── expense/
│   ├── cheque/
│   ├── debt-loan/
│   ├── investment/
│   ├── physical-assets/
│   ├── budget/
│   ├── goals/
│   ├── bills/
│   └── settings/
│   # هر پوشه فیچر یک فایل public-api.ts دارد (همین ساختار accounts/ برای همه)
│
├── components/            # کامپوننت‌های UI مشترک
├── lib/                   # کتابخانه‌های کمکی
├── db/                    # تنظیمات دیتابیس (sql.js + SQLite)
│   ├── db.ts              # اتصال به دیتابیس
│   ├── schema.sql         # تعریف جداول با SQL
│   ├── models.ts          # TypeScript types
│   ├── migrations.ts      # مدیریت مایگRATION‌ها
│   └── queries/           # کوئری‌های SQL
├── stores/                # Zustand stores
├── api/                   # Re-export/Facade اختیاری از public-api هر فیچر (باگ ۴۹)
│   │                      # هیچ منطقی اینجا نوشته نمی‌شود — فقط re-export برای راحتی import در UI
│   │                      # مثال: api/accounts.ts → export * from '../features/accounts/public-api'
├── assets/
├── styles/
public/
├── manifest.json          # Web App Manifest (نصب PWA روی موبایل)
├── sw.ts                  # Service Worker (Cache App Shell + WASM sql.js)
└── icons/                 # آیکون‌های PWA
```

---

## قرارداد دسترسی بین لایه‌ها (باگ ۴۹)

```text
UI / Hooks
  → Feature Public API  (مثلاً createCryptoBuy, repayLoan)
    → Domain Service
      → db layer (sql.js)  — فقط داخل همان Feature یا core shared helpers
```

ممنوع:
- `UI → SQL` مستقیم
- `Feature A → UPDATE جدول Feature B` مستقیم
- Share کردن connection sql.js برای queryهای ad-hoc از Presentation

مجاز:
- Feature A از **`features/B/public-api.ts`** صدا می‌زند (مثلاً `accounts.getBalance`) — نه مستقیم از فایل‌های داخلی B
- `src/api/` فقط Re-export همین public-api هاست و هیچ منطقی ندارد
- Event Bus برای اطلاع‌رسانی بعد از commit (نه برای نوشتن داده)

---

## Integrity & Time (باگ‌های ۵۱–۵۵)

- **Reconciliation**: APIهای مرکزی در `core/db/db.md` — snapshot در برابر ledger.
- **CHECK + FK**: schema سطح SQLite با CHECK و ON DELETE صریح؛ پیش‌فرض مالی RESTRICT.
- **Polymorphic links**: Domain validate + reconcile؛ SQLite enforce کامل ندارد.
- **Time**: UTC timestamps + فیلدهای business/market/settlement/due جدا برای بازار ایران.

---

## مرز License و داده مالی (باگ ۵۸)

مدل v1: **هر کاربر منطقی = یک فایل SQLite مستقل** (مناسب offline).

### قوانین مرزبندی
1. **License هرگز داخل DB مالی کاربر به‌عنوان وابستگی معنایی ذخیره نمی‌شود** — نه foreign key به تراکنش‌ها، نه قفل کردن ردیف‌های مالی بر اساس وضعیت لایسنس.
2. وضعیت لایسنس در storage جدا (مثلاً LocalStorage رمزشده / فایل تنظیمات اپ / حافظه امن) با `lastValidatedAt` و Grace Period (طبق سیاست شبکه).
3. لایه License فقط تعیین می‌کند کدام فایل DB باز شود یا آیا قابلیت‌های محصولی فعال‌اند — **نه** اینکه داده مالی چگونه تفسیر شود.
4. Backup/Export مالی می‌تواند بدون اسرار لایسنس باشد؛ Restore مالی نباید به سرور لایسنس نیاز داشته باشد (offline-first).
5. Implementation آینده multi-user/cloud نباید `acc_transactions` را با `licenseId` آلوده کند؛ mapping کاربر↔فایل DB بیرون از schema مالی است.

---

## API Key Secret Lifecycle (BUG-033)

علاوه بر UX Session Storage (باگ ۳۷):

| رویداد | رفتار |
|--------|--------|
| Tab close | پاک شدن sessionStorage (رفتار مرورگر) |
| Crash / kill | کلید از بین می‌رود؛ ورود مجدد |
| Soft refresh همان Tab | sessionStorage معمولاً می‌ماند |
| Shared device | کاربر باید Tab را ببندد؛ راهنمای Settings: «روی دستگاه مشترک پس از کار Tab را ببندید» |
| Isolation | کلید per `sourceId` / provider — یک کلید برای همه Providerها share نمی‌شود |
| Log/Audit/Error | کلید هرگز در پیام خطا، event bus، یا backup نیست |

قبل از نسخه licenseable: همین جدول Contract پیاده‌سازی است، نه فقط متن UX.

---

## Enforce مرز Feature (BUG-040)

قرارداد `UI → Feature API → Domain → DB` باید در implementation قابل enforce باشد:

1. **Import boundary**: `features/A` نباید از `features/B/db`، `features/B/services`، یا SQL خام B import کند؛ فقط از `features/B/public-api.ts` (یا معادل re-export آن در `src/api/`).
2. **`src/api/`** صرفاً یک لایه re-export است — هیچ منطقی (query، validation، computation) اینجا نوشته نمی‌شود؛ تمام پیاده‌سازی داخل `features/*/public-api.ts` است.
3. **ESLint** `no-restricted-imports` / dependency-cruiser / arch unit test در CI — rule نمونه: هر import از `features/*/!(public-api)` خارج از پوشه خودِ همان فیچر باید error باشد.
4. تست نمونه: هیچ فایلی خارج از `features/*/db/` نباید `sql.js` یا `runQuery` مستقیم صدا بزند مگر از طریق `public-api.ts` همان فیچر.
5. تا قبل از وجود این ruleها در repo، مرز فقط مستند است — در checklist پیاده‌سازی v1 این item باید tick شود.
