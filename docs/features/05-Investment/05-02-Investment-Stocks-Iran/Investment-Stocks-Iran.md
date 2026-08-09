# زیر‌فیچر: Investment - Stocks Iran (سهام بورس ایران)

## توضیح کلی
این زیر‌فیچر مدیریت سرمایه‌گذاری در **بازار بورس ایران** را بر عهده دارد.  
تمام مبالغ به **ریال** هستند، اما در هر معامله **نرخ تتر لحظه** ذخیره می‌شود تا بتوان در آینده عملکرد سرمایه‌گذاری را نسبت به دلار/تتر نیز مقایسه کرد.

جریان کار:
1. واریز وجه از حساب بانکی به حساب کارگزاری
2. خرید و فروش سهام از طریق موجودی کارگزاری
3. برداشت وجه از کارگزاری به حساب بانکی

> نکته: این زیر‌فیچر مخصوص سهام ایران است. سهام خارجی در زیر‌فیچر جداگانه‌ای در آینده اضافه خواهد شد.

---

## User Stories

### Must Have
- ثبت کارگزاری
- واریز از حساب بانکی به کارگزاری
- برداشت از کارگزاری به حساب بانکی
- ثبت خرید سهام ایران
- ثبت فروش سهام ایران
- مشاهده موجودی هر سهم و میانگین خرید
- محاسبه سود و زیان (realized و unrealized)
- مشاهده ارزش کل پرتفوی بورسی ایران
- ذخیره نرخ تتر لحظه هر معامله
- ثبت و پیگیری کارمزدها (به ریال + معادل تتری)

### Should Have
- ثبت سود نقدی (Dividend)
- پیوست رسید معامله
- تاریخچه قیمت سهام

---

## Business Rules

1. تمام مبالغ به ریال هستند.
2. در هر معامله، نرخ تتر لحظه ثبت و قفل می‌شود.
3. **واریز از حساب بانکی به کارگزاری**:
   - موجودی حساب بانکی کاهش می‌یابد.
   - موجودی نقدی کارگزاری در `inv_stocks_iran_brokerages.cashBalance` افزایش می‌یابد.
   - تراکنش در `acc_transactions` با `relatedFeature = 'stocks_iran'` و `relatedId = inv_stocks_iran_brokerage_transactions.id` ثبت و به هم لینک می‌شود.
   - تراکنش در `inv_stocks_iran_brokerage_transactions` نیز ثبت می‌شود.
4. **برداشت از کارگزاری به حساب بانکی**:
   - موجودی نقدی کارگزاری کاهش و موجودی حساب بانکی افزایش می‌یابد.
   - هر دو تراکنش (`acc_transactions` و `inv_stocks_iran_brokerage_transactions`) ثبت و به هم لینک می‌شوند.
   - لینک از طریق `relatedFeature = 'stocks_iran'` و `relatedId = inv_stocks_iran_brokerage_transactions.id` انجام می‌شود.
5. **خرید سهام**:
   - از موجودی نقدی کارگزاری کسر می‌شود.
   - موجودی سهم افزایش و میانگین خرید به‌روزرسانی می‌شود.
6. **فروش سهام**:
   - موجودی سهم کاهش می‌یابد.
   - مبلغ حاصل به موجودی نقدی کارگزاری اضافه می‌شود.
7. کارمزدها با `feeAmount` + `feeCurrency` + `exchangeRateToUSDT` ثبت می‌شوند.
8. موجودی حساب بانکی و موجودی نقدی کارگزاری نمی‌توانند منفی شوند.
9. تعداد سهم (`quantity`) نمی‌تواند منفی شود.

> **نکته طراحی**: موجودی نقدی کارگزاری از طریق فیلد `cashBalance` در جدول `inv_stocks_iran_brokerages` با snapshot نگهداری می‌شود تا محاسبات سریع باشد. تراکنش‌های در `inv_stocks_iran_brokerage_transactions` فقط لاگ هستند.

---

## Domain Entities

### ۱. Brokerage (جدول: `inv_stocks_iran_brokerages`)

- `id` → UUID (Primary Key)
- `name` → string (نام کارگزاری)
- `accountNumber` → string (شماره حساب معاملاتی — nullable)
- `url` → string (آدرس سایت یا اپ — nullable)
- `description` → string
- `isActive` → boolean
- `cashBalance` → decimal (موجودی نقدی کارگزاری به ریال — برای سرعت بالا در محاسبات)
- `createdAt` → datetime
- `updatedAt` → datetime

> **نکته طراحی**: موجودی نقدی کارگزاری از طریق فیلد `cashBalance` در این جدول با snapshot نگهداری می‌شود.  
> - هنگام واریز: `cashBalance += amount`  
> - هنگام برداشت: `cashBalance -= amount`  
> - هنگام خرید سهام: `cashBalance -= totalAmount + fees`  
> - هنگام فروش سهام: `cashBalance += totalAmount - fees`  
> - تراکنش‌ها در `inv_stocks_iran_brokerage_transactions` فقط لاگ هستند  
> - برای جلوگیری از تکرار در محاسبه ثروت، این موجودی در `Portfolio & Wealth Overview` با کنترل `includeCashInWealth = false` لحاظ نمی‌شود

### ۲. Stock Holding (جدول: `inv_stocks_iran_holdings`)

