# زیر‌فیچر: Investment - Crypto (رمزارز)

## توضیح کلی
این زیر‌فیچر مسئولیت کامل مدیریت دارایی‌های رمزارزی را بر عهده دارد.  
شامل مدیریت صرافی‌ها و والت‌ها (شامل والت نرم‌افزاری)، خرید، فروش، انتقال، واریز و برداشت، محاسبه میانگین خرید، سود و زیان و ارزش پرتفوی است.

تمام جابه‌جایی‌های ریالی/تتری با حساب‌های بانکی از طریق جدول `acc_transactions` ثبت می‌شوند و به تراکنش‌های صرافی لینک می‌گردند.

---

## User Stories

### Must Have
- ثبت صرافی یا والت (شامل والت نرم‌افزاری) همراه با آدرس سایت/اپ
- ثبت خرید رمزارز (ریالی یا تتری)
- ثبت فروش رمزارز (مبلغ می‌تواند به کیف پول صرافی/ولت اضافه شود)
- واریز از حساب بانکی به صرافی/ولت
- برداشت از صرافی/ولت به حساب بانکی
- انتقال بین صرافی‌ها یا والت‌ها (با امکان کسر کارمزد از ارز)
- مشاهده موجودی هر رمزارز و میانگین خرید
- ثبت و پیگیری کارمزدهای پرداخت‌شده (به ریال و تتر)
- محاسبه سود و زیان (realized و unrealized)
- مشاهده ارزش کل پرتفوی رمزارز
- ذخیره نرخ تبدیل لحظه معامله

### Should Have
- تاریخچه قیمت
- پیوست رسید معامله

---

## Business Rules

1. هر معامله رمزارز باید به یک صرافی یا والت مرتبط باشد.
2. هنگام **خرید**:
   - موجودی رمزارز افزایش می‌یابد.
   - در صورت پرداخت از حساب بانکی → تراکنش در `acc_transactions` + `inv_crypto_exchange_transactions` ثبت می‌شود.
3. هنگام **فروش**:
   - موجودی رمزارز کاهش می‌یابد.
   - مبلغ حاصل می‌تواند به موجودی ریال/تتر همان صرافی یا والت اضافه شود (نه الزاماً حساب بانکی).
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

### ۲. Crypto Wallet Network (جدول: `inv_crypto_wallet_networks`)

> این جدول فقط برای wallet های نرم‌افزاری و سخت‌افزاری (`type = 'software_wallet' | 'hardware_wallet'`) کاربرد دارد؛ برای صرافی‌ها (`type = 'exchange'`) نیازی به این جدول نیست چون صرافی یک آدرس واحد مدیریت می‌کند.

- `id` → UUID (Primary Key)
- `exchangeId` → UUID (کلید خارجی به `inv_crypto_exchanges.id`)
- `network` → string (نام شبکه بلاکچین — مثلاً `TRC20`, `ERC20`, `BEP20`, `SOL`, `BTC`, `TON`)
- `custodyAccount` → string (nullable — نام یا برچسب توضیحی برای این آدرس، مثلاً «کیف پول اصلی» یا «آدرس سرد»)
- `address` → string (nullable — آدرس عمومی کیف پول برای این شبکه)
- `isActive` → boolean
- `createdAt` → datetime
- `updatedAt` → datetime

> **چرا این جدول لازم است؟**  
> یک رمزارز واحد (مثلاً USDT) می‌تواند روی شبکه‌های مختلف وجود داشته باشد: `USDT TRC20`، `USDT ERC20`، `USDT BEP20` — این‌ها از نظر آدرس والت و مسیر انتقال کاملاً متفاوت‌اند. اگر کاربر USDT را از شبکه اشتباه بفرستد، دارایی از دست می‌رود. بنابراین:
> - هر والت می‌تواند چند شبکه داشته باشد (یک ردیف در `inv_crypto_wallet_networks` به ازای هر شبکه).
> - هر Holding رمزارز در والت می‌تواند اختیاراً با یک شبکه مشخص لینک شود (فیلد `networkId` در `inv_crypto_holdings` — nullable).
> - انتقال بین والت‌ها/صرافی‌ها باید شبکه را مشخص کند تا تاریخچه کامل باشد.

> **نکته**: برای صرافی‌ها (`type = 'exchange'`)، شبکه در لحظه واریز/برداشت در فیلد `network` جدول `inv_crypto_exchange_transactions` ثبت می‌شود (ببینید بخش «۵. Crypto Exchange Transaction» — فیلد جدید اضافه‌شده) — نیازی به ردیف در `inv_crypto_wallet_networks` ندارد.

### ۳. Crypto Holding (جدول: `inv_crypto_holdings`)

