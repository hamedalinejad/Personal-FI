# زیر‌فیچر: Investment - Crypto (رمزارز)

## توضیح کلی
این زیر‌فیچر مسئولیت کامل مدیریت دارایی‌های رمزارزی را بر عهده دارد.  
شامل مدیریت صرافی‌ها و والت‌ها (شامل والت نرم‌افزاری)، خرید، فروش، انتقال، واریز و برداشت، محاسبه میانگین خرید، سود و زیان و ارزش پرتفوی است.

تمام جابه‌جایی‌های ریالی/تتری با حساب‌های بانکی از طریق جدول `AccountsBanking_transactions` ثبت می‌شوند و به تراکنش‌های صرافی لینک می‌گردند.

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
   - در صورت پرداخت از حساب بانکی → تراکنش در `AccountsBanking_transactions` + `crypto_exchange_transactions` ثبت می‌شود.
3. هنگام **فروش**:
   - موجودی رمزارز کاهش می‌یابد.
   - مبلغ حاصل می‌تواند به موجودی ریال/تتر همان صرافی یا والت اضافه شود (نه الزاماً حساب بانکی).
4. **واریز از حساب بانکی** به صرافی/ولت:
   - موجودی حساب بانکی کاهش و موجودی ریال/تتر صرافی افزایش می‌یابد.
   - تراکنش در `AccountsBanking_transactions` ثبت می‌شود.
   - تراکنش در `crypto_exchange_transactions` نیز ثبت و به تراکنش بانکی لینک می‌شود.
5. **برداشت به حساب بانکی**:
   - موجودی ریال/تتر صرافی کاهش و موجودی حساب بانکی افزایش می‌یابد.
   - تراکنش در هر دو جدول ثبت و به هم لینک می‌شود.
6. **انتقال بین صرافی‌ها/والت‌ها**:
   - حتماً دو تراکنش لینک‌شده ثبت می‌شود:
     - یکی در صرافی مبدا با `type: transfer_out` و `counterExchangeId` به مقصد
     - یکی در صرافی مقصد با `type: transfer_in` و `counterExchangeId` به مبدا
   - کارمزد می‌تواند از مقدار ارز ارسالی کسر شود:
     - مقدار ارسالی: `amountToSend`
     - کارمزد: `feeAmount` (از `amountToSend` کسر می‌شود)
     - موجودی افزایش شده در مقصد: `amountToSend - feeAmount`
   - موجودی کل رمزارز کاربر تغییر نمی‌کند (فقط جابه‌جایی بین پلتفرم‌ها).
7. میانگین خرید با هر خرید جدید به‌روزرسانی می‌شود.
8. کارمزدها با `feeAmount` + `feeCurrency` + `exchangeRateToUSDT` در لحظه ثبت می‌شوند.
9. موجودی حساب بانکی نمی‌تواند منفی شود.
10. نرخ تبدیل لحظه معامله ذخیره و قفل می‌شود.

---

## Domain Entities

### ۱. Crypto Exchange / Wallet (جدول: `crypto_exchanges`)

- `id` → UUID (Primary Key)
- `name` → string
- `type` → string (`exchange`, `software_wallet`, `hardware_wallet`)
- `url` → string (آدرس سایت یا اپلیکیشن — nullable)
- `description` → string
- `isActive` → boolean
- `createdAt` → datetime
- `updatedAt` → datetime

### ۲. Crypto Holding (جدول: `crypto_holdings`)

- `id` → UUID (Primary Key)
- `exchangeId` → UUID
- `symbol` → string (BTC, ETH, USDT, IRR و ...)
- `name` → string
- `quantity` → decimal (موجودی فعلی)
- `averageBuyPrice` → decimal
- `currency` → string
- `totalInvested` → decimal
- `totalFeesPaid` → decimal (مجموع کارمزدهای پرداخت‌شده)
- `totalFeesPaidCurrency` → string (IRR یا USDT بر اساس ارز کارمزد اصلی)
- `createdAt` → datetime
- `updatedAt` → datetime

