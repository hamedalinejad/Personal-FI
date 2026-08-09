# زیر‌فیچر: Price Fetching - Crypto Prices (دریافت قیمت ارز دیجیتال)

## توضیح کلی
اولین زیرفیچر از `19-Price-Fetching`. مسئول دریافت قیمت لحظه‌ای رمزارزها (نسبت به USDT) از یک API بیرونی و ذخیره آن در `price_history` با `assetCategory = 'crypto'`.  
خروجی این زیرفیچر مستقیماً توسط `Investment-Crypto` (`getPortfolioValue`, `calculateProfitLoss` بخش Unrealized) مصرف می‌شود.

---

## User Stories

### Must Have
- دریافت دستی (با یک کلیک) قیمت لحظه‌ای همه نمادهای رمزارزی موجود در `inv_crypto_holdings` کاربر (نسبت به USDT)
- نمایش نتیجه دریافت: تعداد نمادهای موفق، تعداد ناموفق، زمان آخرین به‌روزرسانی
- نمایش آخرین قیمت هر نماد (حتی اگر آفلاین باشد، از کش `price_history`)
- امکان وارد کردن دستی قیمت یک نماد (`isManualOverride = true`) برای مواردی که API پوشش نمی‌دهد

### Should Have
- نمودار ساده تاریخچه قیمت هر نماد بر اساس `price_history`
- انتخاب منبع قیمت از بین چند Provider (اگر بیش از یکی فعال باشد)

---

## Business Rules

1. نمادهایی که باید قیمت‌گیری شوند، از `DISTINCT symbol` روی `inv_crypto_holdings` کاربر استخراج می‌شوند (به‌جز `IRR` و `USDT` که قیمتشان همیشه ثابت و برابر ۱ است — طبق `Investment-Crypto.md`).
2. درخواست قیمت به‌صورت Batch (یک یا چند Request برای همه نمادها با هم، بسته به محدودیت API) ارسال می‌شود، نه یک Request جدا به ازای هر نماد — برای کاهش فشار روی Rate Limit.
3. قیمت هر نماد نسبت به **USDT** دریافت و ذخیره می‌شود (`priceCurrency = 'USDT'`)؛ تبدیل به ریال یا ارز پایه کاربر در لحظه مصرف با `cur_exchange_rates` (نرخ ریال/تتر) انجام می‌شود، طبق قاعده ۸ در سند اصلی فیچر.
4. اگر یک نماد در پاسخ API نباشد (مثلاً توکن خیلی جدید یا کم‌شناخته)، آن نماد Skip می‌شود و در UI با پیام «قیمت این نماد یافت نشد — می‌توانید دستی وارد کنید» نمایش داده می‌شود؛ باقی نمادها دریافت می‌شوند (Partial Success، طبق قاعده ۷ سند اصلی).
5. منبع قیمت پیش‌فرض نسخه ۱ در `price_sources` با `assetCategory = 'crypto'` ثبت می‌شود؛ انتخاب Provider مشخص (مثلاً CoinGecko یا Nobitex) در پیاده‌سازی نهایی تعیین و در همان جدول `baseUrl` می‌شود — این سند فقط قرارداد داده و رفتار را مشخص می‌کند، نه یک Provider خاص را قفل نمی‌کند.
6. ورود دستی قیمت (`isManualOverride = true`) هم مثل رکورد عادی در `price_history` append می‌شود؛ تفاوتش فقط پرچم `isManualOverride` و `sourceId = null` است.

---

## APIهای داخلی

- `fetchCryptoPrices(symbols[])` → دریافت از API خارجی + ذخیره Batch در `price_history` با `assetCategory='crypto'` + برگرداندن خلاصه نتیجه:
  ```typescript
  {
    succeeded: { symbol: string; price: Decimal }[],
    failed: { symbol: string; reason: string }[],
    fetchedAt: Timestamp
  }
  ```
- `getLatestCryptoPrice(symbol)` → میانبر روی `getLatestPrice(symbol)` فیچر پدر، مخصوص `assetCategory='crypto'`
- `setManualCryptoPrice(symbol, price, priceCurrency)` → ثبت دستی در `price_history`

---

## روابط با سایر فیچرها

- **Investment - Crypto**: مصرف‌کننده اصلی؛ دکمه «به‌روزرسانی قیمت‌ها» در صفحه `/investments` (تب Crypto) این API را صدا می‌زند.
- **Currency & Multi-Currency**: تبدیل نهایی USDT ↔ ارز پایه.
- **Portfolio & Wealth Overview**: استفاده غیرمستقیم از طریق `Investment-Crypto` برای Snapshot ارزش پرتفوی.

---

## نکات طراحی

- این زیرفیچر هیچ صفحه مستقلی در ناوبری ندارد؛ کاملاً به‌صورت دکمه/ویجت داخل صفحه سرمایه‌گذاری پیاده می‌شود (طبق اصل «صفحات کم»).
- در نسخه ۱ اجرای خودکار/Cron وجود ندارد؛ فقط دکمه دستی. مسیر ارتقا به اجرای خودکار در `Price-Fetching.md` مستند شده.
- الگوی این فایل (جداول مشترک `price_sources`/`price_history` + منطق مخصوص هر دسته دارایی) باید برای زیرفیچرهای بعدی (`19-02-Stock-Prices`, `19-03-Housing-Prices`, `19-04-Metals-Prices`) بدون تغییر در `Price-Fetching.md` یا فیچرهای دیگر تکرار شود.
