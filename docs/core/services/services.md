# core/services/ — سرویس‌های زیرساختی پایه

سرویس‌های زیرساختی و پایه که منطق کسب‌وکار مشترک یا ارتباط با لایه‌های ذخیره‌سازی را مدیریت می‌کنند. این سرویس‌ها Business Logic فیچرها را ندارند؛ فقط مکانیزم ذخیره، رویداد، لاگ و اعلان را ارائه می‌دهند.

---

## ساختار پوشه

```bash
services/
├── currency/
│ ├── currencyService.ts # تبدیل ارز، کش نرخ‌ها برای آفلاین
│ ├── exchangeRateProvider.ts # واسط دریافت نرخ از cur_exchange_rates (SQLite)
│ └── types.ts
├── eventBus/
│ └── eventBus.ts # ارتباط بین فیچرها بدون وابستگی مستقیم
├── storage/
│ ├── localStorageService.ts # خواندن/نوشتن امن در LocalStorage
│ └── sessionStorageService.ts# داده‌های موقت سشن (مثل API Key دریافت قیمت)
├── versionCheck/
│ └── versionCheckService.ts # بررسی نسخه برنامه (استثنای مجاز Network Access Policy)
├── notification/
│ └── notificationService.ts # اعلان‌های درون‌برنامه‌ای
├── logger/
│ └── logger.ts # ثبت خطاها و رویدادهای مهم (فقط local، بدون ارسال بیرون)
└── index.ts
```

> **Providerهای قیمت کجا هستند؟** 
> Adapterهای API قیمت (`PriceProviderAdapter`) داخل فیچر `19-Price-Fetching/infrastructure/providers/` زندگی می‌کنند، نه در `core/services`. دلیل: وابسته به دامنه قیمت‌اند و قراردادشان در `Price-Fetching.md` تعریف شده. `core/services` فقط زیرساخت عمومی (storage برای API Key، eventBus برای `PriceFetchCompleted`) را می‌دهد.

> **چرا `indexedDbService.ts` از پروژه حذف شد؟** 
> IndexedDB در این پروژه صرفاً به‌عنوان ذخیره‌گاه فیزیکی فایل SQLite (از طریق sql.js) استفاده می‌شود — یعنی فقط یک Blob کامل در آن نوشته/خوانده می‌شود. این عملیات مستقیماً در لایه db (فایل `db/db.ts`) و با الگوی `Write-to-temp-then-swap` (مستند در `core/db/db.md`) انجام می‌شود؛ یک سرویس جداگانه برای آن ارزش افزوده‌ای ندارد و فقط پیچیدگی غیرضروری ایجاد می‌کند.

---

## سرویس‌های اصلی

### Currency Service
- دریافت نرخ‌های ارز از جدول `cur_exchange_rates` (SQLite، نه API خارجی)
- کش کردن نرخ‌ها در `useCurrencyStore` برای مصرف سریع بدون کوئری مجدد
- تبدیل مبلغ بین ارزها با Decimal.js (نه float)
- قفل کردن نرخ در لحظه ثبت تراکنش (هر تراکنش `exchangeRateToBase` خودش را دارد)

> نرخ ارز از کجا می‌آید؟ کاربر نرخ را دستی ثبت می‌کند (فیچر `Currency-CrossRate`). به‌روزرسانی خودکار نرخ ارز در محدوده `19-Price-Fetching` نیست — نرخ ارز یک تصمیم مالی است، نه یک قیمت بازار برای دارایی.

### Event Bus
ارتباط بین فیچرها بدون وابستگی مستقیم (`import`). فهرست کامل و به‌روز رویدادها همیشه در `types.md → events.ts` (تعریف `AppEvent`) است؛ جدول زیر باید با هر تغییر در `AppEvent` به‌روز شود (قانون ۶ در `types.md`).

**قرارداد سرویس (interface کامل در `types.md → EventBus`):**

