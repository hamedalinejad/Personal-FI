# زیر‌فیچر: Investment - Crypto Price Data (داده‌های قیمتی کریپتو)

## توضیح کلی

این زیر‌فیچر **مسئولیت کامل مدیریت قیمت‌های کریپتو** را برعهده دارد.  
شامل:
- دریافت قیمت‌ها از API‌های خارجی (CoinGecko, Binance, Kraken و ...)
- ذخیره‌سازی قیمت‌های تاریخی برای محاسبات دقیق
- فراهم کردن قیمت لحظه‌ای برای محاسبه سود/زیان تحقق‌نیافته
- پشتیبانی از Offline Mode با کش محلی
- تبدیل قیمت‌ها بین ارزهای مختلف (BTC→IRR, ETH→USDT و ...)

---

## Business Rules

1. **مبدأ قیمت**: قیمت‌های درخواستی باید از منابع معتبر بیرونی دریافت شوند.
2. **فرکونسی به‌روزرسانی**: 
   - قیمت‌های رایج (BTC, ETH, USDT): هر ۱ ساعت
   - سایر کریپتو‌ها: هر ۶ ساعت
   - کریپتو‌های ایرانی (RZR, RBTC): از منابع محلی هر ۲۴ ساعت
3. **ذخیره‌سازی**: تمام قیمت‌های دریافتی **باید** در جدول `inv_crypto_price_history` ثبت شوند (برای تاریخچه و محاسبات دقیق).
4. **Offline Mode**: اگر API دسترسی‌پذیر نباشد، آخرین قیمت ذخیره‌شده استفاده می‌شود (با نشان‌دادن timestamp staleness).
5. **قیمت‌های Fiat**: قیمت‌های BTC/ETH/... به USDT و IRR تبدیل می‌شوند.
6. **قیمت‌های Pair**: اگر دو کریپتو مختلف مبادله شود (BTC←→ETH)، هر دو ثبت می‌شوند.
7. **Precision**: هر ارز دقت مشخصی دارد:
   - فیاتی (USD, IRR): ۲ رقم اعشار
   - BTC, ETH: ۸ رقم اعشار
   - سایر کریپتو: ۶ رقم اعشار (حداقل)
8. **De-peg Handling**: USDT و BUSD می‌تواند از ۱ دلار انحراف داشته باشد — قیمت واقعی ذخیره می‌شود.
9. **Immutable History**: قیمت‌های ثبت‌شده ویرایش‌پذیر نیستند (fairness & audit).
10. **Price Cache**: برای سرعت و Offline، آخرین ۲۴ ساعت قیمت‌ها در memory cache نگهداری می‌شود.

---

## Domain Entities

### ۱. Crypto Price History (جدول: `inv_crypto_price_history`)

- `id` → UUID (Primary Key)
- `symbol` → string (BTC, ETH, USDT, BNB, DOGE, RZR, RBTC و ...)
- `price` → decimal (قیمت در پایه‌ی ارزی مشخص)
- `baseCurrency` → string (ارزی که قیمت بر حسب آن است: USD, IRR, EUR و ...)
- `source` → string (کدام API: coingecko, binance, kraken, local و ...)
- `priceInUSDT` → decimal (معادل USDT — اختیاری، برای سرعت)
- `priceInIRR` → decimal (معادل ریال — اختیاری، برای سرعت)
- `timestamp` → datetime (لحظه‌ای که قیمت به‌دست آمد)
- `isStale` → boolean (آیا قیمت قدیمی‌تر از TTL است؟ — برای Offline indication)
- `createdAt` → datetime

> **نکته مهم - Denormalization**: `priceInUSDT` و `priceInIRR` denormalized هستند برای سرعت. اگر exchange rate تغییر کرد، این فیلدها دوباره محاسبه نمی‌شوند — فقط قیمت اصلی (`price` و `baseCurrency`) درست است.

### ۲. Crypto Price Source Config (جدول: `inv_crypto_price_sources`)

