# فیچر: Price Fetching (دریافت قیمت‌ها)

## توضیح کلی
این فیچر مسئول دریافت، ذخیره و نگهداری قیمت‌های لحظه‌ای/دوره‌ای دارایی‌ها از منابع بیرونی (API) است — مستقل از فیچرهای سرمایه‌گذاری (Crypto، Stocks Iran، FIF، Metals).  
فیچرهای سرمایه‌گذاری برای محاسبه سود/زیان تحقق‌نیافته (Unrealized P&L) و ارزش پرتفوی، آخرین قیمت هر نماد را از این فیچر می‌خوانند؛ خودشان هرگز مستقیماً به API بیرونی وصل نمی‌شوند. این جداسازی باعث می‌شود منبع قیمت، فرکانس دریافت و کش آفلاین در یک‌جا مدیریت شود.

این فیچر بر خلاف بقیه فیچرهای مالی، **هیچ تراکنشی در `acc_transactions` ثبت نمی‌کند** و ارتباطی به موجودی حساب‌ها ندارد — صرفاً یک منبع داده Read/Cache برای بقیه سیستم است.

> **مرز این فیچر با «سیاست دسترسی به شبکه» کل اپ**: قانون کلی اپ این است که هیچ بخشی بدون اجازه صریح کاربر آنلاین نمی‌شود (به `Technical-Architecture.md` بخش «سیاست دسترسی به شبکه» مراجعه کنید). آن سند دو استثنای محدود و بی‌ربط به داده مالی کاربر را مجاز کرده: **بررسی نسخه برنامه** (Version Check، خودکار و بی‌صدا در Startup) و در آینده **اعتبارسنجی لایسنس** (با Grace Period طولانی برای آفلاین‌ماندن). این دو استثنا **هیچ داده مالی کاربر را لمس نمی‌کنند و به `19-Price-Fetching` مرتبط نیستند**. دریافت قیمت دارایی — چون به دارایی‌های واقعی و حساس کاربر وابسته است — همچنان فقط با کلیک صریح یا Auto-Sync ای که خودِ کاربر روشن کرده انجام می‌شود؛ این یک استثنای سوم نیست.

---

## استاندارد مشترک بین دسته‌های دارایی (Crypto / Stocks Iran / FIF / Metals)

هر چهار دسته دارایی سرمایه‌گذاری پروژه از همین یک استاندارد پیروی می‌کنند، اما چون ماهیت بازارشان واقعاً متفاوت است، جزئیات Fetch هرکدام در سند زیرفیچر خودشان می‌آید. جدول زیر تفاوت‌های کلیدی را که باعث می‌شود نتوان یک کد Fetch واحد برای همه نوشت خلاصه می‌کند:

| دسته | شناسه قیمت‌گیری | واحد قیمت رایج | وضعیت API عمومی | حالت غالب در نسخه ۱ |
|---|---|---|---|---|
| Crypto | `symbol` (BTC, ETH, ...) | USDT | API عمومی استاندارد و شناخته‌شده فراوان (CoinGecko و مشابه) | خودکار/دستی هر دو کاملاً عملی |
| Stocks Iran | `symbol` (نماد بورسی، مثل فولاد) | ریال | منبع نیمه‌رسمی TSETMC/سایت‌های آینه — یک منبع غالب، نه چند منبع رقیب مثل کریپتو | خودکار/دستی هر دو عملی، با یک منبع پیش‌فرض |
| FIF (صندوق) | `fundId` (نه symbol — چون issuance_redemption نماد بورسی ندارد) | NAV به ریال | **هیچ API عمومی یکپارچه‌ای وجود ندارد** — هر صندوق NAV را در سایت خودش منتشر می‌کند | **دستی، Fetch به‌صورت اختیاری per-fund در آینده** |
| Metals | `metalType + purity` (نه symbol تکی) | ریال به ازای هر گرم | منابع نیمه‌رسمی قیمت طلا/سکه ایران (چند منبع رایج) | خودکار/دستی هر دو عملی |

نتیجه عملی: زیرساخت (`price_sources`, `price_history`, `price_sync_settings`, قوانین آفلاین/Batch/Partial-Success) برای هر چهار دسته **کاملاً یکسان** است؛ تنها چیزی که در هر زیرفیچر جدا تعریف می‌شود «شناسه قیمت‌گیری» و «منبع/الگوریتم Fetch» است. به همین دلیل ستون `symbol` در `price_history` باید مقادیر غیر رمزارزی هم بپذیرد — برای FIF مقدار آن `fundId` (به‌صورت رشته UUID) و برای Metals مقدار آن `{metalType}_{purity}` (مثلاً `gold_18k`) خواهد بود؛ این‌ها همچنان یک رشته یکتا در ستون `symbol` هستند، فقط معنای دامنه‌ای متفاوتی دارند که در `assetCategory` مشخص می‌شود.

