# زیر‌فیچر: Investment - Crypto (رمزارز)

## توضیح کلی
این زیر‌فیچر مسئولیت کامل مدیریت دارایی‌های رمزارزی را بر عهده دارد.  
شامل مدیریت صرافی‌ها و والت‌ها (شامل والت نرم‌افزاری)، خرید، فروش، انتقال، واریز و برداشت، محاسبه میانگین خرید، سود و زیان و ارزش پرتفوی است.

تمام جابه‌جایی‌های ریالی/تتری با حساب‌های بانکی از طریق جدول `acc_transactions` ثبت می‌شوند و به تراکنش‌های صرافی لینک می‌گردند.

---

## ارز پایه محاسبات — قانون بنیادین

کاربر می‌تواند رمزارز را با **هر ارزی** بخرد یا بفروشد: ریال، تتر، یا مستقیماً با یک رمزارز دیگر (مثلاً خرید BTC با پرداخت مستقیم ETH، بدون عبور از ریال یا تتر). چون `inv_crypto_holdings` باید یک `averageBuyPrice`/`totalInvested` **قابل‌جمع و قابل‌مقایسه** برای هر دارایی نگه دارد، صرف‌نظر از اینکه هر خرید با چه ارزی پرداخت شده، قانون زیر برای همه محاسبات الزامی است (کاملاً هم‌راستا با تغییر نام‌گذاری `totalFeesPaidBase` که پیش‌تر در همین فایل انجام شده):

> **همه‌چیز در `inv_crypto_holdings` (میانگین خرید، مجموع سرمایه‌گذاری، مجموع کارمزد) همیشه به ارز پایه کاربر (`cur_currency_preferences.baseCurrency`) است — هرگز به ارز پرداخت آن تراکنش خاص.**

برای این کار، هر تراکنش خرید/فروش (`inv_crypto_transactions`) علاوه بر مبلغ به ارز واقعی پرداخت‌شده (`price`, `totalAmount`, `currency`)، معادل آن را به ارز پایه هم در لحظه ثبت ذخیره می‌کند (`priceBase`, `totalAmountBase`) — دقیقاً مشابه الگوی `totalFeesPaidBase`. منبع این تبدیل:
- اگر `currency` = ارز پایه کاربر: بدون تبدیل (ضریب ۱)
- اگر `currency = IRR` و ارز پایه چیز دیگری باشد (مثلاً USDT): با `exchangeRateToBase`
- اگر `currency` رمزارز دیگری باشد (مثلاً ETH، یعنی معامله رمزارز-به-رمزارز): با `getLatestPrice(symbol, baseCurrency)` از فیچر `19-Price-Fetching`، یا در نبود قیمت کش‌شده، وارد‌شده دستی توسط کاربر در لحظه ثبت تراکنش

---

## Rate Provenance — زنجیره منشأ نرخ (Immutable Audit Trail)

> **مشکل**: `priceBase` و `totalAmountBase` در لحظه تراکنش ذخیره و قفل می‌شوند — اما اگر فقط مقدار نهایی ذخیره شود، در آینده نمی‌توان تأیید کرد این عدد از کجا آمده. `getLatestPrice()` می‌تواند تغییر کند؛ نباید بتوان تراکنش تاریخی را با قیمت جدید بازمحاسبه کرد.

**راه‌حل**: هر تراکنش علاوه بر مقدار محاسبه‌شده، به **رکورد دقیق قیمتی** که آن مقدار را ساخته لینک می‌دهد:

```
inv_crypto_transactions.priceHistoryId → price_history.id
```

چون `price_history` **Append-Only** است (رکوردهای قدیمی هرگز overwrite یا حذف نمی‌شوند)، این لینک برای همیشه معتبر می‌ماند و زنجیره کامل provenance را می‌سازد:

```
inv_crypto_transactions
  └─ priceHistoryId ──────────→ price_history
                                  ├─ price (قیمت خام)
                                  ├─ priceCurrency
                                  ├─ fetchedAt (لحظه دریافت)
                                  ├─ source ('manual' | 'api')
                                  ├─ triggeredBy ('user_click' | 'auto_sync' | 'manual_entry')
                                  └─ sourceId ────────────────→ price_sources
                                                                  ├─ name (مثلاً 'CoinGecko')
                                                                  ├─ url
                                                                  └─ apiEndpoint
```

**قوانین پر کردن `priceHistoryId`**:

| سناریو | `priceHistoryId` |
|---------|-----------------|
| خرید/فروش با قیمت از `getLatestPrice()` | `price_history.id` رکورد مصرف‌شده — **الزامی** |
| خرید/فروش با قیمت وارد‌شده دستی توسط کاربر | ابتدا `setManualPrice()` فراخوانی شود → رکورد در `price_history` ثبت شود → سپس `id` آن رکورد اینجا ذخیره شود — **الزامی** |
| معامله رمزارز-به-رمزارز (C2C) | همان — `priceHistoryId` برای هر دو طرف (fromSymbol و toSymbol) جداگانه ذخیره شود |
| واریز/برداشت ریالی (بدون قیمت رمزارز) | `null` — چون `priceBase` برای IRR/USDT محاسبه نمی‌شود |

> **نکته پیاده‌سازی**: هنگام ثبت تراکنش، `getLatestPrice()` یک `CachedPrice` برمی‌گرداند که شامل `priceHistoryId` (id رکورد `price_history`) است. این id باید مستقیماً در تراکنش ذخیره شود — نه اینکه بعداً دوباره query شود.

---

## User Stories