- `id` → UUID (Primary Key)
- `exchangeId` → UUID (کلید خارجی به `inv_crypto_exchanges.id`)
- `networkId` → UUID (nullable — کلید خارجی به `inv_crypto_wallet_networks.id`؛ فقط برای wallet‌ها؛ برای صرافی null است)
- `symbol` → string (BTC, ETH, USDT, IRR و ...)
- `name` → string
- `chainId` → string (nullable — شناسه شبکه بلاکچین؛ مثلاً `1` برای Ethereum Mainnet، `56` برای BSC، `728126428` برای Tron؛ برای tokenهای native مثل BTC یا ETH از نام شبکه مادر استفاده می‌شود)
- `contractAddress` → string (nullable — آدرس قرارداد هوشمند توکن؛ برای native tokenهایی مثل BTC و ETH که آدرس قرارداد ندارند null است؛ برای USDT-TRC20، USDT-ERC20، و هر ERC20/BEP20/TRC20 Token دیگری الزامی است)
- `decimals` → integer (nullable — تعداد اعشار توکن؛ مثلاً 18 برای USDT-ERC20، 6 برای USDT-TRC20؛ اگر null باشد فرض می‌شود هسته اصلی شبکه — مثلاً 18 برای ETH؛ برای IRR و USDT داخلی صرافی null قابل قبول است)
- `assetId` → string (nullable — شناسه این رمزارز در Provider قیمت‌گیری — مثلاً `bitcoin` در CoinGecko یا `BTC_USDT` در Nobitex؛ وقتی null باشد، `symbol` برای جستجوی قیمت استفاده می‌شود اما ممکن است tokenهای همنام تداخل داشته باشند)
- `quantity` → decimal (موجودی فعلی)
- `averageBuyPrice` → decimal
- `currency` → string
- `totalInvested` → decimal
- `totalFeesPaidUSDT` → decimal (مجموع تجمیعی تمام کارمزدهای پرداخت‌شده، پس از تبدیل هر کارمزد به USDT طبق فرمول بخش «منطق کارمزد» — صرف‌نظر از اینکه کارمزد هر تراکنش به IRR، USDT یا خود رمزارز پرداخت شده)
- `createdAt` → datetime
- `updatedAt` → datetime

> **نکته `networkId`**: این فیلد فقط برای والت‌ها معنی دارد. مثلاً کاربری که USDT دارد روی هر دو شبکه TRC20 و ERC20 در یک والت، **دو ردیف جداگانه** در `inv_crypto_holdings` خواهد داشت (هر کدام با `networkId` متفاوت)؛ این تفکیک برای محاسبه صحیح انتقال بین شبکه‌ها الزامی است.

> **نکته مهم**: موجودی نقدی ریال/تتر هر صرافی/ولت از طریق جدول `inv_crypto_holdings` با `symbol=IRR` یا `symbol=USDT` مدیریت می‌شود. این یک تصمیم طراحی عمدی است که به جای ایجاد یک جدول جداگانه، از ساختار موجود استفاده می‌کند.  
> **نکته مهم ۲ - جلوگیری از تکرار در محاسبه ثروت**:  
> - برای IRR و USDT:  
>   - `averageBuyPrice = 1` (ثابت، چون نرخ تبدیل با خودشان ثابت است)  
>   - `totalInvested = 0` (مبلغ واریزی در این فیلد ثبت نمی‌شود)  
>   - `totalFeesPaidUSDT = 0` (کارمزدها در `inv_crypto_exchange_transactions` ذخیره می‌شوند)  
> - در تابع `getPortfolioValue()`، موجودی IRR و USDT **به صورت اختیاری** در محاسبه ارزش پرتفوی لحاظ می‌شود (با کنترل `includeCashInWealth` در تنظیمات پرتفوی)  
> - **مهم**: صرافی/ولت هرگز رکورد مستقل در `acc_accounts` ندارد. تنها زمانی که واریز/برداشت واقعی بین یک حساب بانکی و صرافی رخ می‌دهد، یک تراکنش در `acc_transactions` (با `relatedFeature = 'crypto_exchange'`) برای همان حساب بانکی موجود ثبت می‌شود؛ این ثبت هیچ ارتباطی با موجودی داخلی IRR/USDT صرافی در `inv_crypto_holdings` ندارد و نباید با آن یکی در نظر گرفته شود. ایجاد یک رکورد موازی در `acc_accounts` برای هر صرافی باعث شمارش دوگانه در محاسبه ثروت خالص می‌شود.

### ۴. Crypto Transaction (جدول: `inv_crypto_transactions`) — لاگ معاملات رمزارز

