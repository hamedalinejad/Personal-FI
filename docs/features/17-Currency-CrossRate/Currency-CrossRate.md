# فیچر: Currency & Cross-Rate (ارز و نرخ‌های تبدیل)

## توضیح کلی

این فیچر مسئولیت مدیریت **نرخ‌های تبدیل بین ارزها** را بر عهده دارد. 
سیستم اجازه می‌دهد کاربر یک ارز پایه (مثلاً IRR) و ارز مقصد (مثلاً USDT) را انتخاب کند و نرخ تبدیل لحظه‌ای را دریافت کند.

این فیچر پایه‌ای برای سایر فیچرهاست که به دو ارز نیاز دارند:
- نگهداری مقدار در ارز مبدا (مثلاً IRR)
- محاسبه و نمایش معادل در ارز مقصد (مثلاً USDT)

---

## User Stories

### Must Have
- دریافت نرخ تبدیل لحظه‌ای بین ارزها
- ذخیره نرخ تبدیل لحظه برای تراکنش‌های تاریخی
- انتخاب ارز پیش‌فرض نمایش برای کاربر
- تبدیل خودکار مبالغ در گزارش‌ها و نمایش‌ها
- منابع معتبر نرخ تبدیل (API خارجی یا کش)

### Should Have
- تاریخچه نرخ‌های تبدیل
- مقایسه نرخ لحظه با نرخ میانگین
- هشدار تغییر نرخ‌ها به صورت ناگهانی
- نرخ‌های دستی (برای پیش‌رفت در صورت آفلاین بودن)

---

## Business Rules

1. نرخ تبدیل لحظه باید همیشه نسبت به یک ارز پایه محاسبه شود (معمولاً IRR → USDT یا IRR → USD).
2. نرخ تبدیل برای هر تراکنش باید در لحظه انجام ثبت شود (برای نگهداری ارزش تاریخی).
3. تبدیل از ارز A به B با فرمول: `amountB = amountA / exchangeRateAtoB` (یا `*` برای معکوس) انجام می‌شود.
4. در صورت آفلاین بودن، از آخرین نرخ معتبر استفاده می‌شود.
5. اجازه ندارد نرخ تبدیل صفر یا منفی باشد.
6. تبدیل‌ها فقط با نرخ‌های تاییدشده انجام می‌شوند.

---

## Domain Entities

### ۱. Currency (جدول: `cur_currencies`)

- `id` → UUID (Primary Key)
- `code` → string (ISO code: IRR, USDT, USD, BTC و ...)
- `name` → string (نام کامل: تتر، دلار آمریکا، ریال و ...)
- `symbol` → string (نماد: ₹, $, ₿ و ...)
- `isFiat` → boolean
- `isCrypto` → boolean
- `isActive` → boolean
- `createdAt` → datetime

### ۲. Exchange Rate (جدول: `cur_exchange_rates`)

- `id` → UUID (Primary Key)
- `fromCurrencyCode` → string (مثلاً IRR)
- `toCurrencyCode` → string (مثلاً USDT)
- `rate` → decimal (نرخ تبدیل عمومی: `amountTo = amountFrom / rate`)
 - برای IRR → USDT: ریال به ازای ۱ تتر (مثال: ۶۰,۰۰۰)
 - برای EUR → USD: یورو به ازای ۱ دلار
 - برای هر جفت ارز: مقدار ارز From به ازای ۱ واحد ارز To
- `source` → string (api, manual, cached)
- `lastUpdated` → datetime
- `isValid` → boolean
- `createdAt` → datetime

> **نکته توضیحی**: این جدول **عمومی** برای هر جفت‌ارزی است. 
> برای محاسبه: `amountTo = amountFrom / rate` (یا `amountFrom = amountTo * rate`). 
> **یکسان‌سازی**: در تراکنش‌های واقعی (Income, Expense, Loan, Stocks, Crypto و غیره)، نرخ تبدیل لحظه‌ای نسبت به **ارز پایه کاربر** (`baseCurrency` در `cur_currency_preferences`) ثبت می‌شود (فیلد `exchangeRateToBase` در جداول مربوطه)، نه صرفاً نسبت به تتر. این جدول (`cur_exchange_rates`) برای ذخیره تمام نرخ‌های ارزی بین هر جفت ارز دلخواه است و نام‌گذاری عمومی `rate` آن را روشن‌تر می‌کند.

### ۳. User Currency Preference (جدول: `cur_currency_preferences`)