- `id` → UUID
- `name` → string (نام source: CoinGecko, Binance, ...)
- `apiUrl` → string (URL endpoint)
- `apiKey` → string (nullable — اگر نیازمند auth)
- `symbols` → JSON array (کدام symbols از این source؟)
  ```json
  ["BTC", "ETH", "USDT", "BNB", ...]
  ```
- `baseCurrency` → string (قیمت بر حسب کدام ارز؟)
- `updateFrequencyMinutes` → integer (تعداد دقیقه بین دریافت‌های متوالی)
- `priority` → integer (اگر چند source موجود بود، کدام اول؟)
- `isActive` → boolean
- `lastFetchedAt` → datetime (آخرین دریافت موفق)
- `nextFetchAt` → datetime (زمان دریافت بعدی)
- `createdAt` → datetime
- `updatedAt` → datetime

### ۳. Crypto Price Cache (جدول: `inv_crypto_price_cache`)

> این جدول برای **سرعت** است و می‌تواند ۲۴ ساعت اخیر را نگاه دارد.

- `id` → UUID
- `symbol` → string (composite key: symbol)
- `baseCurrency` → string (composite key: baseCurrency)
- `latestPrice` → decimal
- `latestPriceInUSDT` → decimal
- `latestPriceInIRR` → decimal
- `latestTimestamp` → datetime
- `isStale` → boolean
- `lastUpdatedAt` → datetime

> **نکته**: این جدول از `inv_crypto_price_history` توسط **Cron Job** به‌روزرسانی می‌شود (هر ۵ دقیقه یک بار آخرین رکورد کپی می‌شود). در **Offline Mode**، API request ناموفق است و `isStale = true` شده اما cache شامل آخرین قیمت معروف است.

---

## APIهای داخلی

### Price Fetch APIs
- `fetchPricesFromAPI(sourceId)` 
  → API خارجی را فراخوانی کن، قیمت‌های دریافتی را بررسی کن، و در `inv_crypto_price_history` ذخیره کن
  → Output: `{ success: boolean, fetchedCount: number, errors?: Array }`
  
- `fetchAllActivePrices()` 
  → تمام active sources را iterate کن و `fetchPricesFromAPI()` را برای هرکدام فراخوانی کن
  → می‌تواند **Cron Job** باشد (هر ۱ ساعت)

### Price Query APIs
- `getCurrentPrice(symbol, baseCurrency?)` → آخرین قیمت از cache
  - Output: `{ price: Decimal, timestamp: datetime, isStale: boolean }`
  - اگر `baseCurrency` وارد نشود، پیش‌فرض USD
  
- `getPriceInUSDT(symbol)` → نسخه اختصاری برای USDT
  - Output: `{ price: Decimal, timestamp: datetime }`
  
- `getPriceInIRR(symbol)` → نسخه اختصاری برای ریال
  - Output: `{ price: Decimal, timestamp: datetime }`
  
- `getPriceHistory(symbol, baseCurrency, startDate, endDate)` → تاریخچه قیمت
  - Output: `Array<{ price, timestamp, source }>`
  
- `convertCryptoPair(amountFrom, symbolFrom, symbolTo, targetDate?)` 
  → تبدیل یک کریپتو به دیگری (برای معاملات pair)
  - اگر `targetDate` داده نشود، از قیمت فعلی استفاده می‌شود
  - Output: `{ amountTo: Decimal, exchangeRateUsed: Decimal, timestamp: datetime }`

### Admin/Maintenance APIs
- `savePriceSource(data)` → ثبت منبع قیمتی جدید
- `updatePriceSource(id, data)` → ویرایش منبع
- `getActivePriceSources()` → لیست active sources
- `testPriceSourceConnection(sourceId)` → تست اتصال به API (برای setup)
- `cleanupOldPriceHistory(olderThanDays)` → حذف قیمت‌های قدیمی‌تر از X روز (برای space)

---

## فرمول‌ها و منطق

### ۱. تبدیل قیمت بین ارزها

اگر قیمت BTC به USD موجود است و ما نیاز به BTC→IRR داریم:

```
priceBTC_IRR = priceBTC_USD * exchangeRate_USD_IRR
```

### ۲. محاسبه unrealized P&L با قیمت‌های تاریخی