- `id` → UUID (Primary Key)
- `exchangeId` → UUID
- `symbol` → string
- `type` → string (`buy`, `sell`, `transfer_in`, `transfer_out`)
- `quantity` → decimal
- `price` → decimal
- `totalAmount` → decimal
- `feeAmount` → decimal
- `feeCurrency` → string (ارز کارمزد: IRR, USDT, BTC و ...)
- `feeAssetPriceToUSDT` → decimal (فقط وقتی `feeCurrency` نه IRR و نه USDT باشد؛ قیمت لحظه‌ای آن رمزارز به تتر، مثلاً قیمت BTC = ۶۵,۰۰۰ USDT)
- `exchangeRateToBase` → decimal (نرخ ریال به ازای ۱ تتر در لحظه ثبت — برای تبدیل نهایی به ارز پایه کاربر)
- `currency` → string
- `counterExchangeId` → UUID (صرافی/ولت مقابل — برای انتقال — nullable)
- `network` → string (nullable — شبکه بلاکچینی که انتقال از طریق آن انجام شده؛ برای `transfer_in`/`transfer_out` بین والت‌ها الزامی، برای `buy`/`sell` null)
- `transferId` → UUID (نال مگر برای `type: transfer_in`/`transfer_out` — بین دو رکورد `transfer_out` و `transfer_in` متناظر یک انتقال، مقدار یکسان و مشترک دارد؛ برای تشخیص قطعی جفت رکورد و Reversal صحیح وقتی چند انتقال هم‌زمان بین همان دو صرافی رخ می‌دهد)
- `txHash` → string (nullable — شناسه تراکنش آنچین (Transaction Hash) روی بلاکچین؛ برای `transfer_in`/`transfer_out` بین والت‌ها بسیار ارزشمند است؛ برای `buy`/`sell` داخل صرافی متمرکز معمولاً null است)
- `blockNumber` → integer (nullable — شماره بلاکی که تراکنش در آن تأیید شده؛ فقط اگر `txHash` موجود باشد معنی دارد)
- `confirmations` → integer (nullable — تعداد تأییدیه‌های بلاکچین در لحظه ثبت؛ اختیاری برای رفرنس تاریخی)
- `description` → string
- `date` → datetime
- `createdAt` → datetime

### ۵. Crypto Exchange Transaction (جدول: `inv_crypto_exchange_transactions`) — لاگ واریز و برداشت ریالی/تتری

- `id` → UUID (Primary Key)
- `exchangeId` → UUID
- `type` → string (`deposit`, `withdraw`)
- `amount` → decimal
- `currency` → string (IRR, USDT و ...)
- `feeAmount` → decimal
- `feeCurrency` → string
- `feeAssetPriceToUSDT` → decimal (فقط وقتی `feeCurrency` نه IRR و نه USDT باشد؛ قیمت لحظه‌ای آن رمزارز به تتر)
- `exchangeRateToBase` → decimal (نرخ ریال به ازای ۱ تتر در لحظه ثبت)
- `accountId` → UUID (حساب بانکی مرتبط)
- `network` → string (nullable — شبکه بلاکچینی که واریز/برداشت از طریق آن انجام شده؛ مثلاً `TRC20`، `ERC20`؛ برای واریز/برداشت ریالی null است)
- `txHash` → string (nullable — شناسه تراکنش آنچین برای واریز/برداشت کریپتویی؛ برای واریز/برداشت ریالی فیات null است)
- `blockNumber` → integer (nullable — شماره بلاک تأییدشده در بلاکچین؛ اختیاری)
- `confirmations` → integer (nullable — تعداد تأییدیه‌های بلاکچین در لحظه ثبت؛ اختیاری برای رفرنس تاریخی — فقط وقتی `txHash` موجود باشد معنی دارد)
- `accountTransactionId` → UUID (لینک به `acc_transactions`)
- `description` → string
- `date` → datetime
- `createdAt` → datetime

> **نکته لینک**: هنگام ایجاد این تراکنش، یک تراکنش در `acc_transactions` نیز ایجاد می‌شود با:  
> - `relatedFeature = 'crypto_exchange'`  
> - `relatedId = inv_crypto_exchange_transactions.id`
> 
> **نکته مهم**: برای لینک معکوس، در جدول `acc_transactions` فیلدهای `relatedFeature` و `relatedId` تعریف شده‌اند که به `inv_crypto_exchange_transactions.id` اشاره می‌کند. این یکی از دلایل ایجاد دو تراکنش (یکی در حساب بانکی، یکی در صرافی) است.

### ۶. acc_transactions

- فقط زمانی که پول واقعاً از/به حساب بانکی جابه‌جا شود ثبت می‌شود و با `inv_crypto_exchange_transactions` لینک می‌گردد.
- لینک از طریق `relatedFeature = 'crypto_exchange'` و `relatedId = inv_crypto_exchange_transactions.id` انجام می‌شود.

---

## منطق کارمزد