- `id` → UUID
- `displayCurrency` → string (ارز نمایشی پیش‌فرض)
- `baseCurrency` → string (ارز پایه برای محاسبات)
- `createdAt` → datetime
- `updatedAt` → datetime

> **نکته**: 
> طبق مدل چندکاربری مستندشده در `db.md` (هر کاربر = یک فایل دیتابیس SQLite مستقل)، نیازی به فیلد `userId` در این جدول یا هیچ جدول دیگری نیست؛ هر کاربر دیتابیس و به تبع آن تنظیمات ارز مستقل خودش را دارد.

---

## APIهای داخلی

### Currency APIs
- `getCurrencies` → لیست ارزهای فعال
- `getCurrencyByCode(code)` → دریافت ارز با کد مشخص

### Exchange Rate APIs
- `getExchangeRate(fromCode, toCode)` → دریافت نرخ تبدیل لحظه‌ای (rate)
- `saveExchangeRate(fromCode, toCode, rate, source)` → ذخیره نرخ تبدیل
- `getRateHistory(fromCode, toCode, startDate, endDate)` → تاریخچه نرخ

### Utility APIs
- `convert(amount, fromCurrency, toCurrency, asOf?)` → تبدیل؛ **بدون asOf فقط برای نمایش جاری**؛ گزارش تاریخی **باید** asOf یا نرخ قفل‌شده تراکنش را بدهد
- `getRatesForCurrency(currencyCode)` → نرخ‌های مرتبط با یک ارز

### Preference APIs
- `getUserCurrencyPreference` → دریافت تنظیمات نمایش کاربر جاری (از دیتابیس محلی همان کاربر)
- `updateUserCurrencyPreference(displayCurrency, baseCurrency)` → به‌روزرسانی

> نکته: هر کاربر دیتابیس مستقل خودش را دارد (به `db.md` مراجعه شود)، بنابراین APIها نیازی به پارامتر `userId` ندارند.

---

## روابط با سایر فیچرها

- **Accounts & Banking**: ذخیره `currency` در Account و `exchangeRateToBase` در تراکنش‌ها
- **Income / Expense**: ذخیره `currency` در تراکنش و تبدیل به نرخ لحظه
- **Investment (همه زیر‌فیچرها)**: ذخیره `exchangeRateToBase` برای هر تراکنش و محاسبه `totalFeesPaidBase` (؛ نه USDT سخت‌کد)
- **Physical Assets**: ذخیره `currency` و `exchangeRateToBase` در خرید و فروش
- **Budget**: نمایش مبالغ در ارز پیش‌فرض کاربر
- **Financial Goals**: نمایش پیشرفت اهداف به ارز پیش‌فرض
- **Reports / Dashboard**: تبدیل مبالغ به ارز نمایشی کاربر با نرخ تاریخی
- **Tax Management**: نمایش مالیات‌ها به ارز پیش‌فرض

---

## منطق تبدیل

تابع `convert` باید برای **هر جفت ارز دلخواه** کار کند، نه فقط IRR↔USDT. الگوریتم:

1. اگر نرخ مستقیم بین `fromCurrency` و `toCurrency` در `cur_exchange_rates` موجود باشد، از همان استفاده شود.
2. در غیر این صورت، از **USDT به‌عنوان ارز واسط** (Bridge Currency) استفاده شود: `fromCurrency → USDT → toCurrency`.
3. تمام محاسبات با `decimal.js` انجام شود (هرگز `Number`).

```typescript
// pseudo-code — همیشه با decimal.js در Domain Layer پیاده‌سازی شود
import Decimal from 'decimal.js';

// rate در cur_exchange_rates: مقدار ارز From به ازای ۱ واحد ارز To
// یعنی: amountTo = amountFrom / rate

async function convert(
 amount: Decimal,
 fromCurrency: string,
 toCurrency: string
): Promise<Decimal> {
 if (fromCurrency === toCurrency) return amount;

 // ۱. تلاش برای نرخ مستقیم
 const directRate = await getExchangeRate(fromCurrency, toCurrency);
 if (directRate) {
 return amount.dividedBy(directRate.rate);
 }

 // ۲. تلاش برای نرخ معکوس مستقیم (toCurrency → fromCurrency)
 const inverseRate = await getExchangeRate(toCurrency, fromCurrency);
 if (inverseRate) {
 return amount.times(inverseRate.rate);
 }

 // ۳. تبدیل چندمرحله‌ای از طریق USDT به‌عنوان ارز واسط
 // مثال: BTC → USDT → IRR
 if (fromCurrency !== 'USDT' && toCurrency !== 'USDT') {
 const toUSDT = await convert(amount, fromCurrency, 'USDT');
 return convert(toUSDT, 'USDT', toCurrency);
 }

 throw new Error(
 `مسیر تبدیل بین ${fromCurrency} و ${toCurrency} یافت نشد — نرخ دستی وارد کنید`
 );
}
```