---

## زیرفیچرها (به ترتیب اولویت پیاده‌سازی)

| # | زیرفیچر | وضعیت نسخه ۱ |
|---|---|---|
| ۱۹.۱ | [Crypto Prices](./19-01-Crypto-Prices/Crypto-Prices.md) | Must Have |
| ۱۹.۲ | [Stock Prices (سهام ایران)](./19-02-Stock-Prices/Stock-Prices.md) | Must Have |
| ۱۹.۳ | [Fund NAV (صندوق‌های درآمد ثابت)](./19-03-Fund-NAV/Fund-NAV.md) | Must Have |
| ۱۹.۴ | [Metals Prices (طلا و فلزات)](./19-04-Metals-Prices/Metals-Prices.md) | Must Have |
| ۱۹.۵ | Housing / Real Estate Prices (مسکن) | آینده (Could Have) |

هر چهار زیرفیچر Must Have (کریپتو، سهام ایران، NAV صندوق، فلزات) در نسخه ۱ روی همان استاندارد مشترک این سند پیاده می‌شوند — با تفاوت‌هایی در نحوه Fetch که به دلیل تفاوت واقعی بازارها اجتناب‌ناپذیر است (بخش «استاندارد مشترک بین دسته‌های دارایی» پایین). فقط Housing برای آینده باقی مانده چون در نسخه ۱ فیچر Physical Assets اصلاً دارایی مسکن را با ارزش‌گذاری دستی دوره‌ای مدیریت می‌کند، نه با قیمت لحظه‌ای بازار.

---

## اصل پایه: Offline-First واقعی (نه فقط شعار)

این فیچر تنها بخشی از سیستم است که ذاتاً به شبکه نیاز دارد — دقیقاً به همین دلیل باید محتاط‌ترین بخش از نظر رفتار آفلاین باشد. سه قانون سخت‌گیرانه زیر بر همه‌چیز در این سند اولویت دارند:

1. **اپ هرگز خودش، بدون اجازه صریح کاربر، به اینترنت وصل نمی‌شود.** نه در Onboarding، نه در باز شدن اپ، نه در پس‌زمینه — مگر کاربر یکی از دو حالت زیر را از قبل روشن کرده باشد: (الف) خودش دکمه «دریافت قیمت» را در همین لحظه زده، یا (ب) از تنظیمات، «به‌روزرسانی خودکار» را صریحاً فعال کرده (بخش «حالت خودکار» پایین).
2. **باز کردن اپ، دیدن صفحه سرمایه‌گذاری، محاسبه پرتفوی، ساخت گزارش، Snapshot، Dashboard — هیچ‌کدام هرگز باعث یک Network Request خودکار نمی‌شوند.** همه این‌ها فقط از `price_history` (دادهٔ محلی) می‌خوانند.
3. **نبود اینترنت هرگز خطا یا مانع در بقیه اپ ایجاد نمی‌کند.** اگر کاربر دکمه دریافت را بزند و آفلاین باشد، فقط یک پیام کوتاه («اتصال اینترنت برقرار نیست») نشان داده می‌شود و همان لحظه با قیمت‌های کش‌شده قبلی ادامه کار می‌دهد.

## دو مسیر دریافت قیمت (هر دو در نسخه ۱)

### مسیر ۱ — ثبت دستی قیمت (Manual Entry) — همیشه در دسترس، کاملاً آفلاین
کاربر برای هر نمادی که خودش دارد (مثلاً یک رمزارز کمیاب که در هیچ API نیست، یا وقتی اصلاً نمی‌خواهد آنلاین شود) می‌تواند مستقیماً عدد قیمت را وارد کند. این مسیر به هیچ شبکه‌ای نیاز ندارد و همیشه، حتی در حالت کاملاً Airplane Mode، کار می‌کند.