- هر کارمزد با `feeAmount` + `feeCurrency` + `exchangeRateToBase` ذخیره می‌شود؛ اگر `feeCurrency` رمزارزی غیر از USDT باشد (مثلاً BTC، ETH)، فیلد `feeAssetPriceToUSDT` نیز الزامی است.
- ارزش معادل کارمزد به شرح زیر محاسبه می‌شود (همیشه با `decimal.js`، هرگز `Number`):
  - اگر `feeCurrency = IRR`: `convertedToUSDT = feeAmount / exchangeRateToBase`
  - اگر `feeCurrency = USDT`: `convertedToIRR = feeAmount * exchangeRateToBase`
  - اگر `feeCurrency` رمزارز دیگری باشد (BTC/ETH و ...):
    ```
    convertedToUSDT = feeAmount * feeAssetPriceToUSDT
    convertedToIRR  = convertedToUSDT * exchangeRateToBase
    ```
    (تقسیم مستقیم `feeAmount` بر `exchangeRateToBase` در این حالت **غلط** است، چون `exchangeRateToBase` فقط نرخ ریال-به-تتر است و ربطی به قیمت BTC/ETH ندارد.)
- مجموع کارمزدها در Holding به صورت تجمعی (یک ارز ثابت) نگهداری می‌شود.
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
- `createCryptoTransaction(data)` → خرید / فروش / انتقال
- `createExchangeTransaction(data)` → واریز (`inv_crypto_exchange_transactions.type='deposit'` و `acc_transactions.type='deposit-investment'`) / برداشت (`inv_crypto_exchange_transactions.type='withdraw'` و `acc_transactions.type='withdrawal-investment'`) + ثبت در هر دو جدول + لینک تراکنش بانکی
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

**هنگام خرید** (Weighted Average):
```
newTotalInvested = totalInvested + (quantityBought × price) + feeAmount(به ارز پایه)
newQuantity      = quantity + quantityBought
newAverageBuyPrice = newTotalInvested / newQuantity
```

**هنگام فروش** (`averageBuyPrice` استفاده‌شده = میانگین خرید **قبل از این فروش**، یعنی همان مقدار فعلی Holding پیش از هر تغییر):
```
soldPortionCost = quantitySold × averageBuyPrice
realizedPL       = saleProceeds - soldPortionCost - feeAmount(به ارز پایه)
totalInvested    -= soldPortionCost      // کاهش متناسب با بخش فروخته‌شده
quantity         -= quantitySold
averageBuyPrice  بدون تغییر می‌ماند       // Weighted Average فقط با خرید جدید تغییر می‌کند، نه با فروش
```

> **نکات الزامی**:
> - تمام محاسبات بالا باید با `decimal.js` انجام شوند (هرگز `Number`)، مطابق «قانون Minor Unit Storage» در `db.md`.
> - `feeAmount` باید طبق فرمول بخش «منطق کارمزد» (بالاتر در همین فایل) ابتدا به ارز پایه تبدیل و سپس در `realizedPL` کسر شود.
> - `calculateProfitLoss(symbol?, exchangeId?)` مجموع `realizedPL` تمام تراکنش‌های فروش (از لاگ `inv_crypto_transactions` با `type=sell`) را برمی‌گرداند؛ سود/زیان **تحقق‌نیافته** (Unrealized) جداگانه و بر اساس `(currentPrice - averageBuyPrice) × quantity` محاسبه می‌شود و نباید با Realized P&L مخلوط شود.
> - در `transfer_out`/`transfer_in` بین صرافی‌های خودی، هیچ `realizedPL`ای ایجاد نمی‌شود (فروش واقعی نیست)؛ فقط `quantity` بین دو Holding جابه‌جا می‌شود و `averageBuyPrice` مقصد باید Weighted Average بین موجودی قبلی مقصد (اگر بود) و مقدار انتقالی با همان `averageBuyPrice` مبدأ باشد.

---

## نکات طراحی

- میانگین خرید با فرمول Weighted Average به‌روزرسانی می‌شود.
- `inv_crypto_transactions` و `inv_crypto_exchange_transactions` فقط لاگ هستند.
- موجودی و میانگین خرید و مجموع کارمزدها در جدول `inv_crypto_holdings` نگهداری می‌شود.
- قیمت لحظه‌ای رمزارزها می‌تواند از API خارجی + کش آفلاین تأمین شود.

> **نکته مهم**: موجودی نقدی ریال/تتر هر صرافی/ولت از طریق جدول `inv_crypto_holdings` با `symbol=IRR` یا `symbol=USDT` مدیریت می‌شود. این یک تصمیم طراحی عمدی است که به جای ایجاد یک جدول جداگانه، از ساختار موجود استفاده می‌کند. `averageBuyPrice` برای این دو ارز همیشه `1` در نظر گرفته می‌شود چون نرخ تبدیل آن‌ها با خودشان ثابت است.
