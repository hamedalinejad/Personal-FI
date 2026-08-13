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
| FIF (صندوق) | `fundId` (نه symbol — چون issuance_redemption نماد بورسی ندارد) | NAV به ریال | **هیچ API عمومی یکپارچه‌ای وجود ندارد** — هر صندوق NAV را در سایت خودش منتشر می‌کند | **دستی به‌عنوان مسیر اصلی (Must Have)؛ Fetch اختیاری per-fund برای صندوق‌های دارای منبع مشخص** |
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

هر دو مسیر در همان جدول `price_history` ذخیره می‌شوند؛ تنها تفاوتشان فیلد `source` رکورد است (`manual` در برابر `api`، به بخش «Domain Entities» نگاه کنید) — از نظر بقیه سیستم (`getLatestPrice(assetCategory, symbol)`) کاملاً یکسان مصرف می‌شوند.

---

## Business Rules (مشترک بین همه زیرفیچرها)

1. هر منبع قیمت (Provider) به‌صورت مستقل در `price_sources` تعریف می‌شود؛ هر نماد می‌تواند از چند منبع قیمت بگیرد (مثلاً BTC هم از منبع A هم از منبع B).
2. دریافت از API همیشه با اراده کاربر شروع می‌شود — یا با کلیک دستی، یا (در صورت فعال بودن) با تایمر Auto-Sync که خودِ کاربر روشنش کرده. **هیچ حالت سومی وجود ندارد.**
3. هر بار دریافت موفق (چه دستی، چه Auto-Sync، چه ثبت دستی کاربر)، یک رکورد جدید در `price_history` اضافه می‌شود (Append-Only) — قیمت‌های قبلی هرگز overwrite/حذف نمی‌شوند تا امکان نمودار تاریخچه قیمت حفظ شود.
4. آخرین قیمت هر نماد از طریق `getLatestPrice(assetCategory, symbol, targetCurrency?)` خوانده می‌شود؛ پارامتر `assetCategory` **اجباری و اول** است — چون یک نماد مثل `LINK` می‌تواند هم در کریپتو و هم در سهام وجود داشته باشد و بدون این پارامتر Query ممکن است رکورد اشتباه را برگرداند. این تابع همیشه جدیدترین رکورد `price_history` را با فیلتر `WHERE assetCategory = ? AND symbol = ?` برمی‌گرداند (فارغ از این‌که منبعش `manual` بوده یا `api`)، نه میانگین.
5. **قبل از هر تلاش برای اتصال (چه دستی چه Auto-Sync)**، سیستم ابتدا `navigator.onLine` را چک می‌کند؛ اگر `false` باشد، حتی تلاش برای Request هم نمی‌شود — مستقیم پیام «آفلاین هستید» نشان داده می‌شود (نه Timeout و نه Retry بی‌مورد که باتری/داده هدر بدهد). اگر `navigator.onLine = true` بود ولی Request واقعاً شکست خورد (سرور در دسترس نیست)، همان رفتار قاعده ۷ (Partial/Full Failure) اجرا می‌شود.
6. اگر اتصال اینترنت یا API در دسترس نباشد، آخرین قیمت کش‌شده (آخرین رکورد `price_history`، صرف‌نظر از `manual`/`api` بودنش) همراه با برچسب «قیمت قدیمی — آخرین به‌روزرسانی: [تاریخ/ساعت]» نمایش داده می‌شود؛ خطای دریافت هرگز نباید مانع کارکرد بقیه اپ (دیدن پرتفوی، ثبت تراکنش جدید و ...) شود.
7. کلید API (در صورت نیاز منبع به کلید) هرگز در دیتابیس یا LocalStorage ذخیره نمی‌شود (طبق قانون `db.md`: «داده‌های حساس هرگز ذخیره نشوند»)؛ در Session Storage یا فایل تنظیمات محلی خارج از دیتابیس نگهداری می‌شود.
8. اگر دریافت قیمت یک نماد شکست بخورد (Network Error، Rate Limit، نماد ناموجود در API)، فقط همان نماد Skip می‌شود و خطا در نتیجه نهایی گزارش می‌شود؛ بقیه نمادهای درخواستی در همان دسته باید دریافت شوند (Partial Success مجاز است) — این قانون برای دسته‌های بزرگ (صدها نماد) هم صدق می‌کند، به بخش «دریافت انبوه» پایین نگاه کنید.
9. تبدیل قیمت به ارز پایه کاربر (`cur_currency_preferences.baseCurrency`) در لحظه دریافت انجام **نمی‌شود**؛ `price_history` قیمت را دقیقاً در همان ارزی که API برگردانده ذخیره می‌کند (`priceCurrency`) و تبدیل به ارز پایه در لایه Domain هنگام مصرف (مثل `getPortfolioValue`) با `cur_exchange_rates` انجام می‌شود — تا اگر نرخ ارز پایه بعداً عوض شود، نیازی به واکشی دوباره قیمت‌ها نباشد.
10. ثبت دستی قیمت (`source = 'manual'`) هیچ محدودیت شبکه‌ای ندارد و همیشه، حتی کاملاً آفلاین، ممکن است — برای **هر نمادی با هر `assetCategory`**، چه کاربر آن دارایی را داشته باشد چه نداشته باشد. موارد کاربرد:
    - رمزارز یا سهامی که API پوشش نمی‌دهد (توکن کم‌شناخته، نماد بورسی خاص)
    - وقتی کاربر آفلاین است و نمی‌تواند Fetch کند ولی قیمت را از منبع دیگری (اپ کارگزاری، سایت صندوق) می‌داند
    - وقتی کاربر می‌خواهد قیمتی را که خودش تأیید می‌کند جایگزین آخرین قیمت API کند
    - پیگیری قیمت یک دارایی که هنوز نخریده ولی در نظر دارد بخرد

    > این رکوردها در `price_history` با `source='manual'` ذخیره می‌شوند و `getLatestPrice(assetCategory, symbol)` آن‌ها را دقیقاً مثل رکوردهای `api` می‌بیند — هیچ تفاوتی در مصرف ندارند.

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
- `name` → string (نام منبع، مثلاً «Nobitex»، «CoinGecko»، «صندوق پاداش سرمایه»)
- `assetCategory` → enum (`crypto`, `stock`, `fif`, `metal`, `housing`) — دسته دارایی‌ای که این منبع پوشش می‌دهد (`fif` برای صندوق‌های issuance_redemption که منبع اختصاصی per-fund دارند؛ صندوق‌های ETF از `stock` استفاده می‌کنند)
- **`symbol` → string (nullable)** — اگر این Source فقط برای یک نماد/صندوق خاص است (per-fund یا per-symbol)، اینجا مشخص می‌شود؛ مثلاً برای صندوق `issuance_redemption` مقدار `fundId` (UUID به‌صورت رشته) است. اگر `null` باشد، Source برای همه نمادهای `assetCategory` قابل استفاده است (مثل CoinGecko که همه رمزارزها را پوشش می‌دهد).

  > **مثال برای ایران**: صندوق «آرمان افرا» → یک رکورد `price_sources` با `assetCategory='fif'`، `symbol='<fundId>'`، `baseUrl='https://armancapital.ir/nav'`؛ صندوق «کمند» → رکورد جداگانه با `symbol='<fundId-kamand>'`. این mapping صریح `fundId → sourceId` است که `fetchFundNAV(fundId)` برای پیدا کردن Provider خودش نیاز دارد.