| متد | امضا | توضیح |
|-----|------|-------|
| `emit` | `emit<T>(type, payload): void` | انتشار رویداد به همه handlerهای ثبت‌شده |
| `subscribe` | `subscribe<T>(type, handler):  => void` | ثبت handler؛ خروجی تابع unsubscribe است |

**قوانین رفتاری (الزامی در هر implementation):**

1. **Sync — نه Async**: `emit` همیشه synchronous است؛ همه handlerها در همان call stack فراخوانی می‌شوند. هیچ Promise یا microtask queue وسط نیست.
2. **Error Isolation**: اگر یک handler خطا پرتاب کند، handler باید آن را با `try/catch` ایزوله کند تا سایر handlerها اجرا شوند — یک handler بد کل Event Bus را متوقف نمی‌کند. خطا در `logger` ثبت می‌شود.
3. **Unsubscribe الزامی**: هر component/service پس از unmount یا destroy باید تابع برگشتی `subscribe` را فراخوانی کند تا memory leak نداشته باشیم.
4. **بدون wildcard**: subscribe فقط برای یک `type` مشخص از `AppEvent` است — بدون `subscribe('*', handler)`.
5. **بدون persistence**: رویدادها در حافظه زنده‌اند؛ هیچ رویدادی در SQLite یا LocalStorage ذخیره نمی‌شود.

| رویداد | دسته | توضیح |
|--------|------|-------|
| `TransactionCreated` | حساب | هر بار که یک تراکنش مالی ثبت می‌شود |
| `AccountBalanceUpdated` | حساب | تغییر موجودی یک حساب |
| `BudgetExceeded` | بودجه | رد شدن از سقف بودجه |
| `BudgetUpdated` | بودجه | تغییر مقدار باقی‌مانده یک پاکت بودجه |
| `InvestmentValueUpdated` | سرمایه‌گذاری | تغییر ارزش یک دارایی سرمایه‌گذاری (کریپتو / سهام / صندوق / فلز) |
| `PortfolioSnapshotCreated` | سرمایه‌گذاری | ایجاد یک اسنپ‌شات جدید پرتفوی |
| `LoanPaymentDue` | وام | سررسید قسط وام |
| `LoanPaymentMade` | وام | ثبت پرداخت یک قسط وام |
| `ChequeDue` | چک | سررسید تاریخ چک |
| `ChequeStatusChanged` | چک | تغییر وضعیت چک (مثلاً به وصول‌شده یا برگشتی) |
| `MetalsDeliveryStatusChanged` | فلزات | تغییر وضعیت تحویل فلز (مثلاً آماده تحویل یا تحویل‌داده‌شده) |
| `TaxDue` | مالیات | سررسید یک تعهد مالیاتی |
| `TaxPaid` | مالیات | ثبت پرداخت مالیات |
| `PriceFetchStarted` | قیمت | شروع عملیات دریافت قیمت (دستی یا auto-sync) |
| `PriceFetchCompleted` | قیمت | پایان عملیات دریافت قیمت (موفق یا ناموفق) |
| `VersionUpdateAvailable` | سیستم | نسخه جدیدتر اپ در دسترس است |

### Storage Service

**`localStorageService.ts`** — خواندن/نوشتن type-safe در LocalStorage:
- فقط برای داده‌های غیرحساس و کم‌حجم UI (تنظیمات تم، زبان، فرمت‌ها، وضعیت سایدبار، فیلترهای ذخیره‌شده)
- **داده مالی هرگز** در LocalStorage ذخیره نشود
- همه مقادیر با JSON serialize/deserialize می‌شوند + type guard برای جلوگیری از crash در صورت corrupt بودن داده
- کلیدهای مجاز باید به‌صورت enum یا const object در همین فایل تعریف شوند تا typo در کلید رخ ندهد