> توضیح: در این مدل، موجودی نقدی ریال/تتر هر صرافی/ولت از طریق جدول `crypto_holdings` با `symbol=IRR` یا `symbol=USDT` مدیریت می‌شود. اگرچه IRR و USDT فنیٌاً "کریپتو" نیستند، اما این رویکرد ساده‌ترین روش برای یکپارچه‌سازی موجودی نقدی در پلتفرم‌های مختلف است. مقدار `quantity` نشان‌دهنده موجودی نقدی است و `averageBuyPrice` برای آن‌ها `1` در نظر گرفته می‌شود.

### ۳. Crypto Transaction (جدول: `crypto_transactions`) — لاگ معاملات رمزارز

- `id` → UUID (Primary Key)
- `exchangeId` → UUID
- `symbol` → string
- `type` → string (`buy`, `sell`, `transfer_in`, `transfer_out`)
- `quantity` → decimal
- `price` → decimal
- `totalAmount` → decimal
- `feeAmount` → decimal
- `feeCurrency` → string (ارز کارمزد: IRR, USDT, BTC و ...)
- `exchangeRateToUSDT` → decimal
- `currency` → string
- `counterExchangeId` → UUID (برای انتقال — nullable)
- `description` → string
- `date` → datetime
- `createdAt` → datetime

### ۴. Crypto Exchange Transaction (جدول: `crypto_exchange_transactions`) — لاگ واریز و برداشت ریالی/تتری

- `id` → UUID (Primary Key)
- `exchangeId` → UUID
- `type` → string (`deposit`, `withdraw`)
- `amount` → decimal
- `currency` → string (IRR, USDT و ...)
- `feeAmount` → decimal
- `feeCurrency` → string
- `exchangeRateToUSDT` → decimal
- `accountId` → UUID (حساب بانکی مرتبط)
- `accountTransactionId` → UUID (لینک به `AccountsBanking_transactions`)
- `description` → string
- `date` → datetime
- `createdAt` → datetime

### ۵. AccountsBanking_transactions

- فقط زمانی که پول واقعاً از/به حساب بانکی جابه‌جا شود ثبت می‌شود و با `crypto_exchange_transactions` لینک می‌گردد.

---

## منطق کارمزد

- هر کارمزد با `feeAmount` + `feeCurrency` + `exchangeRateToUSDT` ذخیره می‌شود.
- ارزش معادل کارمزد همیشه on-the-fly محاسبه می‌شود:
  - `convertedToUSDT = feeAmount / exchangeRateToUSDT` (اگر feeCurrency=IRR)
  - `convertedToIRR = feeAmount * exchangeRateToUSDT` (اگر feeCurrency=USDT)
  - `convertedToIRR = feeAmount / exchangeRateToUSDT` (اگر feeCurrency=BTC/ETH و ...)
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
- `createExchangeTransaction(data)` → واریز / برداشت + ثبت در هر دو جدول + لینک تراکنش بانکی
- `getCryptoTransactions(filters)`
- `getExchangeTransactions(filters)`
- `calculateProfitLoss(symbol?, exchangeId?)`

---

## روابط با سایر فیچرها

- **Accounts & Banking**: واریز و برداشت + لینک تراکنش‌ها
- **Currency & Multi-Currency**: نرخ تبدیل لحظه‌ای
- **Reports** و **Dashboard**: ارزش پرتفوی و سود/زیان
- **Portfolio & Wealth Overview**: تأمین داده رمزارز

---

## نکات طراحی

- میانگین خرید با فرمول Weighted Average به‌روزرسانی می‌شود.
- `crypto_transactions` و `crypto_exchange_transactions` فقط لاگ هستند.
- موجودی و میانگین خرید و مجموع کارمزدها در جدول `crypto_holdings` نگهداری می‌شود.
- قیمت لحظه‌ای رمزارزها می‌تواند از API خارجی + کش آفلاین تأمین شود.

> **نکته مهم**: موجودی نقدی ریال/تتر هر صرافی/ولت از طریق جدول `crypto_holdings` با `symbol=IRR` یا `symbol=USDT` مدیریت می‌شود. این یک تصمیم طراحی عمدی است که به جای ایجاد یک جدول جداگانه، از ساختار موجود استفاده می‌کند. `averageBuyPrice` برای این دو ارز همیشه `1` در نظر گرفته می‌شود چون نرخ تبدیل آن‌ها با خودشان ثابت است.