> **نکته پیاده‌سازی**: در سطح تراکنش (مثلاً `inv_crypto_transactions`)، فیلد `exchangeRateToBase` همیشه **نتیجه نهایی** همین الگوریتم است که در لحظه ثبت تراکنش محاسبه و به‌صورت Snapshot ذخیره می‌شود، نه یک نرخ مستقیم فرضی.

---

## نکات طراحی

- نرخ تبدیل لحظه باید برای هر تراکنش ذخیره شود تا ارزش تاریخی حفظ شود.
- نرخ‌های پایه (مثلاً IRR → USDT) روزانه از API خارجی آپدیت می‌شوند.
- در صورت آفلاین بودن، از کش آخرین نرخ معتبر استفاده می‌شود.
- امکان تنظیم ارز پیش‌فرض نمایش برای کاربر وجود دارد.
- این فیچر به تنهایی تراکنش مالی ایجاد نمی‌کند؛ فقط توابع کمکی ارائه می‌دهد.
- برای کاربران ایرانی، پیش‌فرض IRR → USDT است.

---

## قرارداد `exchangeRateToBase` واقعی

### تعریف صحیح
`exchangeRateToBase` = چند واحد **ارز پایه کاربر** (`cur_currency_preferences.baseCurrency`) به ازای **۱ واحد ارز تراکنش** در لحظه ثبت.

مثال‌ها اگر `baseCurrency = IRR`:
- تراکنش USDT: `exchangeRateToBase ≈ 600000` یعنی ۱ USDT = ۶۰۰٬۰۰۰ IRR
- تراکنش USD: نرخ دلار به ریال

اگر `baseCurrency = USD`:
- تراکنش USDT: نزدیک `1` (نه ریال به تتر)
- تراکنش IRR: نرخ ریال→دلار (عدد کوچک)

### ممنوع
توضیح یا پیاده‌سازی که `exchangeRateToBase` را **همیشه** «ریال به ازای یک USDT» فرض کند — مگر `baseCurrency` واقعاً IRR و ارز تراکنش USDT باشد.

### Snapshotهای مکمل (برای کریپتو/ایران — اختیاری ولی توصیه‌شده)
وقتی ارز گزارش‌دهی محلی جدا از base است، علاوه بر `exchangeRateToBase` می‌توان ذخیره کرد:
| فیلد | معنی |
|------|------|
| `exchangeRateToBase` | ارز تراکنش → base کاربر (اجباری) |
| `quoteCurrency` | ارز مبلغ تراکنش (مثلاً USDT) |
| `rateQuoteToIrr` | nullable — اگر UI ایران بخواهد معادل ریالی تاریخی جدا از base |

محاسبه ارزش به base (با decimal.js) — سه حالت:
- ارز تراکنش = baseCurrency: `amountInBase = amount` (بدون تبدیل)
- ارز تراکنش ≠ baseCurrency و نرخ به‌صورت «base per 1 unit tx»: `amountInBase = amount × exchangeRateToBase` (مثال: USDT→IRR)
- ارز تراکنش = IRR و baseCurrency = USDT: `amountInBase = amount / exchangeRateToBase` (تقسیم، نه ضرب)
> الگوی مرجع: تابع `convertFeeToBase` در `Investment-Crypto.md` هر سه حالت را صریحاً مدیریت می‌کند.

همه فیچرها (Crypto, Stocks, FIF, Loans, Tax, Metals) باید از همین تعریف استفاده کنند؛ متن‌های قدیمی «ریال به ازای ۱ تتر» فقط مثال وقتی base=IRR هستند.

## پیاده‌سازی
- نرخ‌ها decimal string؛ `convert(amount, from, to)` فقط از `decimal.js` و Rounding-Policy
- آفلاین: آخرین نرخ کش‌شده؛ اگر نبود، ثبت تراکنش با نرخ دستی کاربر الزامی است
- این فیچر **هرگز** `acc_transactions` نمی‌سازد

---

## تبدیل تاریخی و زنجیره‌ای (Invariant)