### مسیر ۲ — دریافت از API (Fetch) — با دو زیرحالت
- **دستی/On-Demand:** کاربر روی دکمه «دریافت قیمت‌ها» کلیک می‌کند → سیستم **فقط همان یک بار** به اینترنت وصل می‌شود، نتیجه را می‌گیرد، ذخیره می‌کند و تمام.
- **خودکار/Auto-Sync (اختیاری، Opt-in):** اگر کاربر از تنظیمات فعالش کرده باشد، تا وقتی اپ **باز و در Foreground** است و مرورگر گزارش می‌دهد که آنلاین است (`navigator.onLine`)، هر `syncIntervalMinutes` دقیقه یک‌بار خودش Batch را صدا می‌زند. این حالت **پیش‌فرض خاموش** است؛ کاربر باید صریحاً روشنش کند (طبق قانون ۱ بالا). اپ بسته یا در پس‌زمینه یا آفلاین → auto-sync اصلاً اجرا نمی‌شود (نسخه ۱ از Background Sync واقعی سرویس‌ورکر استفاده نمی‌کند، فقط از یک تایمر سبک وقتی تب باز است — به همین دلیل مصرف باتری/داده کنترل‌شده می‌ماند).

هر دو مسیر در همان جدول `price_history` ذخیره می‌شوند؛ تنها تفاوتشان فیلد `source` رکورد است (`manual` در برابر `api`، به بخش «Domain Entities» نگاه کنید) — از نظر بقیه سیستم (`getLatestPrice`) کاملاً یکسان مصرف می‌شوند.

---

## Business Rules (مشترک بین همه زیرفیچرها)

1. هر منبع قیمت (Provider) به‌صورت مستقل در `price_sources` تعریف می‌شود؛ هر نماد می‌تواند از چند منبع قیمت بگیرد (مثلاً BTC هم از منبع A هم از منبع B).
2. دریافت از API همیشه با اراده کاربر شروع می‌شود — یا با کلیک دستی، یا (در صورت فعال بودن) با تایمر Auto-Sync که خودِ کاربر روشنش کرده. **هیچ حالت سومی وجود ندارد.**
3. هر بار دریافت موفق (چه دستی، چه Auto-Sync، چه ثبت دستی کاربر)، یک رکورد جدید در `price_history` اضافه می‌شود (Append-Only) — قیمت‌های قبلی هرگز overwrite/حذف نمی‌شوند تا امکان نمودار تاریخچه قیمت حفظ شود.
4. آخرین قیمت هر نماد از طریق `getLatestPrice(symbol, targetCurrency?)` خوانده می‌شود؛ این تابع همیشه جدیدترین رکورد `price_history` را برمی‌گرداند (فارغ از این‌که منبعش `manual` بوده یا `api`)، نه میانگین.
5. **قبل از هر تلاش برای اتصال (چه دستی چه Auto-Sync)**، سیستم ابتدا `navigator.onLine` را چک می‌کند؛ اگر `false` باشد، حتی تلاش برای Request هم نمی‌شود — مستقیم پیام «آفلاین هستید» نشان داده می‌شود (نه Timeout و نه Retry بی‌مورد که باتری/داده هدر بدهد). اگر `navigator.onLine = true` بود ولی Request واقعاً شکست خورد (سرور در دسترس نیست)، همان رفتار قاعده ۷ (Partial/Full Failure) اجرا می‌شود.
6. اگر اتصال اینترنت یا API در دسترس نباشد، آخرین قیمت کش‌شده (آخرین رکورد `price_history`، صرف‌نظر از `manual`/`api` بودنش) همراه با برچسب «قیمت قدیمی — آخرین به‌روزرسانی: [تاریخ/ساعت]» نمایش داده می‌شود؛ خطای دریافت هرگز نباید مانع کارکرد بقیه اپ (دیدن پرتفوی، ثبت تراکنش جدید و ...) شود.
7. **سیاست API Key — تصمیم صریح نسخه ۱ (باگ ۳۷)**:
   - کلید API **هرگز** در SQLite / `price_sources` / هر جدول دیگری ذخیره نمی‌شود.
   - کلید API **هرگز** به‌صورت plaintext در LocalStorage نوشته نمی‌شود.
   - **نسخه ۱ — فقط Session Storage** (از طریق `sessionStorageService`):
     - کلید تا وقتی تب/پنجره باز است زنده می‌ماند.
     - با **بستن tab** یا پایان سشن مرورگر، کلید پاک می‌شود.
     - کاربر در اولین `fetch` یا وقتی Auto-Sync به منبع `requiresApiKey=true` برسد و کلید نباشد، باید دوباره وارد کند (پرامپت در Settings یا مودال دریافت قیمت).
   - **UX الزامی وقتی کلید نیست**:
     - دکمه «دریافت قیمت‌ها» → مودال «API Key لازم است» با فیلد ورود + لینک به محل دریافت کلید Provider؛ پس از ورود، فقط در Session Storage ذخیره و همان لحظه Fetch ادامه می‌یابد.
     - Auto-Sync → آن منبع Skip می‌شود؛ در UI وضعیت «کلید API وارد نشده — Sync انجام نشد»؛ **هیچ** Request بی‌کلید و **هیچ** پرامپت مزاحم تکراری در پس‌زمینه.
   - **عمداً خارج از نسخه ۱** (مسیر آینده، نه پیاده‌سازی الان):
     - «Remember on this device» با رمزنگاری Web Crypto (AES-GCM) در LocalStorage
     - Credential Vault / اتصال به قفل اپ (PIN/biometrics) برای باز کردن کلید
   - دلیل انتخاب Session-only در v1: سادگی، هم‌خوانی با Privacy-First، و اجتناب از ذخیره بلندمدت راز در مرورگر بدون زیرساخت رمزنگاری کامل. هزینه UX (ورود مجدد پس از بستن tab) برای Providerهای اختیاری قیمت قابل‌قبول است؛ بسیاری از منابع نسخه ۱ اصلاً کلید نمی‌خواهند.