### Must Have
- ثبت صرافی یا والت (شامل والت نرم‌افزاری) همراه با آدرس سایت/اپ
- ثبت خرید رمزارز **با هر ارز پرداختی** (ریال، تتر، یا مستقیماً با یک رمزارز دیگر — معامله رمزارز-به-رمزارز)
- ثبت فروش رمزارز (مبلغ می‌تواند به موجودی ریال/تتر صرافی/ولت اضافه شود، یا مستقیماً صرف خرید رمزارز دیگری شود)
- واریز از حساب بانکی به صرافی/ولت
- برداشت از صرافی/ولت به حساب بانکی
- انتقال بین صرافی‌ها یا والت‌ها (با امکان کسر کارمزد از ارز)
- مشاهده موجودی هر رمزارز و میانگین خرید (همیشه به ارز پایه کاربر — به بخش «ارز پایه محاسبات» مراجعه شود)
- ثبت و پیگیری کارمزدهای پرداخت‌شده (با هر ارزی، تجمیع‌شده به ارز پایه)
- محاسبه سود و زیان (realized و unrealized) — دقیق، حتی وقتی خریدهای یک دارایی با ارزهای مختلف انجام شده باشند
- مشاهده ارزش کل پرتفوی رمزارز
- ذخیره نرخ تبدیل لحظه معامله

### Should Have
- تاریخچه قیمت
- پیوست رسید معامله

---

## Business Rules

1. هر معامله رمزارز باید به یک صرافی یا والت مرتبط باشد.
2. هنگام **خرید** (با هر ارز پرداختی — ریال، تتر، یا رمزارز دیگر):
   - موجودی رمزارز خریداری‌شده افزایش می‌یابد.
   - در صورت پرداخت از حساب بانکی → تراکنش در `acc_transactions` + `inv_crypto_exchange_transactions` ثبت می‌شود.
   - در صورت پرداخت با رمزارز دیگر (معامله رمزارز-به-رمزارز) → به قاعده ۲a مراجعه شود.
2a. **معامله رمزارز-به-رمزارز (Crypto-to-Crypto Trade)**: وقتی کاربر مستقیماً یک رمزارز را با رمزارز دیگری می‌خرد (مثلاً خرید BTC با پرداخت ETH، بدون عبور از ریال/تتر)، این یک معامله اتمیک ولی از نظر حسابداری دو رویداد است و **باید به‌صورت دو رکورد لینک‌شده در `inv_crypto_transactions` با یک `tradeId` مشترک** (UUID تازه، مشابه الگوی `transferId`) ثبت شود:
   - یک رکورد `type = 'sell'` روی Holding رمزارز پرداختی (مثلاً ETH) با `quantity` = مقدار پرداختی؛ این رکورد `realizedPL` واقعی روی ETH تولید می‌کند (طبق فرمول بخش Realized P&L).
   - یک رکورد `type = 'buy'` روی Holding رمزارز دریافتی (مثلاً BTC) با `quantity` = مقدار خریداری‌شده؛ مبنای هزینه (`totalAmountBase`) این خرید دقیقاً برابر `totalAmountBase` رکورد فروش بالا به‌علاوهٔ کارمزد (اگر جدا پرداخت شده) است.
   - هر دو رکورد یک `tradeId` مشترک دارند تا به‌عنوان یک معامله واحد قابل شناسایی، نمایش و Reversal باشند.
   - `price`/`totalAmount`/`currency` هر رکورد به ارز طرف مقابل معامله همان رکورد اشاره دارد (مثلاً در رکورد `sell` ETH، `currency = BTC`)، اما `priceBase`/`totalAmountBase` (طبق «ارز پایه محاسبات») در هر دو رکورد باید یکسان و منطبق باشند.
3. هنگام **فروش**:
   - موجودی رمزارز کاهش می‌یابد.
   - مبلغ حاصل می‌تواند به موجودی ریال/تتر همان صرافی یا والت اضافه شود، یا (طبق قاعده ۲a) مستقیماً صرف خرید رمزارز دیگری شود.
4. **واریز از حساب بانکی** به صرافی/ولت:
   - موجودی حساب بانکی کاهش و موجودی ریال/تتر صرافی افزایش می‌یابد.
   - تراکنش در `acc_transactions` با `relatedFeature = 'crypto_exchange'` و `relatedId = inv_crypto_exchange_transactions.id` ثبت می‌شود.
   - تراکنش در `inv_crypto_exchange_transactions` نیز ثبت و به تراکنش بانکی لینک می‌شود.
5. **برداشت به حساب بانکی**:
   - موجودی ریال/تتر صرافی کاهش و موجودی حساب بانکی افزایش می‌یابد.
   - هر دو تراکنش (`acc_transactions` و `inv_crypto_exchange_transactions`) ثبت و به هم لینک می‌شوند.
6. **انتقال بین صرافی‌ها/والت‌ها**:
   - حتماً دو تراکنش لینک‌شده ثبت می‌شود، با یک `transferId` مشترک (UUID تازه، ساخته‌شده در لحظه ثبت انتقال) که در هر دو رکورد ذخیره می‌شود:
     - یکی در صرافی مبدا با `type: transfer_out`، `counterExchangeId` به مقصد و `transferId` مشترک
     - یکی در صرافی مقصد با `type: transfer_in`، `counterExchangeId` به مبدا و همان `transferId`
   - `transferId` (نه صرفاً `counterExchangeId`) مرجع قطعی برای پیدا کردن رکورد جفت است؛ این لازم است چون ممکن است چند انتقال هم‌زمان بین همان دو صرافی در یک روز ثبت شود.
   - کارمزد می‌تواند از مقدار ارز ارسالی کسر شود:
     - مقدار ارسالی: `amountToSend`
     - کارمزد: `feeAmount` (از `amountToSend` کسر می‌شود)
     - موجودی افزایش شده در مقصد: `amountToSend - feeAmount`
   - موجودی کل رمزارز کاربر تغییر نمی‌کند (فقط جابه‌جایی بین پلتفرم‌ها).