### `convert(amount, from, to, asOf?)`
- بدون `asOf` → نرخ جاری کش (آخرین معتبر)
- با `asOf` (تاریخ/زمان valuation) → **فقط** نرخ با `rateDate ≤ asOf` (نزدیک‌ترین قبلی)؛ اگر نبود → خطا یا الزام نرخ دستی کاربر — **هرگز** latest به‌جای تاریخی برای P&L گذشته

### Historical P&L
```text
valueInBase(asOf) = price(instrument, quote, asOf) × convert(1, quote, base, asOf)
```
قیمت و FX باید **همان asOf** باشند.

### زنجیره تبدیل (مثلاً ETH→BTC→USDT→IRR)
```text
convertChain(amount, [c1,c2,...,cn], asOf) =
  fold convert step-by-step با نرخ‌های asOf هر جفت
```
اگر مسیر مستقیم `from→to` در جدول نرخ نبود، مسیر مجاز:
1. مستقیم در `cur_rates`
2. via `baseCurrency`
3. via USDT (اگر در تنظیمات `bridgeCurrency` تعریف شده)
4. در غیر این صورت fail — سکوت و latest ممنوع

روی تراکنش: ترجیحاً `exchangeRateToBase` همان لحظه **قفل** شود تا rebuild به FX آینده وابسته نباشد.

---

## Currency Registry

جدول `cur_currencies` (یا seed در DB): هر ردیف = یک `CurrencyRecord` (types.md).

- `minorUnit` / `precision` / `roundingMode` از registry خوانده می‌شود نه hard-code
- افزودن ارز = INSERT registry + در صورت نیاز literal در Union شناخته‌شده
- `convert` قبل از اجرا `assertCurrency(code)` از registry

## Currency در برابر Asset

| | Currency | Asset |
|--|----------|--------|
| مثال | IRR, USD, USDT (به‌عنوان واحد پول) | BTC on Ethereum, USDT-TRC20, فولاد, fundId |
| Registry | `cur_currencies` | `inv_crypto_assets` / instrumentId سهام / … |
| نقش | واحد اندازه‌گیری مبلغ | آنچه نگه داشته/معامله می‌شود |

موجودی «USDT روی صرافی» = Holding روی **Asset** با quote/settlement در **Currency** USDT.

---

## Conversion Path Audit

علاوه بر `exchangeRateToBase` (نرخ نهایی قفل‌شده):

| فیلد اختیاری/توصیه | نقش |
|---------------------|------|
| `conversionPath` | JSON: `[{from,to,rate,asOf,source}]` برای هر leg |
| `rateId` | FK به ردیف `cur_rates` در صورت وجود |

برای زنجیره BTC→USDT→IRR هر leg در path ذخیره می‌شود تا بازسازی تاریخی ممکن باشد.  
حداقل v1: `exchangeRateToBase` + `asOf` روی تراکنش اجباری؛ path برای multi-hop Should Have قوی / Must وقتی >1 leg.

---

## تغییر baseCurrency

Preference فقط برای **tx و valuation آینده** و restatement اختیاری است.  
Journal/`amountInBase` تاریخی دست نخورده (`baseCurrencyAtOperation`).  
جزئیات در `Canonical-Financial-Operation.md`.

`amountInBase` پس از persist **rebuild نمی‌شود** مگر migration با `calculationVersion` صریح.

---

## IRR و تومان (نمایش)

- **Currency در DB:** فقط `IRR`
- **UI:** Rial یا Toman (`1 Toman = 10 Rial`)
- ممنوع: ارز جدا `TOM`/`IRT` در ledger

---

## Conversion paths (v1 — بدون USDT hard-code)

**ممنوع:** فرض دائمی `A → USDT → B` در Core.

v1 modes:

| Mode | |
|------|--|
| `direct` | pair موجود در rates |
| `inverse` | 1/rate |
| `configured_bridge` | bridge صریح در settings (می‌تواند USDT یا USD باشد) |
| `manual` | نرخ دستی کاربر برای همان asOf |

آینده: Currency Graph برای shortest path — خارج از scope پیچیدگی v1.

### نام نرخ به base

**Canonical semantic name:** `basePerTransactionUnit`

تعریف:

```text
exchangeRateToBase = basePerTransactionUnit
= چند واحد baseCurrency به ازای 1 واحد transactionCurrency
```

ستون DB می‌تواند همان `exchangeRateToBase` بماند؛ در Dictionary و کد، معنی = `basePerTransactionUnit`.