- `baseUrl` → string (آدرس API)
- `requiresApiKey` → boolean
- `isActive` → boolean
- `notes` → string (nullable)
- `createdAt` → datetime
- `updatedAt` → datetime

> **کوئری انتخاب Source برای یک نماد**: ابتدا `WHERE assetCategory = ? AND symbol = ? AND isActive = true` (per-symbol) — اگر نبود، `WHERE assetCategory = ? AND symbol IS NULL AND isActive = true` (عمومی آن دسته). اولویت همیشه با Source اختصاصی‌تر است.

### ۲. Price History (جدول: `price_history`) — لاگ Append-Only

- `id` → UUID (Primary Key)
- `sourceId` → UUID (nullable — لینک به `price_sources`؛ برای رکوردهای `source='manual'` مقدارش `null` است)
- `symbol` → string (مثلاً `BTC`, `ETH`؛ برای زیرفیچرهای آینده: نماد سهام، کد ملک و ...)
- `assetCategory` → enum (`crypto`, `stock`, `fif`, `metal`, `housing`) — همان مقادیر `price_sources`؛ برای صندوق‌های `issuance_redemption` مقدار `fif` است، برای ETF مقدار `stock` است
- `price` → decimal (قیمت — با `decimal.js`)
- `priceCurrency` → string (ارزی که قیمت در آن ثبت شده، معمولاً `USDT` یا `IRR`)
- `source` → enum (`manual`, `api`) — منشأ این رکورد؛ فیلد اصلی برای تفکیک دو مسیر بخش «دو مسیر دریافت قیمت»
- `triggeredBy` → enum (`user_click`, `auto_sync`, `manual_entry`) — دقیقاً چه چیزی این رکورد را ایجاد کرده (برای UI و لاگ شفافیت بیشتر از `source` می‌دهد: مثلاً `source='api'` می‌تواند هم از `user_click` باشد هم از `auto_sync`)
- **`isManualOverride` → boolean (پیش‌فرض: `false`)** — وقتی کاربر صریحاً قیمتی را به‌عنوان Override ثبت می‌کند (نه فقط یک قیمت دستی معمولی)، این فیلد `true` است. تفاوت رفتاری: API بعدی این Override را نادیده نمی‌گیرد تا کاربر خودش آن را لغو کند.
- `fetchedAt` → datetime (لحظه دریافت/ثبت واقعی)
- `createdAt` → datetime

