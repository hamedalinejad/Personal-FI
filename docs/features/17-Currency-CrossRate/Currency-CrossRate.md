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
- `convert(amount, fromCurrency, toCurrency)` → تبدیل مبلغ با Graph-based multi-hop routing (جزئیات در بخش «منطق تبدیل» زیر)
- `getRatesForCurrency(currencyCode)` → نرخ‌های مرتبط با یک ارز

### Preference APIs
- `getUserCurrencyPreference()` → دریافت تنظیمات نمایش کاربر جاری (از دیتابیس محلی همان کاربر)
- `updateUserCurrencyPreference(displayCurrency, baseCurrency)` → به‌روزرسانی

> نکته: هر کاربر دیتابیس مستقل خودش را دارد (به `db.md` مراجعه شود)، بنابراین APIها نیازی به پارامتر `userId` ندارند.

---

## روابط با سایر فیچرها

- **Accounts & Banking**: ذخیره `currency` در Account و `exchangeRateToBase` در تراکنش‌ها
- **Income / Expense**: ذخیره `currency` در تراکنش و تبدیل به نرخ لحظه
- **Investment (همه زیر‌فیچرها)**: ذخیره `exchangeRateToBase` برای هر تراکنش و محاسبه `totalFeesPaidBase`
- **Physical Assets**: ذخیره `currency` و `exchangeRateToBase` در خرید و فروش
- **Budget**: نمایش مبالغ در ارز پیش‌فرض کاربر
- **Financial Goals**: نمایش پیشرفت اهداف به ارز پیش‌فرض
- **Reports / Dashboard**: تبدیل مبالغ به ارز نمایشی کاربر با نرخ تاریخی
- **Tax Management**: نمایش مالیات‌ها به ارز پیش‌فرض

---

## منطق تبدیل — Graph-Based Multi-Hop Routing

> **باگ ۱۹ — وابستگی ساختاری به USDT به‌عنوان تنها Bridge (رفع‌شده)**  
> پیاده‌سازی قبلی فقط USDT را به‌عنوان ارز واسط پشتیبانی می‌کرد. اگر نرخ USDT موجود نبود، مسیر IRR→EUR هم شکست می‌خورد حتی اگر نرخ مستقیم یا Bridge دیگری (مثلاً IRR→USD→EUR) موجود بود. این وابستگی اکنون با یک Graph of Rates و BFS/Dijkstra routing برطرف شده است.

تابع `convert` باید برای **هر جفت ارز دلخواه** کار کند. الگوریتم:

1. اگر `fromCurrency === toCurrency` → مقدار بدون تغییر برگردد.
2. اگر نرخ مستقیم `from→to` در `cur_exchange_rates` موجود باشد، از همان استفاده شود.
3. اگر نرخ معکوس `to→from` موجود باشد، معکوس آن استفاده شود.
4. **Multi-hop BFS routing**: یک Graph از همه جفت‌ارزهای موجود در `cur_exchange_rates` ساخته می‌شود و با BFS کوتاه‌ترین مسیر (کمترین تعداد hop) پیدا می‌شود. هیچ ارز خاصی (از جمله USDT) dependency ساختاری نیست.
5. اگر هیچ مسیری پیدا نشد → خطا با پیام واضح (کاربر باید نرخ مستقیم را دستی وارد کند).

> **قانون طلایی**: USDT نباید dependency بنیادی سیستم باشد. اگر نرخ USDT unavailable باشد، مسیرهای دیگر (مثلاً IRR→USD→EUR) باید همچنان کار کنند.