8. اگر دریافت قیمت یک نماد شکست بخورد (Network Error، Rate Limit، نماد ناموجود در API)، فقط همان نماد Skip می‌شود و خطا در نتیجه نهایی گزارش می‌شود؛ بقیه نمادهای درخواستی در همان دسته باید دریافت شوند (Partial Success مجاز است) — این قانون برای دسته‌های بزرگ (صدها نماد) هم صدق می‌کند، به بخش «دریافت انبوه» پایین نگاه کنید.
9. تبدیل قیمت به ارز پایه کاربر (`cur_currency_preferences.baseCurrency`) در لحظه دریافت انجام **نمی‌شود**؛ `price_history` قیمت را دقیقاً در همان ارزی که API برگردانده ذخیره می‌کند (`priceCurrency`) و تبدیل به ارز پایه در لایه Domain هنگام مصرف (مثل `getPortfolioValue`) با `cur_exchange_rates` انجام می‌شود — تا اگر نرخ ارز پایه بعداً عوض شود، نیازی به واکشی دوباره قیمت‌ها نباشد.
10. ثبت دستی قیمت (`source = 'manual'`) هیچ محدودیت شبکه‌ای ندارد و همیشه، حتی کاملاً آفلاین، ممکن است؛ اما فقط برای نمادهایی مجاز است که کاربر واقعاً در `inv_*_holdings` دارد (نمی‌توان برای نماد ناموجود قیمت دستی ثبت کرد چون معنایی ندارد).

---

## حالت خودکار (Auto-Sync) — تنظیمات

Auto-Sync در سطح هر «نماد + منبع» با یک رکورد در جدول `price_sync_settings` کنترل می‌شود، نه یک سوییچ سراسری واحد — چون ممکن است کاربر بخواهد فقط چند رمزارز اصلی‌اش را خودکار تازه نگه دارد ولی بقیه را دستی بزند.

- در صفحه تنظیمات، کاربر می‌تواند «به‌روزرسانی خودکار» را برای یک دسته دارایی (مثلاً «همه کریپتوهای من») یا تک‌تک نمادها روشن/خاموش کند.
- `syncIntervalMinutes` قابل تنظیم است (پیش‌فرض پیشنهادی: ۱۵ دقیقه)؛ حداقل مجاز باید محدود شود (مثلاً حداقل ۵ دقیقه) تا فشار غیرضروری روی API نگذارد.
- اگر تب/اپ بسته شود یا کاربر آفلاین شود، تایمر متوقف می‌شود؛ با باز شدن دوباره اپ (و آنلاین بودن)، اگر از آخرین Sync بیش از `syncIntervalMinutes` گذشته باشد، فوراً یک Sync اجرا می‌شود، بعد تایمر از نو شروع می‌شود — **اما این هم فقط وقتی است که کاربر Auto-Sync را از قبل روشن کرده**.
- کاربر همیشه می‌تواند در همان لحظه هم Auto-Sync را ببیند (چه زمانی آخرین Sync خودکار انجام شده) و هم مستقل از آن دکمه دستی «دریافت الان» را بزند.

---

## Domain Entities (مشترک)

### ۱. Price Source (جدول: `price_sources`)