> **سیاست Override در `getLatestPrice(assetCategory, symbol)`:**
>
> ```
> ۱. اگر آخرین رکورد price_history (ORDER BY fetchedAt DESC LIMIT 1)
>    isManualOverride = true باشد → همان قیمت را برگردان (صرف‌نظر از قیمت‌های API بعدی)
>
> ۲. در غیر این صورت → آخرین رکورد (isManualOverride یا نه، هر منبعی) را برگردان
>    (همان رفتار فعلی: جدیدترین رکورد بر اساس fetchedAt)
> ```
>
> **مثال**: `10:00 API=100` → `10:05 Manual(override=true)=110` → `10:10 API=101`
> - `getLatestPrice` → **110** (چون Override فعال است)
> - تا زمانی که کاربر Override را با `clearManualOverride(assetCategory, symbol)` لغو نکند، قیمت‌های API جدید دیده نمی‌شوند
>
> **مثال بدون Override**: `10:00 API=100` → `10:05 Manual(override=false)=110` → `10:10 API=101`
> - `getLatestPrice` → **101** (رفتار معمول: جدیدترین رکورد)
>
> **پیاده‌سازی کوئری**:
> ```sql
> -- ابتدا بررسی Override فعال
> SELECT * FROM price_history
> WHERE assetCategory = ? AND symbol = ? AND isManualOverride = true
> ORDER BY fetchedAt DESC LIMIT 1;
> -- اگر نتیجه داشت → برگردان
> -- اگر نداشت → fallback به جدیدترین رکورد (هر منبعی)
> SELECT * FROM price_history
> WHERE assetCategory = ? AND symbol = ?
> ORDER BY fetchedAt DESC LIMIT 1;
> ```

> **نکته**: `price_history` هرگز توسط فیچرهای سرمایه‌گذاری مستقیماً نوشته نمی‌شود؛ فقط از طریق APIهای همین فیچر (`fetchAndStorePrices` یا `setManualPrice`) پر می‌شود. فیچرهای دیگر فقط Read دارند (`getLatestPrice`).

### ۳. Price Sync Settings (جدول: `price_sync_settings`) — تنظیمات Auto-Sync