```typescript
import Decimal from 'decimal.js';

// ── تعریف یکتای rate ──────────────────────────────────────────────────────────
// rate در cur_exchange_rates همیشه به معنای:
//   «چه مقدار ارز FROM برابر ۱ واحد ارز TO است»
//
//   مثال‌ها:
//   IRR → USDT : rate = 60000   (یعنی ۶۰,۰۰۰ ریال = ۱ تتر)
//   EUR → USD  : rate = 0.92   (یعنی ۰.۹۲ یورو = ۱ دلار)
//
//   فرمول تبدیل مستقیم:
//   amountTo = amountFrom / rate(from→to)

interface RateRecord {
  from: string;
  to: string;
  rate: Decimal; // «مقدار From به ازای ۱ واحد To»
}

async function buildRateGraph(): Promise<Map<string, RateRecord[]>> {
  const rates = await getAllValidExchangeRates(); // SELECT * FROM cur_exchange_rates WHERE isValid=true
  const graph = new Map<string, RateRecord[]>();

  for (const r of rates) {
    // جهت ذخیره‌شده
    if (!graph.has(r.fromCurrencyCode)) graph.set(r.fromCurrencyCode, []);
    graph.get(r.fromCurrencyCode)!.push({ from: r.fromCurrencyCode, to: r.toCurrencyCode, rate: new Decimal(r.rate) });

    // جهت معکوس (محاسبه‌شده)
    if (!graph.has(r.toCurrencyCode)) graph.set(r.toCurrencyCode, []);
    graph.get(r.toCurrencyCode)!.push({ from: r.toCurrencyCode, to: r.fromCurrencyCode, rate: new Decimal(1).dividedBy(r.rate) });
  }

  return graph;
}

async function convert(
  amount: Decimal,
  fromCurrency: string,
  toCurrency: string
): Promise<Decimal> {
  if (fromCurrency === toCurrency) return amount;

  const graph = await buildRateGraph();

  // BFS برای پیدا کردن کوتاه‌ترین مسیر
  const queue: { currency: string; multiplier: Decimal; path: string[] }[] = [
    { currency: fromCurrency, multiplier: new Decimal(1), path: [fromCurrency] }
  ];
  const visited = new Set<string>([fromCurrency]);

  while (queue.length > 0) {
    const { currency, multiplier, path } = queue.shift()!;
    const neighbors = graph.get(currency) ?? [];

    for (const edge of neighbors) {
      if (visited.has(edge.to)) continue;
      // amountTo = amountFrom / rate(from→to)  →  multiplier لازم = 1/rate
      const newMultiplier = multiplier.dividedBy(edge.rate);

      if (edge.to === toCurrency) {
        return amount.times(newMultiplier);
      }

      visited.add(edge.to);
      queue.push({ currency: edge.to, multiplier: newMultiplier, path: [...path, edge.to] });
    }
  }

  throw new Error(
    `مسیر تبدیل بین ${fromCurrency} و ${toCurrency} یافت نشد — نرخ را دستی وارد کنید`
  );
}
```

> **نکته عملکرد**: برای جلوگیری از rebuild مکرر Graph در هر تبدیل، می‌توان Graph را در حافظه کش کرد و فقط پس از `saveExchangeRate()` یا `updateBaseCurrency()` بازسازی کرد.

> **نکته پیاده‌سازی**: در سطح تراکنش (مثلاً `inv_crypto_transactions`)، فیلد `exchangeRateToBase` همیشه **نتیجه نهایی** همین الگوریتم است که در لحظه ثبت تراکنش محاسبه و به‌صورت Snapshot ذخیره می‌شود.

---

## قانون تغییر `baseCurrency` پس از وجود تراکنش‌ها — Critical

> **باگ ۲۰ — عدم تعریف قانون جامع برای تغییر `baseCurrency` (رفع‌شده)**  
> فیلدهایی مثل `averageBuyPrice`, `totalInvested`, `totalFeesPaidBase`, `netWorthBase` همگی با پسوند `Base` تعریف شده‌اند. اگر کاربر `baseCurrency` را از IRR به USDT تغییر دهد، این فیلدها نباید با مقادیر IRR قدیمی باقی بمانند — اما هیچ قانونی تا پیش از این مستند نشده بود.

### قانون بنیادین: داده‌های تاریخی **هرگز** rebase نمی‌شوند

**Snapshot‌های تاریخی** (فیلدهای `*Base` در لاگ تراکنش‌ها مانند `totalAmountBase`, `priceBase`, `feeAssetPriceToBase`) **قفل** هستند و با تغییر `baseCurrency` تغییر **نمی‌کنند**. دلیل: این مقادیر نرخ تبدیل لحظه معامله را نشان می‌دهند و تغییرشان حسابداری تاریخی را خراب می‌کند.

**Cache‌های تجمیعی** (فیلدهایی که از روی لاگ بازمحاسبه می‌شوند مانند `averageBuyPrice`, `totalInvested`, `totalFeesPaidBase` در `inv_crypto_holdings` و مشابهات در سایر Holdings) **باید** از صفر از روی لاگ با `baseCurrency` جدید بازمحاسبه شوند.

### جریان اجباری `updateBaseCurrency()`:

```typescript
async function updateBaseCurrency(newBaseCurrency: string): Promise<void> {
  // ۱. نرخ‌های لازم برای تبدیل باید از قبل در cur_exchange_rates موجود باشند
  //    (اگر نباشند، قبل از تغییر باید نرخ دستی وارد شود)
  
  // ۲. بررسی دسترس‌بودن نرخ‌های لازم
  const oldBase = await getCurrentBaseCurrency();
  const rateAvailable = await canConvert(oldBase, newBaseCurrency);
  if (!rateAvailable) {
    throw new Error(
      `برای تغییر ارز پایه از ${oldBase} به ${newBaseCurrency}، ابتدا نرخ تبدیل بین آن‌ها را وارد کنید`
    );
  }

  // ۳. همه Cache‌های تجمیعی از روی لاگ بازمحاسبه می‌شوند
  //    هر holding تمام تراکنش‌هایش را re-process می‌کند:
  //    - برای هر تراکنش تاریخی: totalAmountBase_old را با نرخ تاریخی آن تراکنش به newBase تبدیل کن
  //    - Weighted Average را از صفر rebuild کن
  await rebuildAllHoldingCaches(newBaseCurrency);

  // ۴. ذخیره baseCurrency جدید
  await updateUserCurrencyPreference({ baseCurrency: newBaseCurrency });
  
  // ۵. بازسازی Graph نرخ‌های ارزی
  await rebuildRateGraph();
  
  // ۶. لاگ در audit trail
  await logAuditEvent('base_currency_changed', { from: oldBase, to: newBaseCurrency });
}
```

### قانون نمایش داده‌های تاریخی:

در گزارش‌ها و تاریخچه تراکنش‌ها، داده‌های قبل از تغییر `baseCurrency` باید با **ذکر ارز پایه اصلی** نمایش داده شوند:

```
تراکنش ۱۴۰۲/۰۵/۱۵: خرید ۱ BTC — قیمت: ۴,۲۰۰,۰۰۰,۰۰۰ IRR (ارز پایه زمان ثبت: IRR)
تراکنش ۱۴۰۳/۰۱/۱۰: خرید ۰.۵ BTC — قیمت: ۳۵,۰۰۰ USDT (ارز پایه زمان ثبت: USDT)
```

> **پیشنهاد UI**: یک هشدار واضح قبل از تغییر `baseCurrency` نمایش داده شود که توضیح دهد Cache‌های تجمیعی بازمحاسبه می‌شوند، اما داده‌های تاریخی خام (تراکنش‌های لاگ) دست‌نخورده باقی می‌مانند.

### جدول خلاصه رفتار فیلدها هنگام تغییر `baseCurrency`:

| فیلد | جدول | رفتار پس از تغییر `baseCurrency` | دلیل |
|------|------|----------------------------------|------|
| `totalAmountBase` | `inv_crypto_transactions` | **بدون تغییر** (Snapshot تاریخی) | نرخ لحظه معامله قفل است |
| `priceBase` | `inv_crypto_transactions` | **بدون تغییر** (Snapshot تاریخی) | نرخ لحظه معامله قفل است |
| `exchangeRateToBase` | `inv_crypto_transactions` | **بدون تغییر** (Snapshot تاریخی) | نرخ لحظه معامله قفل است |
| `feeAssetPriceToBase` | `inv_crypto_transactions` | **بدون تغییر** (Snapshot تاریخی) | نرخ لحظه معامله قفل است |
| `averageBuyPrice` | `inv_crypto_holdings` | **بازمحاسبه** از لاگ با newBase | Cache تجمیعی |
| `totalInvested` | `inv_crypto_holdings` | **بازمحاسبه** از لاگ با newBase | Cache تجمیعی |
| `totalFeesPaidBase` | `inv_crypto_holdings` | **بازمحاسبه** از لاگ با newBase | Cache تجمیعی |
| `cashBalance` | `inv_stocks_iran_brokerages` | **بازمحاسبه** از لاگ با newBase | Cache تجمیعی |
| فیلدهای `*Base` در سایر Holdings | همه | همان الگو — Snapshot: بدون تغییر / Cache: بازمحاسبه | — |

---

## نکات طراحی

- نرخ تبدیل لحظه باید برای هر تراکنش ذخیره شود تا ارزش تاریخی حفظ شود.
- نرخ‌های پایه (مثلاً IRR → USDT) روزانه از API خارجی آپدیت می‌شوند.
- در صورت آفلاین بودن، از کش آخرین نرخ معتبر استفاده می‌شود.
- امکان تنظیم ارز پیش‌فرض نمایش برای کاربر وجود دارد.
- این فیچر به تنهایی تراکنش مالی ایجاد نمی‌کند؛ فقط توابع کمکی ارائه می‌دهد.
- برای کاربران ایرانی، پیش‌فرض IRR → USDT است.
- **USDT نباید dependency بنیادی سیستم باشد** — Graph routing تضمین می‌کند هر مسیر دیگری که نرخ موجود باشد، کار کند.
