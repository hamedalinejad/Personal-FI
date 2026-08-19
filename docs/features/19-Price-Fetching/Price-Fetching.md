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

نتیجه عملی: زیرساخت (`price_sources`, `price_history`, `price_sync_settings`, قوانین آفلاین/Batch/Partial-Success) برای هر چهار دسته **کاملاً یکسان** است؛ تنها چیزی که در هر زیرفیچر جدا تعریف می‌شود «شناسه قیمت‌گیری» و «منبع/الگوریتم Fetch» است. ستون `instrumentId` در `price_history` شناسه اصلی دارایی است و باید مقادیر غیر رمزارزی هم بپذیرد — برای FIF مقدار آن `fundId` (به‌صورت رشته UUID)، برای Metals مقدار آن `{metalType}_{purity}` (مثلاً `gold_18k`)، برای Crypto **فقط** `assetKey` (هرگز symbol خام)، و برای Stocks = instrumentId پایدار (ISIN/UUID؛ نه symbol نمایشی)؛ فیلد `assetCategory` در کنار `instrumentId` همیشه برای تفکیک معنایی الزامی است. ستون قدیمی `symbol` صرفاً برای نمایش/سازگاری legacy نگه داشته شده و به‌عنوان شناسه اصلی **deprecated** است (جزئیات در بخش شناسه قیمت.

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

هر دو مسیر در `price_history` ذخیره می‌شوند (`source = manual | api`).

**سیاست اولویت Manual در برابر API**:
- `getLatestPrice` به‌ترتیب: (1) اگر رکورد `manual` با `manualExpiresAt` خالی یا در آینده وجود دارد و از آخرین API جدیدتر یا مساوی است → Manual؛ (2) در غیر این صورت جدیدترین رکورد معتبر (API یا Manual منقضی‌شده) بر اساس `fetchedAt` و `priority` منبع.
- `setManualPrice(..., { expiresAt?: ISO })` می‌تواند اعتبار محدود بدهد؛ بدون `expiresAt` = تا وقتی کاربر پاک کند یا API صریح با `overrideManual: true` در fetch (پیش‌فرض fetch **override نمی‌کند** Manual غیرمنقضی).
- UI باید منبع (`manual`/`api`) و `isStale` را نشان دهد.

---

## Business Rules (مشترک بین همه زیرفیچرها)

1. هر منبع قیمت (Provider) به‌صورت مستقل در `price_sources` تعریف می‌شود؛ هر نماد می‌تواند از چند منبع قیمت بگیرد (مثلاً BTC هم از منبع A هم از منبع B).
2. دریافت از API همیشه با اراده کاربر شروع می‌شود — یا با کلیک دستی، یا (در صورت فعال بودن) با تایمر Auto-Sync که خودِ کاربر روشنش کرده. **هیچ حالت سومی وجود ندارد.**
3. هر بار دریافت **معتبر** (پس از Domain Validation )، یک رکورد جدید در `price_history` اضافه می‌شود (Append-Only) — قیمت‌های قبلی overwrite/حذف نمی‌شوند.
4. آخرین قیمت از `getLatestPrice({ assetCategory, instrumentId, priceCurrency?, quoteMarket?, sourceId? })` خوانده می‌شود: جدیدترین رکورد معتبر `price_history` (نه میانگین). خروجی **همیشه** شامل `fetchedAt`, `priceAgeMs`, `isStale`, `staleAfterMs` است — هرگز «قیمت ۳ روزه» را بدون برچسب stale به‌عنوان current خام ارائه ندهد.
4b. **Domain Validation قبل از ذخیره — اجباری در Application، نه فقط در Adapter**:
 قبل از INSERT در `price_history` همه این‌ها باید پاس شوند؛ در غیر این صورت نماد در `failed[]` با `failureKind='validation_error'` می‌رود و **چیزی نوشته نمی‌شود**:
 - `symbol` غیرخالی و مطابق شناسه داخلی دسته
 - `price` عدد معتبر با `decimal.js` و **`price > 0`** (صفر، منفی، null، NaN رد)
 - `priceCurrency` در مجموعه مجاز پروژه
 - `fetchedAt` تاریخ/زمان parseپذیر؛ **اگر بیش از ۲ دقیقه از now جلوتر باشد رد می‌شود** — قیمت آینده نمی‌تواند latest/fresh شود
 - `sourceId` برای مسیر api معتبر و `isActive`
 - اختیاری ولی توصیه‌شده: اگر `|price - lastPrice| / lastPrice` از آستانه غیرعادی (مثلاً ۹۰٪ در یک بازه کوتاه) بیشتر بود → رد یا علامت `anomaly` (نسخه ۱: رد با `validation_error` کافی است مگر تنظیم خلاف)
4c. **Idempotency / جلوگیری از duplicate بی‌مورد**:
 - هر فراخوانی `fetchAndStorePrices` یک `fetchRequestId` (UUID) می‌گیرد؛ همه رکوردهای همان اجرا همان `fetchRequestId` را دارند.
 - **Dedupe قبل از INSERT**: اگر برای همان `(assetCategory, symbol, sourceId, price, priceCurrency)` آخرین رکورد موجود با `fetchedAt` در پنجرهٔ کوتاه (مثلاً ۶۰ ثانیه) و همان قیمت باشد (assetCategory در کلید dedupe الزامی است)، INSERT جدید **انجام نمی‌شود** (no-op موفق در `succeeded[]` با پرچم `deduped: true`).
 - دوبار کلیک سریع کاربر دو Request شبکه ممکن است بسازد، ولی تاریخچه با ده‌ها ردیف یکسان پر نمی‌شود.
 - Append-Only برای تغییر واقعی قیمت یا فاصله زمانی بیش از پنجره dedupe همچنان برقرار است (نمودار تاریخچه حفظ می‌شود).
4d. **اولویت منبع**: روی `price_sources` فیلدهای `priority` (عدد؛ کمتر = بالاتر) و `isDefault` (boolean per assetCategory) اجباری‌اند.
 - `getLatestPrice` وقتی چند منبع برای یک نماد رکورد دارند، به‌ترتیب: جدیدترین `fetchedAt` بین منابع فعال؛ در صورت تساوی زمانی، منبع با `priority` بهتر.
 - `fetchAndStorePrices` بدون `sourceId` صریح از منبع `isDefault=true` همان `assetCategory` استفاده می‌کند.
 - Fallback خودکار چندمنبعی کامل = مسیر آینده؛ v1 حداقل priority + isDefault را دارد تا انتخاب Provider بخشی از correctness باشد.
5. **تشخیص شبکه**: `navigator.onLine === true` فقط پیش‌شرط اولیه است و **تضمین دسترسی واقعی به API نیست**.
 - اگر `navigator.onLine === false` → هیچ Request ای زده نمی‌شود؛ `{ skipped: true, reason: 'offline' }`.
 - اگر `onLine === true` ولی درخواست شکست بخورد، خطا باید در یکی از این کلاس‌ها طبقه‌بندی شود (نه یک `failed` مبهم):
 | `failureKind` | معنی | جایگاه در خروجی |
 |---------------|------|-----------------|
 | `network_error` | DNS / اتصال قطع / failed to fetch | `failed[]` |
 | `timeout` | فراتر از مهلت (مثلاً ۱۰–۱۵ ثانیه) | `failed[]` |
 | `http_error` | وضعیت HTTP غیر ۲xx (۴۰۱، ۴۲۹، ۵xx، ...) + `httpStatus` | `failed[]` |
 | `invalid_payload` | JSON نامعتبر یا شکل پاسخ غیرمنتظره | `failed[]` |
 | `validation_error` | پاسخ parse شد ولی از Domain Validation رد شد | `failed[]` |
 | `rate_limit` | محدودیت نرخ (اغلب زیرمجموعه http 429) | `failed[]` |
 | `not_found` | نماد در Provider نیست | `failed[]` |
 | `offline` | `navigator.onLine === false` — بدون Request | `skipped[]` با `reason: 'offline'` |
 | `api_key_required` | منبع `requiresApiKey=true` ولی کلید API در Session Storage نیست | `skipped[]` با `reason: 'api_key_required'` — **نه** `failed[]` |
 > **تفکیک failed/skipped**: `failed[]` فقط برای خطاهایی است که Request واقعاً زده شد و شکست خورد؛ `skipped[]` برای مواردی که عمداً بدون Request رد شدند (`offline`, `api_key_required`). این تمایز در UI هم باید حفظ شود: skipped = «نیاز به اقدام کاربر»، failed = «خطای فنی — Retry مفید است».
 - Partial Success حفظ می‌شود: شکست یک نماد/Batch بقیه را متوقف نمی‌کند.
 - UI می‌تواند برای `timeout`/`network_error` پیام «سرور در دسترس نیست» و برای `validation_error` پیام «داده نامعتبر از منبع» نشان دهد.
6. اگر اتصال اینترنت یا API در دسترس نباشد، آخرین قیمت کش‌شده (آخرین رکورد `price_history`، صرف‌نظر از `manual`/`api` بودنش) همراه با برچسب «قیمت قدیمی — آخرین به‌روزرسانی: [تاریخ/ساعت]» نمایش داده می‌شود؛ خطای دریافت هرگز نباید مانع کارکرد بقیه اپ (دیدن پرتفوی، ثبت تراکنش جدید و ...) شود.
7. **سیاست API Key — تصمیم صریح نسخه ۱**:
 - کلید API **هرگز** در SQLite / `price_sources` / هر جدول دیگری ذخیره نمی‌شود.
 - کلید API **هرگز** به‌صورت plaintext در LocalStorage نوشته نمی‌شود.
 - **نسخه ۱ — فقط Session Storage** (از طریق `sessionStorageService`):
 - کلید تا وقتی تب/پنجره باز است زنده می‌ماند.
 - با **بستن tab** یا پایان سشن مرورگر، کلید پاک می‌شود.
 - کاربر در اولین `fetch` یا وقتی Auto-Sync به منبع `requiresApiKey=true` برسد و کلید نباشد، باید دوباره وارد کند (پرامپت در Settings یا مودال دریافت قیمت).
 - **UX الزامی وقتی کلید نیست**:
 - دکمه «دریافت قیمت‌ها» → مودال «API Key لازم است» با فیلد ورود + لینک به محل دریافت کلید Provider؛ پس از ورود، فقط در Session Storage ذخیره و همان لحظه Fetch ادامه می‌یابد.
 - Auto-Sync → آن منبع Skip می‌شود؛ در خروجی `PriceFetchResult`، نمادهای آن منبع در `skipped[]` با `reason: 'api_key_required'` می‌روند (**نه** در `failed[]`)؛ در UI وضعیت «کلید API وارد نشده — Sync انجام نشد»؛ **هیچ** Request بی‌کلید و **هیچ** پرامپت مزاحم تکراری در پس‌زمینه.
 - **عمداً خارج از نسخه ۱** (مسیر آینده، نه پیاده‌سازی الان):
 - «Remember on this device» با رمزنگاری Web Crypto (AES-GCM) در LocalStorage
 - Credential Vault / اتصال به قفل اپ (PIN/biometrics) برای باز کردن کلید
 - دلیل انتخاب Session-only در v1: سادگی، هم‌خوانی با Privacy-First، و اجتناب از ذخیره بلندمدت راز در مرورگر بدون زیرساخت رمزنگاری کامل. هزینه UX (ورود مجدد پس از بستن tab) برای Providerهای اختیاری قیمت قابل‌قبول است؛ بسیاری از منابع نسخه ۱ اصلاً کلید نمی‌خواهند.
8. اگر دریافت قیمت یک نماد شکست بخورد، فقط همان نماد در `failed[]` با `failureKind` مشخص می‌رود؛ بقیه نمادها ادامه می‌یابند (Partial Success). برای دسته‌های بزرگ به بخش «دریافت انبوه» مراجعه شود.
9. تبدیل قیمت به ارز پایه کاربر (`cur_currency_preferences.baseCurrency`) در لحظه دریافت انجام **نمی‌شود**؛ `price_history` قیمت را دقیقاً در همان ارزی که API برگردانده ذخیره می‌کند (`priceCurrency`) و تبدیل به ارز پایه در لایه Domain هنگام مصرف (مثل `getPortfolioValue`) با `cur_exchange_rates` انجام می‌شود — تا اگر نرخ ارز پایه بعداً عوض شود، نیازی به واکشی دوباره قیمت‌ها نباشد.
10. ثبت دستی قیمت (`source = 'manual'`) هیچ محدودیت شبکه‌ای ندارد و همیشه، حتی کاملاً آفلاین، ممکن است؛ اما فقط برای نمادهایی مجاز است که کاربر واقعاً در `inv_*_holdings` دارد (نمی‌توان برای نماد ناموجود قیمت دستی ثبت کرد چون معنایی ندارد).

---

## حالت خودکار (Auto-Sync) — تنظیمات

Auto-Sync در سطح هر «instrumentId + منبع» با یک رکورد در جدول `price_sync_settings` کنترل می‌شود، نه یک سوییچ سراسری واحد — چون ممکن است کاربر بخواهد فقط چند رمزارز اصلی‌اش را خودکار تازه نگه دارد ولی بقیه را دستی بزند.

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
- `adapterKey` → string (**اجباری** — کلید registry Adapter؛ بخش Provider Adapter Contract)
- `baseUrl` → string (آدرس پایه API — در صورت نیاز Adapter)
- `requiresApiKey` → boolean
- `priority` → integer (**اجباری — **؛ عدد کوچک‌تر = اولویت بالاتر؛ پیش‌فرض مثلاً ۱۰۰)
- `isDefault` → boolean (**اجباری — / **؛ حداکثر یک `isDefault=true` فعال per `assetCategory` — enforce با partial unique index یا trigger: فقط یک ردیف با `(assetCategory) WHERE isDefault=1 AND isActive=1`)
- `isActive` → boolean
- `staleAfterMinutes` → integer (nullable — آستانه کهنگی اختصاصی این منبع؛ اگر null از پیش‌فرض سراسری مثلاً ۲۴×۶۰ دقیقه)
- `notes` → string (nullable)
- `createdAt` → datetime
- `updatedAt` → datetime

### ۲. Price History (جدول: `price_history`) — لاگ Append-Only

- `id` → UUID (Primary Key)
- `sourceId` → UUID (nullable — لینک به `price_sources`؛ برای رکوردهای `source='manual'` مقدارش `null` است)
- `instrumentId` → string (**الزامی** — شناسه پایدار داخلی دارایی؛ برای FIF = `fundId`، crypto = `assetKey`، stock = `instrumentId` پایدار (ISIN/UUID)، metal = `{metalType}_{purity}` — ؛ کوئری‌ها با `assetCategory + instrumentId` فیلتر می‌شوند نه فقط symbol)
- `symbol` → string (**deprecated به‌عنوان شناسه اصلی** — فقط برای سازگاری/نمایش legacy؛ می‌تواند برابر `instrumentId` باشد.
- `assetCategory` → enum (`crypto`, `stock`, `fif`, `metal`) — فقط همین چهار مقدار؛ هم‌راستا با `AssetCategory` در types.md
- `price` → decimal (قیمت — با `decimal.js`)
- `priceCurrency` → string (ارزی که قیمت در آن ثبت شده، معمولاً `USDT` یا `IRR`)
- `quoteType` → enum (`last` | `nav` | `close` | `manual` | `indicative`) (**الزامی** — نوع Quote مالی — /038؛ برای ثبت دستی مقدار `manual` استفاده شود)
- `marketDate` → date (nullable — تاریخ بازار مرتبط با قیمت؛ **الزامی برای stock/fif NAV روزانه**؛ nullable برای crypto لحظه‌ای — ؛ برای fif/stock `getLatestPrice` بر اساس آخرین `marketDate` (سپس fetchedAt) انتخاب می‌کند)
- `source` → enum (`manual`, `api`)
- `triggeredBy` → enum (`user_click`, `auto_sync`, `manual_entry`)
- `fetchRequestId` → UUID (nullable — ؛ برای رکوردهای یک اجرای fetch مشترک؛ manual می‌تواند null باشد)
- `fetchedAt` → datetime (لحظه دریافت/ثبت واقعی — برای stock/fif این با `marketDate` متفاوت است)
- `createdAt` → datetime

> **نکته**: `price_history` فقط از طریق `fetchAndStorePrices` / `setManualPrice` نوشته می‌شود. قبل از هر INSERT، Domain Validation اجباری است. فیچرهای دیگر فقط Read دارند.

> **Stale**: فیلد جدا برای `isStale` در جدول لازم نیست — در `getLatestPrice` محاسبه می‌شود:
> `priceAgeMs = now - fetchedAt`؛ `staleAfterMs` از `price_sources.staleAfterMinutes` یا پیش‌فرض سراسری؛ `isStale = priceAgeMs > staleAfterMs`.

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

## Provider Adapter Contract

هر منبع قیمت بیرونی **فقط** از طریق یک Adapter پیاده‌سازی می‌شود. Domain و Application هرگز SDK/URL/پارس اختصاصی یک Provider را مستقیم صدا نمی‌زنند؛ در غیر این صورت با افزودن Provider دوم معماری ماژولار از بین می‌رود.

### محل کد (پیشنهادی)

```text
features/19-Price-Fetching/
├── domain/
│ └── PriceProviderAdapter.ts # فقط interface + انواع مشترک
├── application/
│ └── fetchAndStorePrices.ts # فقط به interface وابسته است
└── infrastructure/providers/
 ├── coingeckoAdapter.ts
 ├── nobitexAdapter.ts
 ├── tsetmcAdapter.ts
 ├── metalIranAdapter.ts
 └── index.ts # registry: sourceId → adapter
```

### Interface واحد (اجباری برای همه Providerها)

```typescript
/** پاسخ خام یک نماد پس از نرمال‌سازی Adapter — قبل از نوشتن در price_history */
export interface NormalizedPriceQuote {
  assetCategory: 'crypto' | 'stock' | 'fif' | 'metal';
  instrumentId: string;       // canonical — نه symbol خام
  providerSymbol: string;     // شناسه نزد Provider
  market?: string;
  quoteMarket: string;        // e.g. BTC-USDT
  price: string;              // decimal string
  priceCurrency: string;
  quoteType: 'last' | 'nav' | 'close' | 'mid' | 'other';
  marketDate?: string;        // YYYY-MM-DD when applicable
  fetchedAt: string;          // ISO datetime UTC
  sourceAdapterKey: string;
  rawSymbol?: string;         // debug only
}

export interface ProviderFetchResult {
  succeeded: NormalizedPriceQuote[];
  failed: Array<{ instrumentId?: string; providerSymbol?: string; reason: string }>;
  skipped: Array<{ instrumentId?: string; reason: string }>;
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
 refs: Array<{ instrumentId: string; providerSymbol?: string; market?: string; quoteMarket?: string }>,
 options?: { apiKey?: string; signal?: AbortSignal }
 ): Promise<ProviderFetchResult>;

 /** map instrumentId / providerSymbol */
 normalizeSymbol(instrumentIdOrSymbol: string, direction: 'toProvider' | 'toInternal'): string;

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
| `requiresApiKey` | اگر true، Application کلید را **فقط از Session Storage** می‌خواند و به `options.apiKey` می‌دهد؛ اگر نبود → Skip + پیام UX |
| `adapterKey` | **جدید (اجباری)** — کلید registry برای پیدا کردن کلاس Adapter (مثلاً `coingecko`) |
| `isActive` | فعال/غیرفعال |

بدون `adapterKey` معتبر، `fetchAndStorePrices` نباید شبکه را صدا بزند و باید با خطای واضح برگردد.

### جریان فراخوانی

```text
UI / Auto-Sync
 → fetchAndStorePrices(symbols, sourceId, triggeredBy)
 → load price_sources row
 → getAdapter(row.adapterKey) // registry
 → adapter.fetchPrices(refs) // providerSymbol resolve → HTTP → NormalizedPriceQuote با instrumentId
 → write NormalizedPriceQuote[] to price_history
 → emit PriceFetchCompleted
```

---

## APIهای داخلی (مشترک)

### مدیریت منبع و تاریخچه
- `getAllSources(assetCategory?)`
- `createSource(data)` / `updateSource(id, data)`
- `getLatestPrice({ assetCategory, instrumentId, priceCurrency?, quoteMarket?, sourceId? })` → آخرین قیمت معتبر + `{ price, priceCurrency, fetchedAt, priceAgeMs, staleAfterMs, isStale, sourceId, source }`. UI موظف است اگر `isStale` بود برچسب «قیمت قدیمی» نشان دهد.
- `getPriceHistory({ assetCategory, instrumentId, dateRange?, quoteMarket? })` → تاریخچه

### دریافت از API (هر دو زیرحالت دستی و خودکار از همین یک تابع رد می‌شوند)
- `fetchAndStorePrices(refs: Array<{ assetCategory, instrumentId, providerSymbol?, market?, quoteMarket? }>, sourceId?, triggeredBy: 'user_click' | 'auto_sync')`:
 1. تولید `fetchRequestId` (UUID) برای این اجرا.
 2. چک `navigator.onLine` — اگر `false` → `{ skipped: true, reason: 'offline' }`.
 3. اگر `sourceId` نبود → منبع `isDefault=true` همان دسته.
 4. ردیف `price_sources`؛ بدون `adapterKey` / غیرفعال → خطا بدون شبکه.
 5. اگر `requiresApiKey=true`: کلید از Session Storage — نبود کلید طبق همان سیاست.
 6. `getAdapter(adapterKey)` → `adapter.fetchPrices(...)`.
 7. خطاهای Adapter/HTTP را به `failureKind` نگاشت کن.
 8. برای هر quote موفق Adapter: **Domain Validation**؛ رد → `failed` با `validation_error`.
 9. **Dedupe**: اگر قیمت یکسان در پنجره ۶۰ثانیه موجود است → `deduped: true` بدون INSERT.
 10. INSERT با `fetchRequestId` + `triggeredBy` + `source='api'`.
 11. Auto-Sync → به‌روز کردن `lastSyncAt`.
 12. خروجی با `succeeded[]` / `failed[]` (همراه `failureKind`) / `skipped[]`.

### ثبت دستی (کاملاً آفلاین)
- `setManualPrice({ assetCategory, instrumentId, price, priceCurrency, quoteMarket?, expiresAt?, marketDate? })` → رکورد `price_history` با `source='manual'`. **بدون instrumentId رد می‌شود.** هیچ شبکه لازم نیست.

### مدیریت Auto-Sync
- `getSyncSettings(scope, assetCategory?, symbol?)`
- `setSyncSettings(data)` → روشن/خاموش کردن و تنظیم `syncIntervalMinutes` برای یک دسته یا یک نماد
- `runDueAutoSyncs` → روی همه رکوردهای `autoSyncEnabled=true` که `now - lastSyncAt >= syncIntervalMinutes` است چک می‌کند و برای هرکدام `fetchAndStorePrices(..., triggeredBy='auto_sync')` را صدا می‌زند؛ این تابع فقط از تایمر داخل اپ (وقتی تب باز و آنلاین است) صدا زده می‌شود، نه از بیرون.

---

## دریافت انبوه (Bulk Fetch) — وقتی تعداد نمادها زیاد است

سیستم باید بتواند هم برای ۲-۳ نماد و هم برای فهرست بزرگ (صدها نماد، مثلاً وقتی می‌خواهیم بعداً همه نمادهای موجود در یک Provider را کش کنیم) به‌درستی کار کند:

1. نمادهای درخواستی به Batchهای با اندازه ثابت (مثلاً حداکثر ۱۰۰ نماد در هر Request، بسته به محدودیت مستند API انتخابی) تقسیم می‌شوند — نه یک Request جدا به ازای هر نماد (فشار غیرضروری و کند) و نه یک Request بی‌نهایت‌بزرگ (ریسک Timeout/Rate Limit).
2. Batchها **پشت‌سرهم و با فاصله کوتاه** (نه هم‌زمان/Parallel بی‌کنترل) ارسال می‌شوند تا از Rate Limit سرویس بیرونی رد نشویم.
3. شکست یک Batch باعث توقف بقیه Batchها نمی‌شود؛ نتیجه نهایی، ترکیب `succeeded[]`/`failed[]` همه Batchها است (تعمیم قاعده Partial Success به سطح Batch).
4. در UI، حین دریافت انبوه یک نوار پیشرفت («۱۲۰ از ۴۵۰ نماد دریافت شد») نمایش داده می‌شود، نه یک Loading ساده بدون بازخورد — چون ممکن است چند ثانیه طول بکشد.

---

## روابط با سایر فیچرها

- **Investment - Crypto / Stocks Iran / FIF / Metals**: این فیچرها برای محاسبه Unrealized P&L و ارزش لحظه‌ای پرتفوی فقط از `getLatestPrice` می‌خوانند؛ خودشان هرگز API خارجی صدا نمی‌زنند و هرگز خودشان تصمیم به آنلاین‌شدن نمی‌گیرند. برای FIF، تابع `updateNAV(fundId, nav, date)` خودِ فیچر Investment در واقع یک لایه نازک روی `setManualPrice`/`fetchAndStorePrices` همین فیچر است (به `19-03-Fund-NAV` مراجعه شود) تا NAV هم در `inv_fif_holdings.currentNAV` (برای سرعت) و هم در `price_history` (برای تاریخچه و استاندارد یکپارچه) ثبت شود. **توجه**: این مسیر فقط NAV را تأمین می‌کند؛ قیمت صدور/ابطال در `inv_fif_transactions.transactionPrice` ثبت می‌شود و مبنای میانگین خرید و Realized P&L است.
- **Portfolio & Wealth Overview**: استفاده از آخرین قیمت‌ها برای Snapshot ارزش کل ثروت — کاملاً از دادهٔ محلی، بدون هیچ اتصال شبکه.
- **Currency & Multi-Currency**: تبدیل نهایی قیمت به ارز پایه کاربر با `cur_exchange_rates` انجام می‌شود، نه در همین فیچر.
- **Settings & Tools**: مدیریت منابع قیمت و تنظیمات Auto-Sync (`price_sync_settings`) از صفحه تنظیمات انجام می‌شود؛ این فیچر صفحه مستقل در ناوبری اصلی ندارد (طبق اصل «صفحات کم» در `Pages-IA.md`) و به‌صورت دکمه «دریافت قیمت‌ها» + سوییچ «به‌روزرسانی خودکار» داخل صفحه «سرمایه‌گذاری» (`/investments`) و بخش تنظیمات (`/settings`) نمایش داده می‌شود.

---

## مسیر ارتقا (آینده)

- **زیرفیچرهای بعدی**: Stock Prices، Housing Prices، Metals Prices — هرکدام با همان جداول مشترک (`price_sources`, `price_history`, `price_sync_settings`) و فقط منطق Fetch/Parse مخصوص به خودشان، طبق الگوی `19-01-Crypto-Prices`.
- **Fallback خودکار چندمنبعی**: v1 فقط `priority` + `isDefault` دارد؛ Fallback زنجیره‌ای خودکار هنگام شکست منبع اصلی مسیر آینده است.
- **Background Sync واقعی**: در صورت نیاز به دریافت حتی وقتی تب بسته است، از Periodic Background Sync سرویس‌ورکر استفاده شود؛ این هم‌چنان باید Opt-in و تابع همان سه قانون Offline-First بالا باشد (هیچ اتصال بی‌اجازه کاربر).


### Price Sync Settings — یکتایی

`UNIQUE(scope, assetCategory, instrumentId)` روی `price_sync_settings` اجباری است. ستون legacy `symbol` فقط مهاجرت؛ کلید منطقی = instrumentId.


---

## قرارداد هویت دارایی برای قیمت

همه دسته‌ها قبل از Fetch به یک **PriceAssetRef** نرمال می‌شوند:

```typescript
interface PriceAssetRef {
 assetCategory: AssetCategory; // crypto | stock | fif | metal
 internalSymbol: string; // کلید داخل price_history.symbol
 priceProviderId?: string; // FK price_sources
 providerSymbol?: string; // شناسه نزد Provider
 market?: string; // سهام
 // crypto extras when needed by adapter:
 chainId?: string;
 contractAddress?: string;
 assetId?: string; // شناسه Provider اختصاصی holding
}
```

| دسته | ساخت internalSymbol / mapping |
|------|-------------------------------|
| Crypto | `assetKey` از Holding (chain+contract یا exchange:symbol) + `assetId`/`priceProviderId` |
| Stock | `symbol` داخلی + `priceProviderId` + `providerSymbol` + `market` |
| FIF | `fundId` برای issuance؛ ETF مثل stock |
| Metals | `metalType_purity` |

Adapter فقط `PriceAssetRef` می‌گیرد — نه Holding خام متفاوت per feature.


---

## قرارداد ارزش‌گذاری تاریخی

هر قیمت قابل‌استفاده برای Snapshot/P&L باید سه‌تایی کامل داشته باشد:
1. `price` (decimal string)
2. `priceCurrency`
3. `asOf` / `fetchedAt` (UTC)

`exchangeRateToBase` روی **تراکنش** برای تبدیل تاریخی مبلغ معامله است؛ برای ارزش‌گذاری holding در زمان T:
`valueInBase(T) = quantity × price(T) × rate(priceCurrency → base, at T)` 
نرخ تتر جدا بدون `priceCurrency` و `asOf` کافی نیست.

---

## شناسه قیمت در `price_history`


ستون تاریخی `symbol` برای چند معنی overload شده بود (BTC در برابر UUID صندوق). قرارداد واحد:

| فیلد | نقش |
|------|-----|
| `assetCategory` | crypto / stock / fif / metal |
| `instrumentId` | شناسه پایدار داخلی (برای FIF = fundId؛ crypto = assetKey؛ stock = symbol داخلی؛ metal = metalType_purity) |
| `symbol` | **deprecated به‌عنوان شناسه اصلی**؛ می‌تواند display/legacy برابر instrumentId بماند برای سازگاری |

APIهای جدید: `getLatestPrice({ assetCategory, instrumentId })`. 
Queryها همیشه با `assetCategory + instrumentId` فیلتر شوند نه فقط symbol.

---

## Quote کامل‌تر 


حداقل فیلدهای `price_history` برای Quote مالی:

| فیلد | الزام |
|------|--------|
| `price`, `priceCurrency` | بله |
| `fetchedAt` | بله — زمان دریافت UTC |
| `marketDate` | بله برای stock/fif NAV روزانه؛ nullable برای crypto لحظه‌ای اگر session معنی ندارد |
| `quoteType` | `last` \| `nav` \| `close` \| `manual` \| `indicative` |
| `source` / `sourceId` | بله |
| `bid` / `ask` | اختیاری Should Have |

قوانین:
1. برای NAV و بورس ایران، **`marketDate` مبنای «قیمت کدام روز»** است؛ `fetchedAt` فقط زمان دریافت است.
2. `getLatestPrice` برای fif/stock ترجیحاً بر اساس آخرین `marketDate` (سپس fetchedAt) انتخاب می‌کند، نه فقط fetchedAt خام.
3. اگر Provider فقط timestamp بدهد، Adapter باید `marketDate` را از تقویم بازار استخراج یا از کاربر برای manual بگیرد.

---

## مرز Market Quote در برابر Valuation

هر ردیف `price_history` باید به **یک بازار قیمت مشخص** تعلق داشته باشد:

| فیلد | نقش |
|------|-----|
| `instrumentId` | دارایی پایه |
| `priceCurrency` | **quote currency همان بازار** (USDT در BTC/USDT، USD در BTC/USD، …) |
| `quoteMarket` | string **الزامی برای crypto** (و توصیه‌شده برای بقیه): مثلاً `BTC-USDT` |
| `sourceId` | Provider |
| `marketDate` / `fetchedAt` | زمان بازار / دریافت |
| `quoteType` | last/nav/close/… |

قوانین:
1. **BTC/USDT و BTC/USD و BTC/USDC سه stream جدا** هستند — در یک سری زمانی مخلوط نشوند.
2. Valuation به base: `price(instrument, quote) × rate(quote→base, asOf)` — rate جدا از quote است.
3. `getLatestPrice` باید `(assetCategory, instrumentId, priceCurrency)` یا `quoteMarket` را بپذیرد؛ بدون quote پیش‌فرض documented (مثلاً USDT برای crypto valuation).
4. P&L تاریخی فقط با quote + rate هم‌زمان همان asOf معتبر است.

---

## Canonical Asset Identity برای قیمت

قبل از implementation نهایی، همه Adapterها فقط با **یک** شکل کار می‌کنند:

```typescript
interface CanonicalPriceInstrument {
 assetCategory: 'crypto' | 'stock' | 'fif' | 'metal';
 instrumentId: string; // کلید پایدار در price_history
 // نرمال‌سازی از دامنه:
 // crypto: assetKey
 // stock: instrumentId (ISIN/stable) — نه صرفاً symbol نمایشی
 // fif: fundId
 // metal: `${metalType}_${purity}` یا id معادل
 displaySymbol?: string; // label
 priceProviderId?: string;
 providerSymbol?: string;
 market?: string;
 quoteCurrency?: string; // برای stream بازار
 chainId?: string;
 contractAddress?: string;
}
```

### قوانین
1. Feature دامنه Holding را به `CanonicalPriceInstrument` / `PriceAssetRef` **map** می‌کند؛ Adapter منطق `fundId` vs `assetKey` را داخل Core پخش **نمی‌کند**.
2. `instrumentId` در `price_history` همیشه همین کلید canonical است.
3. جدول/registry نگاشت اختیاری: `price_instrument_aliases` اگر Provider شناسه دیگری دارد.
4. تست: برای هر assetCategory حداقل یک fixture mapping → fetch → history row با instrumentId صحیح.

بدون این لایه، semantics پراکنده دوباره به Core نشت می‌کند.


---

## راهنمای پیاده‌سازی

### جریان fetch
```text
build CanonicalPriceInstrument[] from holdings
resolve PriceProviderAdapter by adapterKey
fetchPrices → normalize → Domain validation (price>0, ts, currency)
dedupe (assetCategory, instrumentId, sourceId, price, priceCurrency)
INSERT price_history (instrumentId, quoteType, marketDate, fetchedAt)
```

### قوانین
- API عمومی فقط `PriceFetchResult` (decimal string)
- Manual با expiresAt؛ API پیش‌فرض Manual فعال را override نمی‌کند
- getLatestPrice({ assetCategory, instrumentId, priceCurrency? })
- Auto-sync پیش‌فرض خاموش؛ کلید API فقط session per provider

### تست
Partial success؛ offline skip؛ future timestamp reject؛ USDT-ERC20 vs TRC20 جدا

### هویت یکتای ردیف قیمت (ضد اختلاط بازار)

کلید منطقی history / dedupe:

```text
(assetCategory, instrumentId, quoteMarket, priceCurrency, sourceId, marketDate|fetchedAt bucket)
```

- `BTC-USDT` Binance ≠ `BTC-USDT` Coinbase → `sourceId` جدا در identity
- فقط `priceCurrency=USDT` **کافی نیست**
- `getLatestPrice({ assetCategory, instrumentId, quoteMarket?, sourceId?, priceCurrency? })`
- اگر `quoteMarket` برای crypto null باشد، Adapter باید از جفت پیش‌فرض Provider بسازد و **ذخیره کند** نه null بگذارد

### سیاست انتخاب Provider در getLatestPrice (valuation)

امضا:

```ts
getLatestPrice({
  assetCategory,
  instrumentId,
  priceCurrency?,
  quoteMarket?,
  sourceId?,           // اختیاری — قفل به یک Provider
  preferHoldingId?,    // اگر داده شود، mapping همان Holding اولویت دارد
})
```

**ترتیب قطعی انتخاب ردیف:**
1. اگر `preferHoldingId` / Holding: `priceProviderId` + `providerSymbol` + `market` + quote → فقط ردیف‌های همان `sourceId`
2. وگرنه اگر `sourceId` در آرگومان باشد → همان منبع
3. وگرنه Default active source برای `assetCategory` (`isDefault`)
4. وگرنه بالاترین `priority` بین منابع فعال که برای آن instrument ردیف دارند
5. بین کاندیدها: تازه‌ترین `marketDate` سپس `fetchedAt`؛ Manual معتبر بر API طبق قواعد قبلی

**ممنوع:** انتخاب «هر آخرین BTC/USDT از هر صرافی» بدون policy بالا.
خروجی همیشه شامل `sourceId`, `quoteMarket`, `fetchedAt`, `isStale`.

---

## ترتیب Resolve قبل از Fetch

```text
1. internal instrumentId (از Holding / Registry)
2. resolve provider mapping: priceProviderId + providerSymbol + market + quoteMarket
3. Adapter.fetch(providerSymbol…)  — Adapter هویت داخلی اختراع نکند
4. response → NormalizedPriceQuote با همان instrumentId ورودی
5. write price_history
```

ممنوع: Adapter خروجی را فقط با `BTC`/`XBT` بدون map برگشتی به instrumentId بنویسد.

---

## Source Kind و Priority (valuation)

| sourceKind | confidence پیش‌فرض | توضیح |
|------------|-------------------|--------|
| `manual` | 100 | تا `manualExpiresAt`؛ API override نمی‌کند |
| `trusted_api` | 80 | isDefault / priority بالا |
| `secondary_api` | 50 | fallback |
| `import` | 40 | وارداتی |

`getLatestPrice` ترتیب:
1. manual معتبر (غیرمنقضی)
2. در غیر این صورت بالاترین confidence سپس priority سپس تازگی زمان
3. خروجی: `sourceKind`, `sourceId`, `confidence`

Portfolio Value همیشه از همین policy — نه «آخرین ردیف خام بدون kind».

---

## Stale Policy per Asset Category

`staleAfterMs` **سراسری یکسان نیست**. ترتیب resolve:

1. `price_sources.staleAfterMinutes` برای آن source  
2. وگرنه پیش‌فرض **per assetCategory** (و در صورت نیاز per quoteType):

| assetCategory | پیش‌فرض پیشنهادی staleAfter | مبنای age |
|---------------|------------------------------|-----------|
| crypto | 15–60 دقیقه | `now - fetchedAt` |
| stock | پایان همان session / یک روز معاملاتی | ترجیحاً `now - marketDate` (تقویم بازار) |
| fif | 1–2 روز تقویمی (NAV روزانه) | `now - marketDate` |
| metal | 1–6 ساعت | `now - fetchedAt` |

`isStale` روی CachedPrice با همین policy. UI برچسب «قیمت مربوط به {priceAsOf}» نشان می‌دهد.

---

## بدون default پنهان USDT

- هیچ `priceCurrency = 'USDT'` hard-code در Domain به‌عنوان پیش‌فرض خاموش نیست.
- Holding/mapping باید `quoteMarket` / `priceCurrency` صریح داشته باشد یا از تنظیمات کاربر (`defaultCryptoQuote`) **opt-in**.
- `BTC-IRR`, `BTC-USDT`, `BTC-USD` سه stream جدا در history.

---

## PriceFetchResult کامل

هر آیتم `succeeded[]` حداقل: `instrumentId, price, priceCurrency, quoteMarket, sourceId, quoteType, marketDate?, fetchedAt` — Application حق ندارد این‌ها را از context بیرونی «حدس» بزند.

---

## یکپارچگی شناسه API قیمت (الزامی)

| سطح | شناسه |
|------|--------|
| Public API | همیشه `assetCategory + instrumentId` (+ `quoteMarket` / `sourceId` در صورت نیاز) |
| `price_history` | `instrumentId` |
| `price_sync_settings` | کلید منطقی = `(scope, assetCategory, instrumentId)` — ستون legacy `symbol` فقط نمایش/مهاجرت |
| Adapter ورودی | `instrumentId` + `providerSymbol` resolveشده |

**Deprecated:** `getLatestPrice(symbol)` بدون category — فقط wrapper موقت که به registry resolve می‌کند و در log هشدار می‌دهد.

`quoteType` یکسان در همه قراردادها: `'last' | 'nav' | 'close' | 'mid' | 'indicative' | 'manual' | 'other'`.

---

## قرارداد واحد Public Price API

همهٔ چهار دسته (`crypto` | `stock` | `fif` | `metal`) **یک** شکل دارند:

```ts
getLatestPrice(q: {
  assetCategory: AssetCategory;
  instrumentId: string;
  priceCurrency?: string;
  quoteMarket?: string;
  sourceId?: string;
  preferHoldingId?: string;
}): CachedPrice

setManualPrice(q: {
  assetCategory: AssetCategory;
  instrumentId: string;
  price: string;
  priceCurrency: string;
  quoteMarket?: string;
  marketDate?: string;
  expiresAt?: string;
}): void

fetchAndStorePrices(
  refs: Array<{
    assetCategory: AssetCategory;
    instrumentId: string;
    providerSymbol?: string;
    market?: string;
    quoteMarket?: string;
  }>,
  sourceId?: string,
  triggeredBy?: 'user_click' | 'auto_sync'
): Promise<PriceFetchResult>
```

Adapter: `fetchPrices(refs)` با `instrumentId` — نه `string[]` نماد خام.

`price_sync_settings`: فیلدهای `scope`, `assetCategory`, `instrumentId`, `sourceId?`, `enabled`, `intervalMinutes` — **نه** symbol به‌عنوان کلید.

---

## Auto-Sync و Session Storage (Limitation v1)

API Key فقط در Session Storage است → با بستن tab از بین می‌رود.

| حالت | رفتار |
|------|--------|
| Tab باز + key در session | Auto-Sync می‌تواند fetch کند |
| Tab بسته / key خالی | Auto-Sync آن source را `skipped: api_key_required` می‌کند — **نه** crash |
| UX | در Settings: «برای auto-sync کلید را بعد از هر باز کردن اپ دوباره وارد کنید» |

نسخه بعدی (اختیاری): encrypted remember با تأیید صریح کاربر — خارج از v1 الزام.