- `id` → UUID (Primary Key)
- `scope` → enum (`asset_category`, `symbol`) — آیا این تنظیم روی کل یک دسته دارایی اعمال می‌شود یا فقط یک نماد خاص
- `assetCategory` → enum (`crypto`, `stock`, `fif`, `metal`, `housing`) (nullable — وقتی `scope='asset_category'`)
- `symbol` → string (nullable — وقتی `scope='symbol'`؛ برای Override یک نماد خاص، مستقل از تنظیم کلی دسته‌اش)
- **`sourceId` → UUID — Foreign Key به `price_sources.id` (NOT NULL)** — کدام Provider برای این sync استفاده شود؛ `runDueAutoSyncs()` این فیلد را مستقیماً به `fetchAndStorePrices(symbols[], sourceId, ...)` پاس می‌دهد. بدون این فیلد، Auto-Sync نمی‌داند از کدام API باید قیمت بگیرد.
- `autoSyncEnabled` → boolean (پیش‌فرض: `false`)
- `syncIntervalMinutes` → integer (پیش‌فرض پیشنهادی: ۱۵؛ حداقل مجاز در Validation لایه Domain، نه دیتابیس، اعمال شود — مثلاً ≥ ۵)
- `lastSyncAt` → datetime (nullable)
- `createdAt` / `updatedAt` → datetime

> **رابطه `price_sync_settings` ↔ `price_sources`**: یک نماد می‌تواند چند رکورد `price_sync_settings` با `sourceId`های مختلف داشته باشد — یعنی کاربر می‌تواند BTC را هم از CoinGecko و هم از Nobitex به‌طور مستقل sync کند. هر رکورد یک تنظیم مستقل است با `lastSyncAt` و `syncIntervalMinutes` جداگانه. این رویکرد ساده‌تر از یک جدول N:M جداگانه است و قابلیت مشابهی ارائه می‌دهد.

> **قاعده اولویت در `getLatestPrice`**: اگر چند Provider برای یک نماد sync شوند، `getLatestPrice(assetCategory, symbol)` همیشه **جدیدترین رکورد** در `price_history` را برمی‌گرداند (بر اساس `fetchedAt DESC`) بدون توجه به اینکه از کدام Provider آمده — کاربر می‌تواند با انتخاب Provider مناسب، قیمت «معتبرتر» را جدیدتر نگه دارد.

> **قاعده اولویت در Auto-Sync**: هر رکورد `price_sync_settings` (با `sourceId` خودش) مستقل اجرا می‌شود؛ اگر برای یک نماد مشخص رکورد `scope='symbol'` وجود داشته باشد، علاوه بر رکورد `scope='asset_category'` اجرا می‌شود (نه به‌جای آن) — چون هر رکورد یک Provider جداگانه دارد. اگر هیچ رکورد `autoSyncEnabled=true` نبود، پیش‌فرض سیستم `autoSyncEnabled=false` است (سکوت = خاموش، طبق اصل Offline-First).

---

## APIهای داخلی (مشترک)

### مدیریت منبع و تاریخچه
- `getAllSources(assetCategory?)`
- `createSource(data)` / `updateSource(id, data)`
- `getLatestPrice(assetCategory, symbol, targetCurrency?)` → آخرین قیمت کش‌شده یک نماد (از هر دو منبع `manual`/`api`)

  > **چرا `assetCategory` اجباری و اول است؟** یک نماد مثل `LINK` (Chainlink) در کریپتو و `LINK` در سهام بورس می‌تواند همزمان در `price_history` وجود داشته باشد. کوئری بدون این فیلتر (`WHERE symbol = 'LINK' ORDER BY fetchedAt DESC LIMIT 1`) ممکن است قیمت دارایی اشتباه را برگرداند — باگ ساکت و بحرانی در محاسبه P&L. کوئری درست: `WHERE assetCategory = ? AND symbol = ? ORDER BY fetchedAt DESC LIMIT 1`.

  ```typescript
  // امضای درست — assetCategory همیشه اول و اجباری است
  getLatestPrice(
    assetCategory: AssetCategory,  // 'crypto' | 'stock' | 'fif' | 'metal'
    symbol: string,
    targetCurrency?: string        // اگر داده شود، تبدیل به این ارز با cur_exchange_rates
  ): LatestPrice | null

  interface LatestPrice {
    assetCategory: AssetCategory,
    symbol: string,
    price: Decimal,
    priceCurrency: string,        // ارزی که قیمت در آن است (USDT, IRR, etc.)
    timestamp: datetime,          // لحظه دریافت/ثبت قیمت
    isStale: boolean,             // بر اساس TTL این asset category
    source: 'manual' | 'api',    // منشأ قیمت
    triggeredBy?: 'user_click' | 'auto_sync' | 'manual_entry'
  }
  ```