- `id` → UUID (Primary Key)
- `name` → string (نام منبع، مثلاً «Nobitex»، «CoinGecko»)
- `assetCategory` → enum (`crypto`, `stock`, `fif`, `metal`) — دسته دارایی‌ای که این منبع پوشش می‌دهد
- `adapterKey` → string (**اجباری** — کلید registry Adapter، مثلاً `coingecko`، `nobitex`، `tsetmc`؛ به بخش Provider Adapter Contract مراجعه شود)
- `baseUrl` → string (آدرس پایه API — در صورت نیاز Adapter)
- `requiresApiKey` → boolean
- `isActive` → boolean
- `notes` → string (nullable)
- `createdAt` → datetime
- `updatedAt` → datetime

### ۲. Price History (جدول: `price_history`) — لاگ Append-Only

- `id` → UUID (Primary Key)
- `sourceId` → UUID (nullable — لینک به `price_sources`؛ برای رکوردهای `source='manual'` مقدارش `null` است)
- `symbol` → string (مثلاً `BTC`, `ETH`؛ برای زیرفیچرهای آینده: نماد سهام، کد ملک و ...)
- `assetCategory` → enum (`crypto`, `stock`, `housing`, `metal`)
- `price` → decimal (قیمت — با `decimal.js`)
- `priceCurrency` → string (ارزی که قیمت در آن ثبت شده، معمولاً `USDT` یا `IRR`)
- `source` → enum (`manual`, `api`) — منشأ این رکورد؛ فیلد اصلی برای تفکیک دو مسیر بخش «دو مسیر دریافت قیمت»
- `triggeredBy` → enum (`user_click`, `auto_sync`, `manual_entry`) — دقیقاً چه چیزی این رکورد را ایجاد کرده (برای UI و لاگ شفافیت بیشتر از `source` می‌دهد: مثلاً `source='api'` می‌تواند هم از `user_click` باشد هم از `auto_sync`)
- `fetchedAt` → datetime (لحظه دریافت/ثبت واقعی)
- `createdAt` → datetime

> **نکته**: `price_history` هرگز توسط فیچرهای سرمایه‌گذاری مستقیماً نوشته نمی‌شود؛ فقط از طریق APIهای همین فیچر (`fetchAndStorePrices` یا `setManualPrice`) پر می‌شود. فیچرهای دیگر فقط Read دارند (`getLatestPrice`).

### ۳. Price Sync Settings (جدول: `price_sync_settings`) — تنظیمات Auto-Sync

- `id` → UUID (Primary Key)
- `scope` → enum (`asset_category`, `symbol`) — آیا این تنظیم روی کل یک دسته دارایی اعمال می‌شود یا فقط یک نماد خاص
- `assetCategory` → enum (nullable — وقتی `scope='asset_category'`)
- `symbol` → string (nullable — وقتی `scope='symbol'`؛ برای Override یک نماد خاص، مستقل از تنظیم کلی دسته‌اش)
- `autoSyncEnabled` → boolean (پیش‌فرض: `false`)
- `syncIntervalMinutes` → integer (پیش‌فرض پیشنهادی: ۱۵؛ حداقل مجاز در Validation لایه Domain، نه دیتابیس، اعمال شود — مثلاً ≥ ۵)
- `lastSyncAt` → datetime (nullable)
- `createdAt` / `updatedAt` → datetime

> **قاعده اولویت**: اگر برای یک نماد مشخص رکورد `scope='symbol'` وجود داشته باشد، همان معتبر است (Override)؛ در غیر این صورت تنظیم `scope='asset_category'` همان دسته اعمال می‌شود؛ اگر هیچ‌کدام نبود، پیش‌فرض سیستم `autoSyncEnabled=false` است (یعنی سکوت = خاموش، طبق اصل Offline-First بالا).

---

## Provider Adapter Contract (باگ ۳۶ — High)

هر منبع قیمت بیرونی **فقط** از طریق یک Adapter پیاده‌سازی می‌شود. Domain و Application هرگز SDK/URL/پارس اختصاصی یک Provider را مستقیم صدا نمی‌زنند؛ در غیر این صورت با افزودن Provider دوم معماری ماژولار از بین می‌رود.

### محل کد (پیشنهادی)

```text
features/19-Price-Fetching/
├── domain/
│   └── PriceProviderAdapter.ts    # فقط interface + انواع مشترک
├── application/
│   └── fetchAndStorePrices.ts     # فقط به interface وابسته است
└── infrastructure/providers/
    ├── coingeckoAdapter.ts
    ├── nobitexAdapter.ts
    ├── tsetmcAdapter.ts
    ├── metalIranAdapter.ts
    └── index.ts                   # registry: sourceId → adapter
```

