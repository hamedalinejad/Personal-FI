# فیچر: Price Fetching (دریافت قیمت‌ها)

## توضیح کلی
این فیچر مسئول دریافت، ذخیره و نگهداری قیمت‌های لحظه‌ای/دوره‌ای دارایی‌ها از منابع بیرونی (API) است — مستقل از فیچرهای سرمایه‌گذاری (Crypto، Stocks Iran، FIF، Metals).  
فیچرهای سرمایه‌گذاری برای محاسبه سود/زیان تحقق‌نیافته (Unrealized P&L) و ارزش پرتفوی، آخرین قیمت هر نماد را از این فیچر می‌خوانند؛ خودشان هرگز مستقیماً به API بیرونی وصل نمی‌شوند. این جداسازی باعث می‌شود منبع قیمت، فرکانس دریافت و کش آفلاین در یک‌جا مدیریت شود.

این فیچر بر خلاف بقیه فیچرهای مالی، **هیچ تراکنشی در `acc_transactions` ثبت نمی‌کند** و ارتباطی به موجودی حساب‌ها ندارد — صرفاً یک منبع داده Read/Cache برای بقیه سیستم است.

---

## زیرفیچرها (به ترتیب اولویت پیاده‌سازی)

| # | زیرفیچر | وضعیت نسخه ۱ |
|---|---|---|
| ۱۹.۱ | [Crypto Prices](./19-01-Crypto-Prices/Crypto-Prices.md) | Must Have |
| ۱۹.۲ | Stock Prices (سهام ایران) | آینده (Should Have — بعد از v1) |
| ۱۹.۳ | Housing / Real Estate Prices (مسکن) | آینده (Could Have) |
| ۱۹.۴ | Metals / Gold Prices | آینده (Should Have) |

فقط زیرفیچر ۱۹.۱ (Crypto Prices) در نسخه ۱ پیاده‌سازی می‌شود. ساختار پوشه از ابتدا برای بقیه منابع قیمت هم آماده است تا هرکدام بعداً بدون تغییر در فیچرهای دیگر اضافه شوند.

---

## Business Rules (مشترک بین همه زیرفیچرها)

1. هر منبع قیمت (Provider) به‌صورت مستقل در `price_sources` تعریف می‌شود؛ هر نماد می‌تواند از چند منبع قیمت بگیرد (مثلاً BTC هم از منبع A هم از منبع B).
2. دریافت قیمت **دستی (On-Demand)** است — کاربر روی دکمه «به‌روزرسانی قیمت‌ها» در صفحه مربوطه کلیک می‌کند. اجرای خودکار/زمان‌بندی‌شده (Cron/Background Sync) خارج از محدوده نسخه ۱ است و به‌عنوان مسیر ارتقا مستند می‌ماند (بخش «مسیر ارتقا» پایین).
3. هر بار دریافت موفق، یک رکورد جدید در `price_history` اضافه می‌شود (Append-Only) — قیمت‌های قبلی هرگز overwrite/حذف نمی‌شوند تا امکان نمودار تاریخچه قیمت حفظ شود.
4. آخرین قیمت هر نماد از طریق `getLatestPrice(symbol, targetCurrency?)` خوانده می‌شود؛ این تابع همیشه جدیدترین رکورد `price_history` را برمی‌گرداند، نه میانگین.
5. سیستم کاملاً آفلاین کار می‌کند: اگر اتصال اینترنت نباشد یا API در دسترس نباشد، آخرین قیمت کش‌شده (آخرین رکورد `price_history`) همراه با برچسب «قیمت قدیمی — آخرین به‌روزرسانی: [تاریخ]» نمایش داده می‌شود؛ خطای دریافت هرگز نباید مانع کارکرد بقیه اپ شود.
6. کلید API (در صورت نیاز منبع به کلید) هرگز در دیتابیس یا LocalStorage ذخیره نمی‌شود (طبق قانون `db.md`: «داده‌های حساس هرگز ذخیره نشوند»)؛ در Session Storage یا فایل تنظیمات محلی خارج از دیتابیس نگهداری می‌شود.
7. اگر دریافت قیمت یک نماد شکست بخورد (Network Error، Rate Limit، نماد ناموجود در API)، فقط همان نماد Skip می‌شود و خطا در نتیجه نهایی گزارش می‌شود؛ بقیه نمادهای درخواستی در همان دسته باید دریافت شوند (Partial Success مجاز است).
8. تبدیل قیمت به ارز پایه کاربر (`cur_currency_preferences.baseCurrency`) در لحظه دریافت انجام **نمی‌شود**؛ `price_history` قیمت را دقیقاً در همان ارزی که API برگردانده ذخیره می‌کند (`priceCurrency`) و تبدیل به ارز پایه در لایه Domain هنگام مصرف (مثل `getPortfolioValue`) با `cur_exchange_rates` انجام می‌شود — تا اگر نرخ ارز پایه بعداً عوض شود، نیازی به واکشی دوباره قیمت‌ها نباشد.