- `getPriceHistory(assetCategory, symbol, dateRange?)` → برای نمودار تاریخچه قیمت (`assetCategory` اینجا هم اجباری است به همان دلیل)

### دریافت از API (هر دو زیرحالت دستی و خودکار از همین یک تابع رد می‌شوند)
- `fetchAndStorePrices(symbols[], sourceId, triggeredBy: 'user_click' | 'auto_sync')`:
  1. چک `navigator.onLine` — اگر `false`، بلافاصله برمی‌گردد با `{ skipped: true, reason: 'offline' }` و هیچ Request ای نمی‌رود.
  2. نمادها را طبق «دریافت انبوه» (پایین) به Batchهای کوچک تقسیم می‌کند.
  3. برای هر Batch نتیجه را در `price_history` با `source='api'` و `triggeredBy` داده‌شده ذخیره می‌کند.
  4. اگر `triggeredBy='auto_sync'` بود، `price_sync_settings.lastSyncAt` مربوطه را هم آپدیت می‌کند.
  5. خروجی یکسان با ساختار `succeeded[]` / `failed[]` که در `19-01-Crypto-Prices` تعریف شده برمی‌گرداند.

### ثبت دستی (کاملاً آفلاین)
- `setManualPrice(assetCategory, symbol, price, priceCurrency, isOverride?: boolean)` → رکورد جدید با `source='manual'`, `triggeredBy='manual_entry'`, `sourceId=null` در `price_history` اضافه می‌کند. اگر `isOverride=true` باشد، فیلد `isManualOverride=true` ست می‌شود و `getLatestPrice` از این لحظه آن قیمت را بر API ترجیح می‌دهد تا زمانی که Override لغو شود. هیچ چک آنلاین/آفلاین ندارد چون به شبکه نیازی ندارد.
- `clearManualOverride(assetCategory, symbol)` → آخرین رکورد `isManualOverride=true` برای این نماد را پیدا کرده و `isManualOverride=false` می‌کند (update روی یک رکورد موجود — استثنای مجاز از اصل Append-Only چون Override یک وضعیت است، نه یک رکورد تاریخی). بعد از این، `getLatestPrice` دوباره به رفتار معمول (جدیدترین رکورد) برمی‌گردد.

### مدیریت Auto-Sync
- `getSyncSettings(scope, assetCategory?, symbol?)` → رکوردهای `price_sync_settings` را با فیلتر برمی‌گرداند
- `setSyncSettings(data)` → ایجاد یا ویرایش یک رکورد sync؛ **`sourceId` اجباری است** — بدون Provider نمی‌توان Auto-Sync فعال کرد. اگر کاربر بخواهد یک نماد را از دو Provider sync کند، دو بار `setSyncSettings` با `sourceId`های مختلف صدا می‌زند (دو رکورد مستقل)
- `runDueAutoSyncs()` → روی همه رکوردهای `autoSyncEnabled=true` که `now - lastSyncAt >= syncIntervalMinutes` است چک می‌کند و برای هرکدام `fetchAndStorePrices(symbols[], record.sourceId, triggeredBy='auto_sync')` را صدا می‌زند — **`sourceId` مستقیماً از رکورد `price_sync_settings` خوانده می‌شود**، نه از جای دیگری. این تابع فقط از تایمر داخل اپ (وقتی تب باز و آنلاین است) صدا زده می‌شود، نه از بیرون.

  ```typescript
  // منطق runDueAutoSyncs:
  const dueRecords = db.query(`
    SELECT * FROM price_sync_settings
    WHERE autoSyncEnabled = true
    AND (lastSyncAt IS NULL OR
         (unixepoch('now') - unixepoch(lastSyncAt)) >= syncIntervalMinutes * 60)
  `);

  for (const record of dueRecords) {
    const symbols = resolveSymbols(record); // scope='symbol'→[record.symbol] / scope='asset_category'→holdings
    await fetchAndStorePrices(symbols, record.sourceId, 'auto_sync');
    // lastSyncAt در داخل fetchAndStorePrices آپدیت می‌شود (قانون ۴ در fetchAndStorePrices)
  }
  ```

---