### Interface واحد (اجباری برای همه Providerها)

```typescript
/** پاسخ خام یک نماد پس از نرمال‌سازی Adapter — قبل از نوشتن در price_history */
export interface NormalizedPriceQuote {
  symbol: string;           // نماد داخلی سیستم (پس از normalizeSymbol)
  price: string;            // decimal به‌صورت string
  priceCurrency: string;    // ISO یا USDT / IRR
  fetchedAt: string;        // ISO datetime معتبر
  rawSymbol?: string;       // نماد اصلی Provider (برای دیباگ)
}

export interface ProviderFetchResult {
  succeeded: NormalizedPriceQuote[];
  failed: Array<{ symbol: string; reason: string }>;
  skipped: Array<{ symbol: string; reason: string }>;
}

/**
 * قرارداد اجباری هر Provider.
 * Domain فقط این متدها را می‌شناسد؛ جزئیات HTTP/JSON داخل Adapter می‌ماند.
 */
export interface PriceProviderAdapter {
  /** شناسه پایدار Adapter — با price_sources.id یا یک کلید منطقی مثل 'coingecko' */
  readonly adapterKey: string;
  /** دسته‌هایی که این Adapter پوشش می‌دهد */
  readonly supportedAssetCategories: Array<'crypto' | 'stock' | 'fif' | 'metal'>;
  /** حداکثر نماد در یک Request (برای Bulk Fetch) */
  readonly maxBatchSize: number;

  /**
   * دریافت قیمت‌ها از API بیرونی.
   * ورودی: نمادهای **داخلی** سیستم (نه لزوماً فرمت Provider).
   * خروجی: فقط NormalizedPriceQuote — نه JSON خام Provider.
   */
  fetchPrices(
    symbols: string[],
    options?: { apiKey?: string; signal?: AbortSignal }
  ): Promise<ProviderFetchResult>;

  /** تبدیل نماد داخلی ↔ نماد Provider (دو طرفه در صورت نیاز) */
  normalizeSymbol(symbol: string, direction: 'toProvider' | 'toInternal'): string;

  /**
   * استخراج و اعتبارسنجی قیمت از payload خام یک آیتم.
   * باید decimal معتبر و > 0 برگرداند؛ در غیر این صورت throw یا null.
   */
  normalizePrice(rawItem: unknown): string | null;

  /**
   * استخراج زمان معتبر از پاسخ.
   * اگر Provider timestamp ندهد، Adapter می‌تواند «الان» را برگرداند ولی باید صریح باشد.
   */
  validateTimestamp(rawItem: unknown): string | null; // ISO datetime

  /**
   * استخراج/ثابت‌کردن ارز قیمت.
   * مثلاً CoinGecko ممکن است vs_currencies=usd بدهد → Adapter به USDT/USD نگاشت می‌کند.
   */
  validateCurrency(rawItem: unknown): string | null;
}
```

### قوانین معماری

1. **هیچ Providerی مستقیم وارد Domain نمی‌شود.** فقط `infrastructure/providers/*` این interface را implement می‌کند.
2. `fetchAndStorePrices` در Application لایه فقط `PriceProviderAdapter` را از registry می‌گیرد (`getAdapter(sourceId)`) و `fetchPrices` را صدا می‌زند؛ سپس `NormalizedPriceQuote` را در `price_history` می‌نویسد.
3. افزودن Provider جدید = یک فایل Adapter جدید + یک ردیف در `price_sources` — **بدون تغییر** در Domain، Crypto/Stocks/FIF/Metals، یا UI.
4. اگر Adapter یکی از متدهای نرمال‌سازی را ناقص پیاده کند (مثلاً `normalizePrice` همیشه null بدهد)، آن نماد در `failed[]` می‌رود؛ Partial Success حفظ می‌شود.
5. `normalizeSymbol` باید برای همه دسته‌ها کار کند:
   - Crypto: `BTC` ↔ `bitcoin` (بسته به Provider)
   - Stock: نماد بورسی عیناً یا نگاشت آینه
   - FIF: `fundId` (UUID) معمولاً بدون تغییر
   - Metals: `gold_18k` ↔ کد داخلی منبع طلا
6. `validateCurrency` خروجی را به یکی از ارزهای مجاز پروژه محدود می‌کند (`IRR`, `USDT`, `USD`, ... طبق `types.md`).
7. تست واحد: هر Adapter باید با fixture JSON ثابت تست شود (normalize + validate) بدون شبکه.

