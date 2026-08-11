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
- `rate` → decimal (نرخ تبدیل: `amountTo = amountFrom / rate`)
  - تعریف یکتا: **«مقدار ارز From به ازای ۱ واحد ارز To»**
  - برای IRR → USDT: rate = ۶۰,۰۰۰ (یعنی ۶۰,۰۰۰ ریال = ۱ تتر)
  - برای EUR → USD: rate = ۰.۹۲ (یعنی ۰.۹۲ یورو = ۱ دلار)
  - **قرارداد ذخیره‌سازی**: فقط یک جهت از هر جفت ارز ذخیره می‌شود — ترجیحاً جهتی که rate > 1 دارد (ارز ضعیف→ارز قوی). جهت معکوس در `convert()` محاسبه می‌شود.
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
- `getCurrencies()` → لیست ارزهای فعال
- `getCurrencyByCode(code)` → دریافت ارز با کد مشخص

### Exchange Rate APIs
- `getExchangeRate(fromCode, toCode)` → دریافت نرخ تبدیل لحظه‌ای (rate)
- `saveExchangeRate(fromCode, toCode, rate, source)` → ذخیره نرخ تبدیل
- `getRateHistory(fromCode, toCode, startDate, endDate)` → تاریخچه نرخ

### Utility APIs
- `convert(amount, fromCurrency, toCurrency)` → تبدیل مبلغ (نرخ مستقیم، معکوس یا از طریق USDT به‌عنوان ارز واسط پیدا می‌شود)
- `getRatesForCurrency(currencyCode)` → نرخ‌های مرتبط با یک ارز

### Preference APIs
- `getUserCurrencyPreference()` → دریافت تنظیمات نمایش کاربر جاری (از دیتابیس محلی همان کاربر)
- `updateUserCurrencyPreference(displayCurrency, baseCurrency)` → به‌روزرسانی

> نکته: هر کاربر دیتابیس مستقل خودش را دارد (به `db.md` مراجعه شود)، بنابراین APIها نیازی به پارامتر `userId` ندارند.

---

## روابط با سایر فیچرها

- **Accounts & Banking**: ذخیره `currency` در Account و `exchangeRateToBase` در تراکنش‌ها
- **Income / Expense**: ذخیره `currency` در تراکنش و تبدیل به نرخ لحظه
- **Investment (همه زیر‌فیچرها)**: ذخیره `exchangeRateToBase` برای هر تراکنش و محاسبه `totalFeesPaidUSDT`
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

// ── تعریف یکتای rate ──────────────────────────────────────────────────────────
// rate در cur_exchange_rates همیشه به معنای:
//   «چه مقدار ارز FROM برابر ۱ واحد ارز TO است»
//
//   مثال‌ها:
//   IRR → USDT : rate = 60000   (یعنی ۶۰,۰۰۰ ریال = ۱ تتر)
//   USDT → IRR : rate = 0.0000167  (یعنی ۰.۰۰۰۰۱۶۷ تتر = ۱ ریال)
//   EUR → USD  : rate = 0.92   (یعنی ۰.۹۲ یورو = ۱ دلار)
//
//   فرمول تبدیل مستقیم:
//   amountTo = amountFrom / rate(from→to)
//
// ── قرارداد ذخیره‌سازی ────────────────────────────────────────────────────────
// فقط رکوردهایی که rate > 1 هستند یا «ارز ضعیف→ارز قوی» در دیتابیس ذخیره می‌شوند.
// مثال: IRR→USDT با rate=60000 ذخیره می‌شود.
//        USDT→IRR ذخیره نمی‌شود (معکوس آن محاسبه می‌شود).
//        BTC→USDT ذخیره نمی‌شود — در عوض USDT→BTC با rate=0.0000154 ذخیره می‌شود.
//
// برای نمادهای کریپتو، قیمت از Price Fetching (فیچر ۱۹) می‌آید و به صورت
// «USDT→symbol» در cur_exchange_rates درج می‌شود.
// ──────────────────────────────────────────────────────────────────────────────

async function convert(
  amount: Decimal,
  fromCurrency: string,
  toCurrency: string
): Promise<Decimal> {
  if (fromCurrency === toCurrency) return amount;

  // ۱. نرخ مستقیم (from→to) موجود است
  const directRate = await getExchangeRate(fromCurrency, toCurrency);
  if (directRate) {
    // amountTo = amountFrom / rate(from→to)
    return amount.dividedBy(directRate.rate);
  }

  // ۲. نرخ معکوس (to→from) موجود است — از آن معکوس استفاده می‌شود
  //    rate(to→from): مقدار To به ازای ۱ From
  //    پس: amountTo = amountFrom / (1 / rate(to→from)) = amountFrom * rate(to→from)
  //    ❗ نکته: این منطق فقط زمانی درست است که rate(to→from) = 1/rate(from→to)
  //            یعنی هر دو جهت دقیقاً معکوس هم باشند.
  //    مثال: rate(USDT→IRR) = 0.0000167 → amountIRR = amountUSDT / 0.0000167 ✅
  //          اما چون این رکورد ذخیره نشده، از rate(IRR→USDT)=60000 استفاده می‌کنیم:
  //          amountIRR = amountUSDT * 60000 ✅ (معادل amountUSDT / (1/60000))
  const inverseRate = await getExchangeRate(toCurrency, fromCurrency);
  if (inverseRate) {
    // amountTo = amountFrom * rate(to→from)
    // زیرا rate(to→from) = «مقدار To به ازای ۱ From» — دقیقاً ضریب تبدیل است
    return amount.times(inverseRate.rate);
  }

  // ۳. تبدیل دومرحله‌ای از طریق USDT به‌عنوان ارز واسط
  //    مثال: BTC → USDT → IRR
  //    شرط: هیچ‌کدام USDT نباشند (وگرنه حلقه بی‌نهایت)
  if (fromCurrency !== 'USDT' && toCurrency !== 'USDT') {
    const amountInUSDT = await convert(amount, fromCurrency, 'USDT');
    return convert(amountInUSDT, 'USDT', toCurrency);
  }

  throw new Error(
    `مسیر تبدیل بین ${fromCurrency} و ${toCurrency} یافت نشد — نرخ را دستی وارد کنید`
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