**`sessionStorageService.ts`** — داده‌های موقت سشن:
- فقط برای داده‌هایی که بعد از بستن tab باید از بین بروند
- **API Key قیمت**:
 - کلید فقط اینجا نگه داشته می‌شود (نه SQLite، نه LocalStorage plaintext)
 - API پیشنهادی: `setPriceApiKey(sourceId, key)` / `getPriceApiKey(sourceId)` / `clearPriceApiKey(sourceId)`
 - با بستن tab کلید پاک است؛ caller (Price Fetching) باید نبود کلید را با UX مشخص مدیریت کند (مودال ورود یا Skip در Auto-Sync)
 - جزئیات سیاست در `Price-Fetching.md`
- فرم‌های ناتمام (Draft state) در صورت نیاز

### Version Check Service
بررسی وجود نسخه جدیدتر از برنامه — **تنها یکی از دو استثنای مجاز Network Access Policy** (به `Technical-Architecture.md` بخش «سیاست دسترسی به شبکه» مراجعه کنید).

مسئولیت‌ها:
- در Startup اپ، در پس‌زمینه و **بدون block کردن UI**، به یک Endpoint استاتیک درخواست می‌زند
- هیچ داده مالی یا شناسه کاربر ارسال نمی‌شود — فقط شماره نسخه فعلی (`APP_VERSION` از `lib/constants.ts`) برای مقایسه
- اگر نسخه جدیدتر وجود داشت: رویداد `VersionUpdateAvailable` در Event Bus منتشر می‌شود تا UI یک badge/toast نمایش دهد
- شکست یا timeout (آفلاین، سرور ناموجود): کاملاً بی‌صدا — هیچ خطا یا پیامی به کاربر نمی‌رسد
- اگر کاربر از تنظیمات (`stg_settings` کلید `autoVersionCheckEnabled`) این بررسی را خاموش کرده باشد: هیچ request ای ارسال نمی‌شود

### Notification Service
- مدیریت اعلان‌های درون‌برنامه‌ای (Toast، Badge)
- یادآوری سررسیدهای وام، بودجه تجاوزکرده، اهداف مالی
- هیچ Push Notification یا ارتباط با سرور خارجی ندارد — کاملاً local

### Logger
- ثبت خطاها و رویدادهای مهم فقط در حافظه (در حین اجرا) یا LocalStorage
- هرگز لاگ‌ها به سرور خارجی ارسال نمی‌شوند (Privacy-First + Offline-First)
- در build production، level DEBUG حذف شود

---

## قوانین

1. سرویس‌ها نباید مستقیماً به UI (React components) وابسته باشند.
2. هیچ Side Effect ای (Network، Storage) خارج از سرویس‌ها انجام نشود — کامپوننت‌ها و فیچرها فقط از سرویس‌ها فراخوانی می‌کنند.
3. تمام Side Effectهای شبکه باید طبق «سیاست دسترسی به شبکه» در `Technical-Architecture.md` مجاز باشند.
4. سرویس‌ها به‌عنوان Singleton پیاده‌سازی شوند یا از طریق Dependency Injection در Store ها در دسترس باشند.
5. سرویس‌ها هیچ import ای از پوشه `features/` نداشته باشند؛ فقط از `core/types/` و `core/db/` می‌توانند import کنند.

---

## راهنمای پیاده‌سازی
- EventBus sync و in-process؛ payload مطابق `types.md` (مبالغ string)
- `runAtomicFinancialOperation` در لایه db/domain — نه داخل React component
- سرویس‌ها stateless نسبت به UI؛ state موقت در Zustand (`stores.md`)

---

## Event Bus — Post-Commit و جداسازی

- `emit` وسط SQL transaction **ممنوع** (ناسازگاری event با rollback).
- دو instance: `domainEventBus` و `applicationEventBus` (Price/Version روی application).
- Handler مالی سنگین: `queueMicrotask` / job queue؛ نه کار DB طولانی sync داخل emit.
- جزئیات در `types.md → قرارداد Event: Post-Commit`.