7. میانگین خرید با هر خرید جدید به‌روزرسانی می‌شود.
8. کارمزدها با `feeAmount` + `feeCurrency` + `exchangeRateToBase` در لحظه ثبت می‌شوند.
9. موجودی حساب بانکی نمی‌تواند منفی شود.
9a. موجودی هیچ رمزارزی (`quantity` در `inv_crypto_holdings`) و موجودی داخلی IRR/USDT هر صرافی/ولت (همان جدول، `symbol=IRR` یا `symbol=USDT`) نمی‌تواند منفی شود.
10. نرخ تبدیل لحظه معامله ذخیره و قفل می‌شود.
11. **ویرایش/حذف معاملات**: تراکنش‌های رمزارز پس از ثبت غیرقابل ویرایش هستند. برای اصلاح یا حذف:
    - تراکنش اصل ذخیره می‌ماند (`isVoided = true` در `acc_transactions`)
    - تراکنش‌های معکوس (Reversal) ثبت می‌شوند تا موجودی‌ها درست شوند
    - این رویکرد تاریخچه معاملات و محاسبات Average Buy Price را حفظ می‌کند

---

## Domain Entities

### ۱. Crypto Exchange / Wallet (جدول: `inv_crypto_exchanges`)

- `id` → UUID (Primary Key)
- `name` → string
- `type` → string (`exchange`, `software_wallet`, `hardware_wallet`)
- `url` → string (آدرس سایت یا اپلیکیشن — nullable)
- `description` → string
- `isActive` → boolean
- `createdAt` → datetime
- `updatedAt` → datetime

### ۲. Crypto Holding (جدول: `inv_crypto_holdings`)

- `id` → UUID (Primary Key)
- `exchangeId` → UUID
- `symbol` → string (BTC, ETH, USDT, IRR و ...)
- `name` → string
- `quantity` → decimal (موجودی فعلی)
- `averageBuyPrice` → decimal (همیشه به **ارز پایه کاربر**، طبق «ارز پایه محاسبات» — صرف‌نظر از اینکه خریدهای این دارایی با چه ارزهایی پرداخت شده‌اند)
- `currency` → string (ثابت = `baseCurrency` کاربر برای همه ردیف‌ها؛ نگهداری می‌شود صرفاً برای وضوح در UI/گزارش‌ها)
- `totalInvested` → decimal (همیشه به **ارز پایه کاربر**)
- `totalFeesPaidBase` → decimal (مجموع تجمیعی تمام کارمزدهای پرداخت‌شده، پس از تبدیل هر کارمزد به **ارز پایه کاربر** (`cur_currency_preferences.baseCurrency`) در لحظه ثبت هر تراکنش — صرف‌نظر از اینکه کارمزد هر تراکنش به IRR، USDT یا خود رمزارز پرداخت شده)

> **نکته نام‌گذاری**: نام این فیلد از `totalFeesPaidUSDT` به `totalFeesPaidBase` تغییر کرد چون `baseCurrency` کاربر ممکن است USDT نباشد. فرمول تبدیل کارمزد به ارز پایه در بخش «منطق کارمزد» تعریف شده است.
- `createdAt` → datetime
- `updatedAt` → datetime

> **نکته مهم**: موجودی نقدی ریال/تتر هر صرافی/ولت از طریق جدول `inv_crypto_holdings` با `symbol=IRR` یا `symbol=USDT` مدیریت می‌شود. این یک تصمیم طراحی عمدی است که به جای ایجاد یک جدول جداگانه، از ساختار موجود استفاده می‌کند.  
> **نکته مهم ۲ - جلوگیری از تکرار در محاسبه ثروت**:  
> - برای IRR و USDT:  
>   - `averageBuyPrice = 1` (ثابت، چون نرخ تبدیل با خودشان ثابت است)  
>   - `totalInvested = 0` (مبلغ واریزی در این فیلد ثبت نمی‌شود)  
>   - `totalFeesPaidBase = 0` (کارمزدها در `inv_crypto_exchange_transactions` ذخیره می‌شوند)  
> - در تابع `getPortfolioValue()`، موجودی IRR و USDT **به صورت اختیاری** در محاسبه ارزش پرتفوی لحاظ می‌شود (با کنترل `includeCashInWealth` در تنظیمات پرتفوی)  
> - **مهم**: صرافی/ولت هرگز رکورد مستقل در `acc_accounts` ندارد. تنها زمانی که واریز/برداشت واقعی بین یک حساب بانکی و صرافی رخ می‌دهد، یک تراکنش در `acc_transactions` (با `relatedFeature = 'crypto_exchange'`) برای همان حساب بانکی موجود ثبت می‌شود؛ این ثبت هیچ ارتباطی با موجودی داخلی IRR/USDT صرافی در `inv_crypto_holdings` ندارد و نباید با آن یکی در نظر گرفته شود. ایجاد یک رکورد موازی در `acc_accounts` برای هر صرافی باعث شمارش دوگانه در محاسبه ثروت خالص می‌شود.

### ۳. Crypto Transaction (جدول: `inv_crypto_transactions`) — لاگ معاملات رمزارز