## دریافت انبوه (Bulk Fetch) — وقتی تعداد نمادها زیاد است

سیستم باید بتواند هم برای ۲-۳ نماد و هم برای فهرست بزرگ (صدها نماد، مثلاً وقتی می‌خواهیم بعداً همه نمادهای موجود در یک Provider را کش کنیم) به‌درستی کار کند:

1. نمادهای درخواستی به Batchهای با اندازه ثابت (مثلاً حداکثر ۱۰۰ نماد در هر Request، بسته به محدودیت مستند API انتخابی) تقسیم می‌شوند — نه یک Request جدا به ازای هر نماد (فشار غیرضروری و کند) و نه یک Request بی‌نهایت‌بزرگ (ریسک Timeout/Rate Limit).
2. Batchها **پشت‌سرهم و با فاصله کوتاه** (نه هم‌زمان/Parallel بی‌کنترل) ارسال می‌شوند تا از Rate Limit سرویس بیرونی رد نشویم.
3. شکست یک Batch باعث توقف بقیه Batchها نمی‌شود؛ نتیجه نهایی، ترکیب `succeeded[]`/`failed[]` همه Batchها است (تعمیم قاعده Partial Success به سطح Batch).
4. در UI، حین دریافت انبوه یک نوار پیشرفت («۱۲۰ از ۴۵۰ نماد دریافت شد») نمایش داده می‌شود، نه یک Loading ساده بدون بازخورد — چون ممکن است چند ثانیه طول بکشد.

---

## روابط با سایر فیچرها

- **Investment - Crypto / Stocks Iran / FIF / Metals**: این فیچرها برای محاسبه Unrealized P&L و ارزش لحظه‌ای پرتفوی فقط از `getLatestPrice(assetCategory, symbol)` می‌خوانند؛ خودشان هرگز API خارجی صدا نمی‌زنند و هرگز خودشان تصمیم به آنلاین‌شدن نمی‌گیرند. برای FIF، تابع `updateNAV(fundId, nav, date)` خودِ فیچر Investment در واقع یک لایه نازک روی `setManualPrice`/`fetchAndStorePrices` همین فیچر است (به `19-03-Fund-NAV` مراجعه شود) تا NAV هم در `inv_fif_holdings.currentNAV` (برای سرعت) و هم در `price_history` (برای تاریخچه و استاندارد یکپارچه) ثبت شود.
- **Portfolio & Wealth Overview**: استفاده از آخرین قیمت‌ها برای Snapshot ارزش کل ثروت — کاملاً از دادهٔ محلی، بدون هیچ اتصال شبکه.
- **Currency & Multi-Currency**: تبدیل نهایی قیمت به ارز پایه کاربر با `cur_exchange_rates` انجام می‌شود، نه در همین فیچر.
- **Settings & Tools**: مدیریت منابع قیمت و تنظیمات Auto-Sync (`price_sync_settings`) از صفحه تنظیمات انجام می‌شود؛ این فیچر صفحه مستقل در ناوبری اصلی ندارد (طبق اصل «صفحات کم» در `Pages-IA.md`) و به‌صورت دکمه «دریافت قیمت‌ها» + سوییچ «به‌روزرسانی خودکار» داخل صفحه «سرمایه‌گذاری» (`/investments`) و بخش تنظیمات (`/settings`) نمایش داده می‌شود.

---

## مسیر ارتقا (آینده)

- **زیرفیچرهای بعدی**: Stock Prices، Housing Prices، Metals Prices — هرکدام با همان جداول مشترک (`price_sources`, `price_history`, `price_sync_settings`) و فقط منطق Fetch/Parse مخصوص به خودشان، طبق الگوی `19-01-Crypto-Prices`.
- **چند منبع همزمان با اولویت‌بندی**: امکان تعریف منبع «اصلی» و «پشتیبان» برای هر نماد و Fallback خودکار در صورت شکست منبع اصلی.
- **Background Sync واقعی**: در صورت نیاز به دریافت حتی وقتی تب بسته است، از Periodic Background Sync سرویس‌ورکر استفاده شود؛ این هم‌چنان باید Opt-in و تابع همان سه قانون Offline-First بالا باشد (هیچ اتصال بی‌اجازه کاربر).