### اتصال به `price_sources`

| فیلد موجود / جدید | نقش |
|-------------------|-----|
| `id` | UUID رکورد منبع |
| `name` | نام نمایشی |
| `assetCategory` | دسته |
| `baseUrl` | اختیاری برای Adapterهایی که URL ثابت دارند |
| `requiresApiKey` | اگر true، Application کلید را **فقط از Session Storage** می‌خواند و به `options.apiKey` می‌دهد؛ اگر نبود → Skip + پیام UX (باگ ۳۷) |
| `adapterKey` | **جدید (اجباری)** — کلید registry برای پیدا کردن کلاس Adapter (مثلاً `coingecko`) |
| `isActive` | فعال/غیرفعال |

بدون `adapterKey` معتبر، `fetchAndStorePrices` نباید شبکه را صدا بزند و باید با خطای واضح برگردد.

### جریان فراخوانی

```text
UI / Auto-Sync
    → fetchAndStorePrices(symbols, sourceId, triggeredBy)
        → load price_sources row
        → getAdapter(row.adapterKey)   // registry
        → adapter.fetchPrices(symbols) // داخلش: normalizeSymbol → HTTP → normalizePrice/Currency/Timestamp
        → write NormalizedPriceQuote[] to price_history
        → emit PriceFetchCompleted
```

---

## APIهای داخلی (مشترک)

### مدیریت منبع و تاریخچه
- `getAllSources(assetCategory?)`
- `createSource(data)` / `updateSource(id, data)`
- `getLatestPrice(symbol, targetCurrency?)` → آخرین قیمت کش‌شده یک نماد (از هر دو منبع `manual`/`api`)
- `getPriceHistory(symbol, dateRange?)` → برای نمودار تاریخچه قیمت

### دریافت از API (هر دو زیرحالت دستی و خودکار از همین یک تابع رد می‌شوند)
- `fetchAndStorePrices(symbols[], sourceId, triggeredBy: 'user_click' | 'auto_sync')`:
  1. چک `navigator.onLine` — اگر `false`، بلافاصله برمی‌گردد با `{ skipped: true, reason: 'offline' }` و هیچ Request ای نمی‌رود.
  2. ردیف `price_sources` را می‌خواند؛ بدون `adapterKey` معتبر خطا می‌دهد و شبکه را صدا نمی‌زند.
  3. اگر `requiresApiKey=true`: کلید را از `sessionStorageService.getPriceApiKey(sourceId)` بخواند.
     - نبود کلید + `user_click` → برگرداندن `{ skipped: true, reason: 'api_key_required' }` تا UI مودال ورود را نشان دهد (باگ ۳۷).
     - نبود کلید + `auto_sync` → Skip همان منبع بدون پرامپت؛ وضعیت در UI.
  4. Adapter را از registry با `getAdapter(adapterKey)` می‌گیرد (فقط `PriceProviderAdapter` — نه SDK اختصاصی).
  5. نمادها را طبق «دریافت انبوه» و `adapter.maxBatchSize` به Batch تقسیم می‌کند.
  6. برای هر Batch: `adapter.fetchPrices(batch, { apiKey })` → فقط `NormalizedPriceQuote`؛ سپس ذخیره در `price_history` با `source='api'` و `triggeredBy`.
  7. اگر `triggeredBy='auto_sync'` بود، `price_sync_settings.lastSyncAt` را آپدیت می‌کند.
  8. خروجی `ProviderFetchResult` / ساختار `succeeded[]`/`failed[]`/`skipped[]`.

### ثبت دستی (کاملاً آفلاین)
- `setManualPrice(symbol, price, priceCurrency)` → رکورد جدید با `source='manual'`, `triggeredBy='manual_entry'`, `sourceId=null` در `price_history` اضافه می‌کند. هیچ چک آنلاین/آفلاین ندارد چون به شبکه نیازی ندارد.

### مدیریت Auto-Sync
- `getSyncSettings(scope, assetCategory?, symbol?)`
- `setSyncSettings(data)` → روشن/خاموش کردن و تنظیم `syncIntervalMinutes` برای یک دسته یا یک نماد
- `runDueAutoSyncs()` → روی همه رکوردهای `autoSyncEnabled=true` که `now - lastSyncAt >= syncIntervalMinutes` است چک می‌کند و برای هرکدام `fetchAndStorePrices(..., triggeredBy='auto_sync')` را صدا می‌زند؛ این تابع فقط از تایمر داخل اپ (وقتی تب باز و آنلاین است) صدا زده می‌شود، نه از بیرون.