- `id` → UUID (Primary Key)
- `exchangeId` → UUID
- `symbol` → string
- `type` → string (`buy`, `sell`, `transfer_in`, `transfer_out`)
- `quantity` → decimal
- `price` → decimal (به ارز `currency` این رکورد — یعنی ارز طرف مقابل معامله؛ می‌تواند IRR، USDT یا یک رمزارز دیگر باشد)
- `totalAmount` → decimal (به ارز `currency`)
- `priceBase` → decimal (معادل `price` به ارز پایه کاربر (`baseCurrency`)، طبق «ارز پایه محاسبات» — الزامی برای `buy`/`sell`)
- `totalAmountBase` → decimal (معادل `totalAmount` به ارز پایه — این فیلد و نه `totalAmount` است که در فرمول‌های Weighted Average/Realized P&L و به‌روزرسانی `inv_crypto_holdings` استفاده می‌شود)
- `priceHistoryId` → UUID (nullable — لینک به `price_history.id`؛ رکورد دقیقی از `price_history` که `priceBase` از آن محاسبه شده. برای معاملات رمزارز-به-رمزارز که قیمت از `getLatestPrice()` می‌آید الزامی است؛ برای معاملات ریالی/USDT که قیمت را کاربر مستقیم وارد می‌کند `null` است)
- `feeAssetPriceHistoryId` → UUID (nullable — لینک به `price_history.id` برای قیمتی که `feeAssetPriceToBase` از آن گرفته شده؛ فقط وقتی `feeCurrency` یک رمزارز است الزامی است)
- `feeAmount` → decimal
- `feeCurrency` → string (ارز کارمزد: IRR, USDT, BTC و ...)
- `feeAssetPriceToBase` → decimal (فقط وقتی `feeCurrency` نه IRR و نه ارز پایه کاربر باشد؛ قیمت لحظه‌ای آن رمزارز به ارز پایه کاربر، از `getLatestPrice(feeCurrency, baseCurrency)` — مثلاً اگر `baseCurrency=USDT`، قیمت BTC = ۶۵,۰۰۰ USDT)
- `exchangeRateToBase` → decimal (نرخ تبدیل لحظه به ارز پایه کاربر — nullable؛ فقط وقتی `currency` یا `feeCurrency` برابر IRR باشد و ارز پایه IRR نباشد کاربرد دارد. در معامله رمزارز-به-رمزارز که نه ارز اصلی و نه کارمزد ریالی نیستند، `null` می‌ماند و تبدیل از طریق `getLatestPrice()` فیچر `19-Price-Fetching` انجام می‌شود)
- `exchangeRateHistoryId` → UUID (nullable — لینک به `cur_exchange_rates.id` (یا رکورد تاریخچه نرخ ارز) که `exchangeRateToBase` از آن گرفته شده؛ برای audit مالی نرخ‌های ریالی)
- `currency` → string (ارز طرف مقابل معامله: IRR، USDT، یا سیمبل یک رمزارز دیگر برای معاملات رمزارز-به-رمزارز)
- `tradeId` → UUID (نال مگر برای معامله رمزارز-به-رمزارز طبق قاعده ۲a — UUID مشترک بین رکورد `sell` رمزارز پرداختی و رکورد `buy` رمزارز دریافتی همان معامله)
- `counterExchangeId` → UUID (صرافی/ولت مقابل — برای انتقال — nullable)
- `transferId` → UUID (نال مگر برای `type: transfer_in`/`transfer_out` — بین دو رکورد `transfer_out` و `transfer_in` متناظر یک انتقال، مقدار یکسان و مشترک دارد؛ برای تشخیص قطعی جفت رکورد و Reversal صحیح وقتی چند انتقال هم‌زمان بین همان دو صرافی رخ می‌دهد)
- `description` → string
- `date` → datetime
- `createdAt` → datetime

### ۴. Crypto Exchange Transaction (جدول: `inv_crypto_exchange_transactions`) — لاگ واریز و برداشت ریالی/تتری

- `id` → UUID (Primary Key)
- `exchangeId` → UUID
- `type` → string (`deposit`, `withdraw`)
- `amount` → decimal
- `currency` → string (IRR, USDT و ...)
- `feeAmount` → decimal
- `feeCurrency` → string
- `feeAssetPriceToBase` → decimal (فقط وقتی `feeCurrency` نه IRR و نه ارز پایه کاربر باشد؛ قیمت لحظه‌ای آن رمزارز به ارز پایه کاربر)
- `exchangeRateToBase` → decimal (نرخ IRR به ازای ۱ واحد ارز پایه کاربر، در لحظه ثبت — nullable؛ فقط وقتی `currency` یا `feeCurrency` برابر IRR باشد و ارز پایه IRR نباشد کاربرد دارد)
- `accountId` → UUID (حساب بانکی مرتبط)
- `accountTransactionId` → UUID (لینک به `acc_transactions`)
- `description` → string
- `date` → datetime
- `createdAt` → datetime

> **نکته لینک**: هنگام ایجاد این تراکنش، یک تراکنش در `acc_transactions` نیز ایجاد می‌شود با:  
> - `relatedFeature = 'crypto_exchange'`  
> - `relatedId = inv_crypto_exchange_transactions.id`
> 
> **نکته مهم**: برای لینک معکوس، در جدول `acc_transactions` فیلدهای `relatedFeature` و `relatedId` تعریف شده‌اند که به `inv_crypto_exchange_transactions.id` اشاره می‌کند. این یکی از دلایل ایجاد دو تراکنش (یکی در حساب بانکی، یکی در صرافی) است.

### ۵. acc_transactions

- فقط زمانی که پول واقعاً از/به حساب بانکی جابه‌جا شود ثبت می‌شود و با `inv_crypto_exchange_transactions` لینک می‌گردد.
- لینک از طریق `relatedFeature = 'crypto_exchange'` و `relatedId = inv_crypto_exchange_transactions.id` انجام می‌شود.