- `id` → UUID (Primary Key)
- `brokerageId` → UUID
- `symbol` → string (نماد سهم — مثلاً فولاد، شپنا)
- `name` → string (نام شرکت)
- `quantity` → decimal (تعداد سهم)
- `averageBuyPrice` → decimal (میانگین قیمت خرید — ریال)
- `totalInvested` → decimal
- `totalFeesPaid` → decimal
- `totalFeesPaidCurrency` → string (IRR یا USDT بر اساس ارز کارمزد اصلی)
- `createdAt` → datetime
- `updatedAt` → datetime

> **نکته**: این جدول فقط برای خرید و فروش سهام است. موجودی نقدی کارگزاری در فیلد `cashBalance` از جدول `inv_stocks_iran_brokerages` نگهداری می‌شود (برای سرعت بالا). این موجودی در محاسبه ثروت در فیچر `Portfolio & Wealth Overview` به صورت اختیاری با کنترل `includeCashInWealth` لحاظ می‌شود.

### ۳. Stock Transaction (جدول: `inv_stocks_iran_transactions`) — لاگ خرید و فروش

- `id` → UUID (Primary Key)
- `brokerageId` → UUID
- `symbol` → string
- `type` → string (`buy`, `sell`)
- `quantity` → decimal
- `price` → decimal (قیمت هر سهم — ریال)
- `totalAmount` → decimal
- `feeAmount` → decimal
- `feeCurrency` → string
- `exchangeRateToUSDT` → decimal (نرخ تتر لحظه معامله — ریال به ازای ۱ تتر، مثلاً ۶۰,۰۰۰)
- `description` → string
- `date` → datetime
- `createdAt` → datetime

### ۴. Brokerage Cash Transaction (جدول: `inv_stocks_iran_brokerage_transactions`) — لاگ واریز و برداشت

- `id` → UUID (Primary Key)
- `brokerageId` → UUID
- `type` → string (`deposit`, `withdraw`)
- `amount` → decimal (ریال)
- `feeAmount` → decimal
- `feeCurrency` → string
- `exchangeRateToUSDT` → decimal (نرخ تتر لحظه — ریال به ازای ۱ تتر، مثلاً ۶۰,۰۰۰)
- `accountId` → UUID (حساب بانکی مرتبط)
- `accountTransactionId` → UUID (لینک به `acc_transactions`)
- `description` → string
- `date` → datetime
- `createdAt` → datetime

> **نکته لینک**: هنگام ایجاد این تراکنش، یک تراکنش در `acc_transactions` نیز ایجاد می‌شود با:  
> - `relatedFeature = 'stocks_iran'`  
> - `relatedId = inv_stocks_iran_brokerage_transactions.id`
> 
> **نکته مهم**: برای لینک معکوس، در جدول `acc_transactions` فیلدهای `relatedFeature` و `relatedId` تعریف شده‌اند که به `inv_stocks_iran_brokerage_transactions.id` اشاره می‌کند. این یکی از دلایل ایجاد دو تراکنش (یکی در حساب بانکی، یکی در کارگزاری) است.

### ۵. acc_transactions

- فقط در واریز و برداشت بین حساب بانکی و کارگزاری ثبت می‌شود.
- لینک از طریق `relatedFeature = 'stocks_iran'` و `relatedId = inv_stocks_iran_brokerage_transactions.id` انجام می‌شود.

---

## APIهای داخلی

### Brokerage APIs
- `createBrokerage(data)` → ایجاد کارگزاری با `cashBalance = 0`
- `updateBrokerage(id, data)` → به‌روزرسانی اطلاعات کارگزاری (شامل `cashBalance`)
- `getAllBrokerages()` → لیست کارگزاری‌ها همراه با `cashBalance`
- `getBrokerageById(id)` → دریافت کارگزاری با `cashBalance`
- `getBrokerageCashBalance(brokerageId)` → دریافت موجودی نقدی (از `cashBalance`)

### Holding APIs
- `getHoldings(brokerageId?)`
- `getHoldingBySymbol(symbol, brokerageId?)`
- `getPortfolioValue()` → ارزش کل پرتفوی ایران (ریال + معادل تتری)

### Transaction APIs
- `createStockTransaction(data)` → خرید / فروش
- `createBrokerageTransaction(data)` → واریز (`type='deposit-investment'`) / برداشت (`type='withdrawal-investment'`) + لینک به حساب بانکی
- `getStockTransactions(filters)`
- `getBrokerageTransactions(filters)` → برای واریز/برداشت
- `calculateProfitLoss(symbol?, brokerageId?)`

---

## روابط با سایر فیچرها

- **Accounts & Banking**: واریز و برداشت
- **Currency & Multi-Currency**: دریافت نرخ تتر لحظه‌ای
- **Reports** و **Dashboard**: ارزش پرتفوی و سود/زیان
- **Portfolio & Wealth Overview**: تأمین داده سهام ایران

---

## نکات طراحی

- این زیر‌فیچر مخصوص **سهام بورس ایران** است.
- همه چیز به ریال است، اما نرخ تتر در هر رکورد ذخیره می‌شود.
- میانگین خرید با Weighted Average محاسبه می‌شود.
- کارمزدها هم به ریال و هم معادل تتری ثبت می‌شوند.
- موجودی نقدی کارگزاری جدا از موجودی سهام مدیریت می‌شود.
- در آینده زیر‌فیچر جداگانه‌ای برای سهام خارجی اضافه خواهد شد.