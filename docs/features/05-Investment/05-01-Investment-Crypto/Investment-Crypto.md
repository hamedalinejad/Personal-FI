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
- `feeAmount` → decimal
- `feeCurrency` → string (ارز کارمزد: IRR, USDT, BTC و ...)
- `feeAssetPriceToBase` → decimal (فقط وقتی `feeCurrency` نه IRR و نه ارز پایه کاربر باشد؛ قیمت لحظه‌ای آن رمزارز به ارز پایه کاربر، از `getLatestPrice(feeCurrency, baseCurrency)` — مثلاً اگر `baseCurrency=USDT`، قیمت BTC = ۶۵,۰۰۰ USDT)
- `exchangeRateToBase` → decimal (نرخ تبدیل لحظه به ارز پایه کاربر — nullable؛ فقط وقتی `currency` یا `feeCurrency` برابر IRR باشد و ارز پایه IRR نباشد کاربرد دارد. در معامله رمزارز-به-رمزارز که نه ارز اصلی و نه کارمزد ریالی نیستند، `null` می‌ماند و تبدیل از طریق `getLatestPrice()` فیچر `19-Price-Fetching` انجام می‌شود)
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

## منطق کارمزد

- هر کارمزد با `feeAmount` + `feeCurrency` ذخیره می‌شود؛ اگر `feeCurrency` نه ارز پایه کاربر و نه IRR باشد (یعنی خود یک رمزارز دیگر، مثلاً BTC، ETH)، فیلد `feeAssetPriceToBase` نیز الزامی است.
- ارزش معادل کارمزد به ارز پایه کاربر (`baseCurrency`) به شرح زیر محاسبه می‌شود (همیشه با `decimal.js`، هرگز `Number`):
  - اگر `feeCurrency = baseCurrency`: بدون تبدیل (ضریب ۱)
  - اگر `feeCurrency = IRR` و `baseCurrency ≠ IRR`: `convertedToBase = feeAmount / exchangeRateToBase`
  - اگر `feeCurrency` رمزارز دیگری باشد (BTC/ETH و ...):
    ```
    convertedToBase = feeAmount * feeAssetPriceToBase
    ```
    (`feeAssetPriceToBase` قیمت لحظه‌ای آن رمزارز به ارز پایه کاربر است — از `getLatestPrice(feeCurrency, baseCurrency)` فیچر `19-Price-Fetching` گرفته می‌شود. تقسیم مستقیم `feeAmount` بر `exchangeRateToBase` در این حالت **غلط** است، چون `exchangeRateToBase` فقط نرخ IRR-به-ارز‌پایه است و ربطی به قیمت BTC/ETH ندارد.)
- مجموع کارمزدها در Holding به‌صورت تجمعی و همیشه به ارز پایه کاربر (`totalFeesPaidBase`) نگهداری می‌شود.
- در انتقال بین صرافی‌ها، اگر کارمزد از خود ارز کسر شود، تفاوت بین `amountToSend` و `amountReceived = amountToSend - feeAmount` دقیقاً مقدار کارمزد است.

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
- `createCryptoTransaction(data)` → خرید / فروش / انتقال؛ برای معامله رمزارز-به-رمزارز (قاعده ۲a) دو بار با `tradeId` مشترک فراخوانی می‌شود (یک `sell` + یک `buy`)، یا با یک متد کمکی اختصاصی `createCryptoToCryptoTrade(data)` که هر دو رکورد را در یک تراکنش دیتابیسی اتمیک ایجاد می‌کند
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