---

## منطق کارمزد — قانون واحد برای همه عملیات

### بخش ۱ — تبدیل کارمزد به ارز پایه (`feeBase`)

این تابع در **همه** عملیات (خرید، فروش، انتقال، C2C) یکسان است:

```typescript
function convertFeeToBase(feeAmount, feeCurrency, feeAssetPriceToBase, exchangeRateToBase, baseCurrency): Decimal {
  if (feeAmount.isZero()) return new Decimal(0);
  if (feeCurrency === baseCurrency)  return feeAmount;                          // بدون تبدیل
  if (feeCurrency === 'IRR')         return feeAmount.dividedBy(exchangeRateToBase); // IRR → base
  /* feeCurrency = رمزارز دیگر (BTC, ETH, ...) — feeAssetPriceToBase الزامی */
  return feeAmount.times(feeAssetPriceToBase);                                  // crypto → base
}
```

> ❌ هرگز `feeAmount / exchangeRateToBase` برای `feeCurrency=BTC/ETH` استفاده نکنید —
> `exchangeRateToBase` فقط نرخ IRR است، نه قیمت BTC/ETH.

---

### بخش ۲ — قانون واحد Fee Treatment روی `quantity` و `Cost Basis`

> **اصل بنیادی**: کارمزد **هرگز** از `quantity` کسر نمی‌شود — حتی وقتی `feeCurrency = symbol` دارایی است.
> کارمزد فقط روی **Cost Basis** (`totalInvested`) و **Realized P&L** تأثیر می‌گذارد.

#### ۲-الف) خرید (BUY)

```
مثال: خرید ۱ BTC — fee = 0.001 BTC (feeCurrency = BTC)

quantity ثبت‌شده در inv_crypto_transactions.quantity  = 1        ✅ (کل مقدار خریداری‌شده)
quantity اضافه‌شده به inv_crypto_holdings.quantity    = 1        ✅

feeBase = 0.001 × feeAssetPriceToBase  (قیمت BTC به baseCurrency)

Cost Basis آپدیت:
  newTotalInvested  = totalInvested + totalAmountBase + feeBase
  newQuantity       = quantity + 1
  newAverageBuyPrice = newTotalInvested / newQuantity
```

> **چرا `quantity = 1` نه `0.999`؟**
> چون کارمزد بخشی از **هزینه تملک** آن ۱ BTC است، نه کسری از تعداد.
> یعنی ما ۱ BTC داریم، اما هزینه‌ای که برای آن پرداختیم شامل کارمزد هم می‌شود.
> این رویکرد Cost Basis را درست نگه می‌دارد و از undercosting جلوگیری می‌کند.

#### ۲-ب) فروش (SELL)

```
مثال: فروش ۱ BTC — fee = 0.001 BTC (feeCurrency = BTC)

quantity ثبت‌شده در inv_crypto_transactions.quantity  = 1        ✅ (کل مقدار فروخته‌شده)
quantity کسرشده از inv_crypto_holdings.quantity       = 1        ✅

feeBase = 0.001 × feeAssetPriceToBase

soldPortionCost = 1 × averageBuyPrice
realizedPL      = totalAmountBase(مبلغ دریافتی خالص) - soldPortionCost - feeBase
totalInvested  -= soldPortionCost
```

> **توجه**: `totalAmountBase` در رکورد تراکنش فروش = مبلغ **قبل** از کسر کارمزد است (gross amount).
> کارمزد جداگانه در `feeBase` از P&L کسر می‌شود.

#### ۲-ج) انتقال (TRANSFER)

```
مثال: انتقال ۱ BTC — fee = 0.001 BTC (feeCurrency = BTC, کسر از ارز ارسالی)

در صرافی مبدا (transfer_out):
  quantity کسر می‌شود: holdings.quantity -= 1          (کل مقدار ارسالی)
  totalInvested کاهش: -= 1 × averageBuyPrice_source
  feeBase = 0.001 × feeAssetPriceToBase
  totalFeesPaidBase += feeBase

در صرافی مقصد (transfer_in):
  quantity اضافه می‌شود: holdings.quantity += 0.999    (= amountToSend - feeAmount)
  ⚠️ اینجا quantity کمتر است چون BTC واقعاً کمتر رسیده
  Weighted Average مقصد با quantity=0.999 و cost=0.999×averageBuyPrice_source محاسبه شود
```

> **چرا در انتقال `quantity` کمتر می‌شود؟**
> چون در transfer، کارمزد از **ارز ارسالی خودِ BTC** برداشته می‌شود —
> مقصد واقعاً ۰.۹۹۹ BTC دریافت کرده، نه ۱ BTC.
> این تفاوت اساسی با خرید/فروش است که کارمزد از موجودی دارایی کسر **نمی‌شود**.

#### ۲-د) معامله رمزارز-به-رمزارز (C2C)

```
مثال: فروش ۱ ETH — خرید BTC — fee = 0.0001 BTC (feeCurrency = BTC)

رکورد SELL (ETH):
  quantity = 1 ETH  ✅
  feeBase = 0.0001 × BTC_price_in_base
  realizedPL_ETH = fromTotalBase - soldPortionCost_ETH - feeBase

رکورد BUY (BTC):
  quantity = مقدار BTC دریافتی  ✅
  toTotalBase = fromTotalBase + feeBase  (Cost Basis BTC شامل کارمزد)
  holdings.quantity += مقدار BTC دریافتی  ✅ (کامل، نه کسر کارمزد)
```

---

### بخش ۳ — جدول خلاصه