---

## Domain Entities (مشترک)

### ۱. Price Source (جدول: `price_sources`)

- `id` → UUID (Primary Key)
- `name` → string (نام منبع، مثلاً «Nobitex»، «CoinGecko»)
- `assetCategory` → enum (`crypto`, `stock`, `housing`, `metal`) — دسته دارایی‌ای که این منبع پوشش می‌دهد
- `baseUrl` → string (آدرس API)
- `requiresApiKey` → boolean
- `isActive` → boolean
- `notes` → string (nullable)
- `createdAt` → datetime
- `updatedAt` → datetime

### ۲. Price History (جدول: `price_history`) — لاگ Append-Only

- `id` → UUID (Primary Key)
- `sourceId` → UUID (لینک به `price_sources`)
- `symbol` → string (مثلاً `BTC`, `ETH`؛ برای زیرفیچرهای آینده: نماد سهام، کد ملک و ...)
- `assetCategory` → enum (`crypto`, `stock`, `housing`, `metal`)
- `price` → decimal (قیمت دریافتی — با `decimal.js`)
- `priceCurrency` → string (ارزی که قیمت در آن برگشته، معمولاً `USDT` یا `IRR`)
- `fetchedAt` → datetime (لحظه دریافت واقعی)
- `isManualOverride` → boolean (اگر کاربر به‌جای API دستی قیمت وارد کرده باشد)
- `createdAt` → datetime

> **نکته**: `price_history` هرگز توسط فیچرهای سرمایه‌گذاری مستقیماً نوشته نمی‌شود؛ فقط از طریق APIهای همین فیچر (`fetchAndStorePrices`) پر می‌شود. فیچرهای دیگر فقط Read دارند (`getLatestPrice`).

---

## APIهای داخلی (مشترک)

- `getAllSources(assetCategory?)`
- `createSource(data)` / `updateSource(id, data)`
- `getLatestPrice(symbol, targetCurrency?)` → آخرین قیمت کش‌شده یک نماد
- `getPriceHistory(symbol, dateRange?)` → برای نمودار تاریخچه قیمت
- `fetchAndStorePrices(symbols[], sourceId)` → دریافت دستی از API و افزودن به `price_history` (پیاده‌سازی هر زیرفیچر جدا؛ نگاه کنید به `19-01-Crypto-Prices`)

---

## روابط با سایر فیچرها

- **Investment - Crypto / Stocks Iran / FIF / Metals**: این فیچرها برای محاسبه Unrealized P&L و ارزش لحظه‌ای پرتفوی از `getLatestPrice()` استفاده می‌کنند؛ خودشان API خارجی صدا نمی‌زنند.
- **Portfolio & Wealth Overview**: استفاده از آخرین قیمت‌ها برای Snapshot ارزش کل ثروت.
- **Currency & Multi-Currency**: تبدیل نهایی قیمت به ارز پایه کاربر با `cur_exchange_rates` انجام می‌شود، نه در همین فیچر.
- **Settings & Tools**: مدیریت منابع قیمت (فعال/غیرفعال کردن، افزودن کلید API محلی) از صفحه تنظیمات انجام می‌شود؛ این فیچر صفحه مستقل در ناوبری اصلی ندارد (طبق اصل «صفحات کم» در `Pages-IA.md`) و به‌صورت دکمه «به‌روزرسانی قیمت» داخل صفحه «سرمایه‌گذاری» (`/investments`) و بخش تنظیمات (`/settings`) نمایش داده می‌شود.

---

## مسیر ارتقا (آینده)

- **اجرای خودکار (Scheduled Sync)**: بعد از v1، امکان اجرای دوره‌ای (مثلاً هر ۱۵ دقیقه در زمانی که اپ باز است، از طریق `setInterval` سبک در Service Worker، نه یک Cron واقعی سمت سرور — چون سیستم کاملاً Client-Side و آفلاین است).
- **زیرفیچرهای بعدی**: Stock Prices، Housing Prices، Metals Prices — هرکدام با همان جداول مشترک (`price_sources`, `price_history`) و فقط منطق Fetch/Parse مخصوص به خودشان، طبق الگوی `19-01-Crypto-Prices`.
- **چند منبع همزمان با اولویت‌بندی**: در صورت نیاز، امکان تعریف منبع «اصلی» و «پشتیبان» برای هر نماد و Fallback خودکار در صورت شکست منبع اصلی.