برای محاسبه P&L در تاریخ گذشته (مثل صورتحساب):

```
currentValueAtDate = quantity * getPriceHistory(symbol, targetDate)
unrealizedPL = currentValueAtDate - totalInvested
```

### ۳. De-peg Handling برای Stablecoins

اگر USDT قیمت = 0.95 USD (de-peg):

```
priceInIRR = 0.95 * exchangeRate_USD_IRR
```

(قیمت واقعی استفاده می‌شود، نه صرفاً ۱)

---

## روابط با سایر فیچرها

- **Investment-Crypto**: `getPortfolioValue()` از `getCurrentPrice()` استفاده می‌کند
- **Portfolio & Wealth**: `getPortfolioOverview()` قیمت‌ها را می‌خواند
- **Reports & Analytics**: `getPortfolioTrend()` از `getPriceHistory()` استفاده می‌کند
- **Currency & Multi-Currency**: نرخ تبدیل ارزها
- **Dashboard**: نمایش قیمت‌های فعلی و تغییرات %
- **Accounts & Banking**: توجیه تراکنش‌های رمزارز (نمایش قیمت بررسی‌شده)

---

## نکات طراحی

### Offline Behavior

```
if (API_AVAILABLE) {
  // Fetch new prices, update history, update cache
  fetchPricesFromAPI()
  return currentPrices
} else {
  // Use cache, mark as stale
  price = getFromCache(symbol)
  price.isStale = true
  return price
}
```

### Price Staleness Indicator

```
TTL_MINUTES = {
  major: 60,        // BTC, ETH, USDT
  common: 360,      // سایر top coins
  rare: 1440        // کریپتو‌های کم‌معاملات
}

isStale = (now - lastFetchTime) > TTL_MINUTES[type]
```

### Error Handling

اگر API سقوط کند یا قیمت دریافت نشود:
- ✅ UI نشان دهد: "Price as of [timestamp] — May be outdated"
- ✅ استفاده از آخرین معروف
- ✅ در log ثبت شود: error و retry time
- ❌ **نه** Zero price یا crash

### Performance

```
- inv_crypto_price_cache → indexed on (symbol, baseCurrency)
- inv_crypto_price_history → indexed on (symbol, timestamp)
- Query by symbol + date range → FAST
- Cache hit ratio target > 95%
```

---

## خروجی `getCurrentPrice` API

```typescript
{
  symbol: "BTC",
  baseCurrency: "USD",
  price: 45234.56,
  priceInUSDT: 45234.56,
  priceInIRR: 2_714_073_600,  // 45234.56 * 60000
  timestamp: "2024-08-11T14:30:00Z",
  isStale: false,               // false = fresh, true = offline
  source: "coingecko",
  staleSince?: null             // null if fresh, or datetime if stale
}
```

---

## خروجی `getPriceHistory` API

```typescript
[
  { price: 45000, timestamp: "2024-08-11T14:00:00Z", source: "coingecko" },
  { price: 45100, timestamp: "2024-08-11T13:00:00Z", source: "binance" },
  { price: 45050, timestamp: "2024-08-11T12:00:00Z", source: "kraken" }
]
```

---

## Cron Jobs (Recommended)

```
1. Every 1 hour:   fetchAllActivePrices()
2. Every 5 minutes: Update inv_crypto_price_cache from latest inv_crypto_price_history
3. Daily:          cleanupOldPriceHistory(olderThanDays=90)
```

---

## Integration Checklist

- [ ] Define `inv_crypto_price_history` schema
- [ ] Define `inv_crypto_price_sources` config
- [ ] Implement `fetchPricesFromAPI()` with error handling
- [ ] Implement `getCurrentPrice()` with cache fallback
- [ ] Implement `getPriceHistory()` with date range queries
- [ ] Implement `convertCryptoPair()` for multi-asset transactions
- [ ] Create Cron job for periodic fetches
- [ ] Add UI indicator for price staleness (offline mode)
- [ ] Document supported price sources and APIs
- [ ] Add price validation (reject obviously wrong prices)
- [ ] Add rate-limiting for API calls (avoid throttling)
- [ ] Add unit tests for price calculations and conversions