| عملیات | `feeCurrency = baseCurrency/IRR` | `feeCurrency = symbol دارایی` |
|---------|----------------------------------|-------------------------------|
| **BUY** | `quantity` بدون تغییر ✅ — `feeBase` به `totalInvested` اضافه | `quantity` بدون تغییر ✅ — `feeBase` به `totalInvested` اضافه |
| **SELL** | `quantity` بدون تغییر ✅ — `feeBase` از `realizedPL` کسر | `quantity` بدون تغییر ✅ — `feeBase` از `realizedPL` کسر |
| **TRANSFER** | `quantity` بدون تغییر در مبدا ✅ — `quantity` کامل در مقصد ✅ — `feeBase` به `totalFeesPaidBase` | `quantity` کامل در مبدا ✅ — `quantity` کاهش‌یافته در مقصد ⚠️ (چون ارز کمتری رسیده) |
| **C2C** | `quantity` هر دو طرف بدون تغییر ✅ — `feeBase` در SELL از P&L کسر و در BUY به Cost Basis اضافه | همان قانون ✅ |

> **قانون طلایی**: `feeCurrency = symbol` تنها در **TRANSFER** روی `quantity` مقصد تأثیر می‌گذارد —
> در هر عملیات دیگری (BUY/SELL/C2C) فقط روی `Cost Basis` یا `realizedPL` اثر دارد.

---

### بخش ۴ — آپدیت `totalFeesPaidBase`

در **همه** عملیات، پس از محاسبه `feeBase`:
```
holding.totalFeesPaidBase += feeBase
```
این فیلد تجمعی است و هرگز کاهش نمی‌یابد (حتی در فروش).

---

## APIهای داخلی

### Exchange APIs
- `createExchange(data)`
- `updateExchange(id, data)`
- `getAllExchanges()`
- `getExchangeById(id)`

### Holding APIs
- `getHoldings(exchangeId?)`
- `getHoldingBySymbol(symbol, exchangeId?)`
- `getPortfolioValue(targetCurrency?)`