---

## دریافت انبوه (Bulk Fetch) — وقتی تعداد نمادها زیاد است

سیستم باید بتواند هم برای ۲-۳ نماد و هم برای فهرست بزرگ (صدها نماد، مثلاً وقتی می‌خواهیم بعداً همه نمادهای موجود در یک Provider را کش کنیم) به‌درستی کار کند:

1. نمادهای درخواستی به Batchهای با اندازه ثابت (مثلاً حداکثر ۱۰۰ نماد در هر Request، بسته به محدودیت مستند API انتخابی) تقسیم می‌شوند — نه یک Request جدا به ازای هر نماد (فشار غیرضروری و کند) و نه یک Request بی‌نهایت‌بزرگ (ریسک Timeout/Rate Limit).
2. Batchها **پشت‌سرهم و با فاصله کوتاه** (نه هم‌زمان/Parallel بی‌کنترل) ارسال می‌شوند تا از Rate Limit سرویس بیرونی رد نشویم.
3. شکست یک Batch باعث توقف بقیه Batchها نمی‌شود؛ نتیجه نهایی، ترکیب `succeeded[]`/`failed[]` همه Batchها است (تعمیم قاعده Partial Success به سطح Batch).
4. در UI، حین دریافت انبوه یک نوار پیشرفت («۱۲۰ از ۴۵۰ نماد دریافت شد») نمایش داده می‌شود، نه یک Loading ساده بدون بازخورد — چون ممکن است چند ثانیه طول بکشد.

---

## روابط با سایر فیچرها

- **Investment - Crypto / Stocks Iran / FIF / Metals**: این فیچرها برای محاسبه Unrealized P&L و ارزش لحظه‌ای پرتفوی فقط از `getLatestPrice()` می‌خوانند؛ خودشان هرگز API خارجی صدا نمی‌زنند و هرگز خودشان تصمیم به آنلاین‌شدن نمی‌گیرند. برای FIF، تابع `updateNAV(fundId, nav, date)` خودِ فیچر Investment در واقع یک لایه نازک روی `setManualPrice`/`fetchAndStorePrices` همین فیچر است (به `19-03-Fund-NAV` مراجعه شود) تا NAV هم در `inv_fif_holdings.currentNAV` (برای سرعت) و هم در `price_history` (برای تاریخچه و استاندارد یکپارچه) ثبت شود. **توجه (باگ ۳۴)**: این مسیر فقط NAV را تأمین می‌کند؛ قیمت صدور/ابطال در `inv_fif_transactions.transactionPrice` ثبت می‌شود و مبنای میانگین خرید و Realized P&L است.
- **Portfolio & Wealth Overview**: استفاده از آخرین قیمت‌ها برای Snapshot ارزش کل ثروت — کاملاً از دادهٔ محلی، بدون هیچ اتصال شبکه.
- **Currency & Multi-Currency**: تبدیل نهایی قیمت به ارز پایه کاربر با `cur_exchange_rates` انجام می‌شود، نه در همین فیچر.
- **Settings & Tools**: مدیریت منابع قیمت و تنظیمات Auto-Sync (`price_sync_settings`) از صفحه تنظیمات انجام می‌شود؛ این فیچر صفحه مستقل در ناوبری اصلی ندارد (طبق اصل «صفحات کم» در `Pages-IA.md`) و به‌صورت دکمه «دریافت قیمت‌ها» + سوییچ «به‌روزرسانی خودکار» داخل صفحه «سرمایه‌گذاری» (`/investments`) و بخش تنظیمات (`/settings`) نمایش داده می‌شود.

---

## مسیر ارتقا (آینده)

- **زیرفیچرهای بعدی**: Stock Prices، Housing Prices، Metals Prices — هرکدام با همان جداول مشترک (`price_sources`, `price_history`, `price_sync_settings`) و فقط منطق Fetch/Parse مخصوص به خودشان، طبق الگوی `19-01-Crypto-Prices`.
- **چند منبع همزمان با اولویت‌بندی**: امکان تعریف منبع «اصلی» و «پشتیبان» برای هر نماد و Fallback خودکار در صورت شکست منبع اصلی.
- **Background Sync واقعی**: در صورت نیاز به دریافت حتی وقتی تب بسته است، از Periodic Background Sync سرویس‌ورکر استفاده شود؛ این هم‌چنان باید Opt-in و تابع همان سه قانون Offline-First بالا باشد (هیچ اتصال بی‌اجازه کاربر).