### Transaction APIs
- `createCryptoTransaction(data)` → خرید / فروش / انتقال (تک‌رکورد)
- `createCryptoToCryptoTrade(data)` → **معامله رمزارز-به-رمزارز — الزاماً Atomic**

  این متد تنها نقطه ورود معتبر برای معامله رمزارز-به-رمزارز (قاعده ۲a) است.
  هر implementation باید **تمام ۸ مرحله زیر را در یک تراکنش دیتابیسی واحد (SQLite BEGIN/COMMIT) اجرا کند**.
  اگر هر مرحله‌ای شکست بخورد، کل تراکنش ROLLBACK می‌شود.

  **ورودی `data`**:
  ```typescript
  {
    tradeId: UUID,                  // از پیش ساخته‌شده توسط caller
    date: Timestamp,
    exchangeId: UUID,

    // رمزارز پرداختی (مثلاً ETH که می‌فروشیم)
    fromSymbol: string,             // ETH
    fromQuantity: Decimal,          // مقدار ETH که پرداخت می‌شود
    fromPriceBase: Decimal,         // قیمت ۱ واحد ETH به baseCurrency در لحظه معامله
    fromPriceHistoryId: UUID,       // id رکورد price_history که fromPriceBase از آن آمده

    // رمزارز دریافتی (مثلاً BTC که می‌خریم)
    toSymbol: string,               // BTC
    toQuantity: Decimal,            // مقدار BTC که دریافت می‌شود
    toPriceBase: Decimal,           // قیمت ۱ واحد BTC به baseCurrency در لحظه معامله
    toPriceHistoryId: UUID,         // id رکورد price_history که toPriceBase از آن آمده

    // کارمزد
    feeAmount: Decimal,
    feeCurrency: string,
    feeAssetPriceToBase: Decimal,   // nullable — فقط اگر feeCurrency رمزارز دیگری باشد

    description: string,
  }
  ```

  **قرارداد Atomic — ۸ مرحله اجباری (داخل یک SQLite transaction)**:

  ```
  BEGIN TRANSACTION;

  ── مرحله ۱: محاسبه مقادیر ──────────────────────────────────────────
  feeBase          = convertFeeToBase(feeAmount, feeCurrency, feeAssetPriceToBase)
  fromTotalBase    = fromQuantity × fromPriceBase
  toTotalBase      = fromTotalBase + feeBase   // Cost Basis رمزارز دریافتی

  ── مرحله ۲: بررسی موجودی کافی (Guard) ──────────────────────────────
  fromHolding = SELECT * FROM inv_crypto_holdings WHERE exchangeId=? AND symbol=fromSymbol FOR UPDATE
  IF fromHolding.quantity < fromQuantity → ROLLBACK + خطا «موجودی کافی نیست»

  ── مرحله ۳: محاسبه Realized P&L برای رمزارز پرداختی ────────────────
  soldPortionCost  = fromQuantity × fromHolding.averageBuyPrice
  realizedPL_from  = fromTotalBase - soldPortionCost - feeBase

  ── مرحله ۴: ثبت رکورد SELL در inv_crypto_transactions ──────────────
  INSERT inv_crypto_transactions (
    type='sell', symbol=fromSymbol, quantity=fromQuantity,
    price=toQuantity/fromQuantity,   // نرخ مستقیم به واحد toSymbol
    currency=toSymbol,
    priceBase=fromPriceBase, totalAmountBase=fromTotalBase,
    feeAmount, feeCurrency, feeAssetPriceToBase,
    tradeId, exchangeId, date
  )

  ── مرحله ۵: آپدیت Holding رمزارز پرداختی ──────────────────────────
  UPDATE inv_crypto_holdings SET
    quantity        = fromHolding.quantity - fromQuantity,
    totalInvested   = fromHolding.totalInvested - soldPortionCost,
    totalFeesPaidBase = fromHolding.totalFeesPaidBase + feeBase
    -- averageBuyPrice بدون تغییر (فروش averageBuyPrice را تغییر نمی‌دهد)
  WHERE id = fromHolding.id

  ── مرحله ۶: ثبت رکورد BUY در inv_crypto_transactions ───────────────
  INSERT inv_crypto_transactions (
    type='buy', symbol=toSymbol, quantity=toQuantity,
    price=fromQuantity/toQuantity,   // نرخ معکوس
    currency=fromSymbol,
    priceBase=toPriceBase, totalAmountBase=toTotalBase,
    feeAmount=0, feeCurrency=null,   // کارمزد کامل در رکورد SELL لحاظ شده
    tradeId, exchangeId, date
  )

  ── مرحله ۷: آپدیت Holding رمزارز دریافتی (Weighted Average) ────────
  toHolding = SELECT * FROM inv_crypto_holdings WHERE exchangeId=? AND symbol=toSymbol
  IF toHolding EXISTS:
    newQuantity      = toHolding.quantity + toQuantity
    newTotalInvested = toHolding.totalInvested + toTotalBase
    newAvgBuyPrice   = newTotalInvested / newQuantity
    UPDATE inv_crypto_holdings SET
      quantity=newQuantity, totalInvested=newTotalInvested, averageBuyPrice=newAvgBuyPrice
    WHERE id = toHolding.id
  ELSE:
    INSERT inv_crypto_holdings (
      exchangeId, symbol=toSymbol, quantity=toQuantity,
      averageBuyPrice=toPriceBase, totalInvested=toTotalBase, totalFeesPaidBase=0
    )

  ── مرحله ۸: ذخیره Realized P&L (اختیاری اما توصیه‌شده) ────────────
  -- realizedPL_from را در inv_crypto_transactions رکورد SELL ذخیره کن
  -- (یا در یک جدول جداگانه اگر نیاز به گزارش تاریخی دارید)

  COMMIT;
  ```

  > **نکته پیاده‌سازی SQLite**: SQLite به‌صورت پیش‌فرض autocommit است. برای اجرای atomic، حتماً از `db.run('BEGIN')` / `db.run('COMMIT')` / `db.run('ROLLBACK')` استفاده کنید — یا از wrapper library‌ای که transaction را expose می‌کند (مثل `better-sqlite3` که synchronous است و transaction را نیتیو پشتیبانی می‌کند).

  > **قانون طلایی**: هیچ‌کدام از ۸ مرحله بالا نباید خارج از این transaction اجرا شود. حتی اگر فقط مرحله ۷ (آپدیت Holding مقصد) fail شود، باید همه چیز rollback شود — وگرنه ETH از Holding کسر شده اما BTC به Holding اضافه نشده: دارایی کاربر از بین رفته.
  - برای `type=transfer_out`/`transfer_in` (انتقال بین صرافی‌های خودی):
    1. `quantity` را از Holding مبدا کم کن، `totalInvested` متناسب کاهش می‌یابد، `averageBuyPrice` بدون تغییر
    2. Holding مقصد را با **Weighted Average** آپدیت کن:
       ```
       transferredCost    = quantityTransferred × averageBuyPrice_source
       newTotalInvested   = dest.totalInvested + transferredCost
       newQuantity        = dest.quantity + quantityTransferred
       newAverageBuyPrice = newTotalInvested / newQuantity
       ```
    3. `transferId` یکسان در هر دو رکورد `transfer_out` و `transfer_in` ذخیره شود
    4. کارمزد انتقال (از خود ارز کسر می‌شود) از `amountToSend` برداشته می‌شود — `dest.quantity += amountToSend - feeAmount`
- `createExchangeTransaction(data)` → واریز/برداشت بین حساب بانکی و صرافی — **توالی اجباری (atomic)**:

  **برداشت از صرافی به حساب بانکی** (`type='withdraw'`):
  > 1. رکورد در `inv_crypto_exchange_transactions` با `type='withdraw'` ثبت شود
  > 2. رکورد در `acc_transactions` با `type='withdrawal-investment'` و `relatedFeature='crypto_exchange'` ثبت شود
  > 3. **`inv_crypto_holdings` برای `(exchangeId, symbol=ارز برداشتی)` آپدیت شود**: `quantity -= amount` (و اگر `quantity <= 0` رکورد holding غیرفعال یا حذف شود)
  > 4. اگر ارز برداشتی `IRR` یا `USDT` است (موجودی نقدی صرافی): همان holding با `symbol=IRR/USDT` آپدیت می‌شود — نه یک holding رمزارز جدید
  >
  > ⛔ **ممنوع**: ثبت withdraw بدون آپدیت `inv_crypto_holdings` — موجودی نقدی صرافی اشتباه می‌شود

  **واریز از حساب بانکی به صرافی** (`type='deposit'`):
  > 1. رکورد در `inv_crypto_exchange_transactions` با `type='deposit'` ثبت شود
  > 2. رکورد در `acc_transactions` با `type='deposit-investment'` و `relatedFeature='crypto_exchange'` ثبت شود
  > 3. **`inv_crypto_holdings` برای `(exchangeId, symbol=ارز واریزی)` آپدیت شود**: `quantity += amount` (اگر رکورد وجود نداشت، ایجاد شود)
  > 4. برای واریز IRR/USDT: `averageBuyPrice=1`، `totalInvested=0`، `totalFeesPaidBase=0` ثابت می‌مانند (طبق تصمیم طراحی موجودی نقدی)
- `getCryptoTransactions(filters)` → شامل `type` برای تشخیص
- `getExchangeTransactions(filters)` → برای واریز/برداشت
- `calculateProfitLoss(symbol?, exchangeId?)`

---

## روابط با سایر فیچرها

- **Accounts & Banking**: واریز و برداشت + لینک تراکنش‌ها
- **Currency & Multi-Currency**: نرخ تبدیل لحظه‌ای
- **Reports** و **Dashboard**: ارزش پرتفوی و سود/زیان
- **Portfolio & Wealth Overview**: تأمین داده رمزارز
- **Price Fetching (فیچر ۱۹)**: دریافت قیمت لحظه‌ای رمزارزها — جداول `price_history` و `price_sources` (پوشه `05-05-Crypto-Price-Data` منسوخ شده و فقط برای رفرنس تاریخی نگه داشته شده است)

---

---

## منطق محاسبه سود/زیان تحقق‌یافته (Realized P&L)

فرمول رسمی و تنها فرمول معتبر برای `calculateProfitLoss()` و به‌روزرسانی Holding هنگام خرید/فروش:

**هنگام خرید** (Weighted Average — همه مبالغ به ارز پایه کاربر، طبق «ارز پایه محاسبات»):
```
newTotalInvested = totalInvested + totalAmountBase(بدون احتساب کارمزد) + feeAmount(به ارز پایه)
newQuantity      = quantity + quantityBought
newAverageBuyPrice = newTotalInvested / newQuantity   // نتیجه همیشه به ارز پایه
```

**هنگام فروش** (`averageBuyPrice` استفاده‌شده = میانگین خرید **قبل از این فروش**، یعنی همان مقدار فعلی Holding پیش از هر تغییر؛ همه مبالغ به ارز پایه):
```
soldPortionCost = quantitySold × averageBuyPrice        // به ارز پایه
realizedPL       = totalAmountBase(بدون احتساب کارمزد) - soldPortionCost - feeAmount(به ارز پایه)
totalInvested    -= soldPortionCost      // کاهش متناسب با بخش فروخته‌شده
quantity         -= quantitySold
averageBuyPrice  بدون تغییر می‌ماند       // Weighted Average فقط با خرید جدید تغییر می‌کند، نه با فروش
```

> **نکات الزامی**:
> - تمام محاسبات بالا باید با `decimal.js` انجام شوند (هرگز `Number`)، مطابق «قانون Minor Unit Storage» در `db.md`.
> - ورودی این فرمول‌ها همیشه `totalAmountBase`/`priceBase` است، نه `totalAmount`/`price` خام تراکنش (که به ارز واقعی پرداخت‌شده است) — طبق «ارز پایه محاسبات».
> - `feeAmount` باید طبق فرمول بخش «منطق کارمزد» (بالاتر در همین فایل) ابتدا به ارز پایه تبدیل و سپس در `realizedPL`/`totalInvested` لحاظ شود.
> - **معامله رمزارز-به-رمزارز (قاعده ۲a)**: دو رکورد `sell`/`buy` با `tradeId` مشترک، هرکدام طبق فرمول بالای خودشان (فروش/خرید) روی Holding خودشان اعمال می‌شوند؛ `realizedPL` رکورد `sell` مثل هر فروش دیگری محاسبه و ثبت می‌شود (سود/زیان واقعی روی دارایی پرداختی) و `totalAmountBase` همان رکورد، مبنای هزینه (`totalInvested`) رکورد `buy` طرف مقابل را می‌سازد.
> - `calculateProfitLoss(symbol?, exchangeId?)` مجموع `realizedPL` تمام تراکنش‌های فروش (از لاگ `inv_crypto_transactions` با `type=sell`) را برمی‌گرداند؛ سود/زیان **تحقق‌نیافته** (Unrealized) جداگانه و بر اساس `(getLatestPrice(symbol, baseCurrency) - averageBuyPrice) × quantity` محاسبه می‌شود و نباید با Realized P&L مخلوط شود.
> - در `transfer_out`/`transfer_in` بین صرافی‌های خودی، هیچ `realizedPL`ای ایجاد نمی‌شود (فروش واقعی نیست)؛ فقط `quantity` بین دو Holding جابه‌جا می‌شود و `averageBuyPrice` مقصد باید Weighted Average بین موجودی قبلی مقصد (اگر بود) و مقدار انتقالی با همان `averageBuyPrice` مبدأ باشد.

---

## نکات طراحی

- میانگین خرید با فرمول Weighted Average به‌روزرسانی می‌شود.
- `inv_crypto_transactions` و `inv_crypto_exchange_transactions` فقط لاگ هستند.
- موجودی و میانگین خرید و مجموع کارمزدها در جدول `inv_crypto_holdings` نگهداری می‌شود.
- قیمت لحظه‌ای رمزارزها از فیچر `19-Price-Fetching` (جدول `price_history`) خوانده می‌شود؛ این فیچر مستقیماً به API بیرونی وصل نمی‌شود — برای Unrealized P&L و ارزش پرتفوی فقط `getLatestPrice(symbol)` را صدا می‌زند.

> **نکته مهم**: موجودی نقدی ریال/تتر هر صرافی/ولت از طریق جدول `inv_crypto_holdings` با `symbol=IRR` یا `symbol=USDT` مدیریت می‌شود. این یک تصمیم طراحی عمدی است که به جای ایجاد یک جدول جداگانه، از ساختار موجود استفاده می‌کند. `averageBuyPrice` برای این دو ارز همیشه `1` در نظر گرفته می‌شود چون نرخ تبدیل آن‌ها با خودشان ثابت است.