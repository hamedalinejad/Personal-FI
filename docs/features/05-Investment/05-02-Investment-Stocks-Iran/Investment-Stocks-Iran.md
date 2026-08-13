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
7. کارمزدها با `feeAmount` + `feeCurrency` + `exchangeRateToBase` ثبت می‌شوند.
7a. **سود نقدی (Dividend) — CRITICAL ACCOUNTING**:
   - ثبت در `inv_stocks_iran_transactions` با `type = 'dividend'`
   - **MUST** ایجاد Income Transaction در `acc_transactions`:
     ```
     acc_transactions {
       type: 'deposit-income',
       relatedFeature: 'stocks_iran',
       relatedId: dividend_transaction_id,
       amount: dividend_amount,
       date: dividend_date,
       description: "Dividend from [symbol]: [amount]",
       accountId: brokerage_account  // کارگزاری حساب
     }
     ```
   - مبلغ به `inv_stocks_iran_brokerages.cashBalance` اضافه می‌شود
   - **Accounting Ledger میل شود**: بانک نقدی کارگزاری + موجودی Income
   - Dividend **نه** سهام محسوب نمی‌شود، **نه** در `calculateProfitLoss()` (realized/unrealized)
   - اما **یک درآمد محسوب می‌شود** و در Income بخش حسابداری ثبت می‌شود
8. موجودی حساب بانکی و موجودی نقدی کارگزاری نمی‌توانند منفی شوند.
9. تعداد سهم (`quantity`) نمی‌تواند منفی شود.
10. **ویرایش/حذف معاملات**: تراکنش‌های سهام پس از ثبت غیرقابل ویرایش هستند. برای اصلاح یا حذف:
    - تراکنش اصل ذخیره می‌ماند (`isVoided = true` در `acc_transactions`)
    - تراکنش‌های معکوس (Reversal) ثبت می‌شوند تا موجودی‌ها و میانگین خرید درست شوند
    - این رویکرد تاریخچه معاملات و محاسبات سود/زیان را حفظ می‌کند

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
- `totalFeesPaidBase` → decimal (مجموع تجمیعی تمام کارمزدهای پرداخت‌شده، پس از تبدیل هر کارمزد به **ارز پایه کاربر** (`baseCurrency`) با `exchangeRateToBase` همان تراکنش — صرف‌نظر از اینکه کارمزد به IRR یا USDT پرداخت شده)
- `createdAt` → datetime
- `updatedAt` → datetime

> **نکته**: این جدول فقط برای خرید و فروش سهام است. موجودی نقدی کارگزاری در فیلد `cashBalance` از جدول `inv_stocks_iran_brokerages` نگهداری می‌شود (برای سرعت بالا). این موجودی **در `Portfolio & Wealth Overview` با `includeCashInWealth = false` به‌طور پیش‌فرض لحاظ نمی‌شود** تا از شمارش دوگانه (چون همان پول از حساب بانکی آمده) جلوگیری شود.

### ۳. Stock Transaction (جدول: `inv_stocks_iran_transactions`) — لاگ خرید و فروش

- `id` → UUID (Primary Key)
- `brokerageId` → UUID
- `symbol` → string
- `type` → string (`buy`, `sell`, `dividend`)
- `quantity` → decimal (nullable برای `dividend`)
- `price` → decimal (قیمت هر سهم — ریال — nullable برای `dividend`)
- `totalAmount` → decimal (برای `dividend`: مبلغ کل سود نقدی دریافتی)
- `feeAmount` → decimal
- `feeCurrency` → string
- `exchangeRateToBase` → decimal (نرخ تتر لحظه معامله — ریال به ازای ۱ تتر، مثلاً ۶۰,۰۰۰)
- `description` → string
- `date` → datetime
- `createdAt` → datetime

> **نکته `dividend`**: سود نقدی سهام به‌صورت `type = 'dividend'` در همین جدول ثبت می‌شود (مشابه الگوی `inv_fif_transactions` در Fixed Income Funds)؛ `quantity` و `price` در این نوع `null` هستند و فقط `totalAmount` (مبلغ سود دریافتی) پر می‌شود. مبلغ به `cashBalance` کارگزاری در `inv_stocks_iran_brokerages` اضافه می‌شود و به‌عنوان درآمد ثبت می‌شود؛ در `calculateProfitLoss()` لحاظ نمی‌شود (سود تقسیمی جزئی از Realized P&L معاملات خرید/فروش نیست).

### ۴. Brokerage Cash Transaction (جدول: `inv_stocks_iran_brokerage_transactions`) — لاگ واریز و برداشت

- `id` → UUID (Primary Key)
- `brokerageId` → UUID
- `type` → string (`deposit`, `withdraw`)
- `amount` → decimal (ریال)
- `feeAmount` → decimal
- `feeCurrency` → string
- `exchangeRateToBase` → decimal (نرخ تتر لحظه — ریال به ازای ۱ تتر، مثلاً ۶۰,۰۰۰)
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
- `getPortfolioValue()` → ارزش کل **سهام** پرتفوی ایران (ریال + معادل تتری) — **فقط** ارزش بازار holdings (quantity × currentPrice)؛ موجودی نقدی کارگزاری (`cashBalance`) را **شامل نمی‌شود** و جداگانه از طریق `getBrokerageCashBalance(brokerageId)` در اختیار Portfolio & Wealth Overview قرار می‌گیرد

### Transaction APIs
- `createStockTransaction(data)` → خرید / فروش
- `createBrokerageTransaction(data)` → واریز (`type='deposit-investment'`) / برداشت (`type='withdrawal-investment'`) + لینک به حساب بانکی
- **`recordDividend(brokerageId, symbol, amount, date, description)` — NEW (CRITICAL)**
  ```typescript
  interface RecordDividendInput {
    brokerageId: UUID
    symbol: string     // نماد سهم (مثلاً فولاد)
    amount: Decimal    // مبلغ سود نقدی (ریال)
    date: datetime     // تاریخ دریافت سود
    description: string // توضیح (مثلاً "Dividend from FOLAD - 1000 ریال/سهم")
  }
  ```
  
  **Process**:
  ```
  1. CREATE inv_stocks_iran_transactions {
       type: 'dividend',
       brokerageId,
       symbol,
       totalAmount: amount,
       quantity: null,
       price: null,
       date
     }
  
  2. CREATE acc_transactions {
       type: 'deposit-income',
       relatedFeature: 'stocks_iran',
       relatedId: dividend_transaction.id,
       amount,
       date,
       description: "Dividend: " + description,
       accountId: brokerage.linkedBankAccountId  // کارگزاری کدام حساب بانکی لینک شده
     }
  
  3. UPDATE inv_stocks_iran_brokerages {
       cashBalance += amount
     }
  
  4. RETURN { success: true, dividend_id, accounting_entry_id }
  ```
  
  **Important**:
  - ✅ Dividend میل شود `acc_transactions` (Income entry)
  - ✅ Accounting Ledger یاد شود
  - ✅ Bank account لینک شود (شفاف کجا پول رفت)
  - ✅ NOT counted in Realized P&L (فقط درآمد، نه معامله)

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

---

## منطق محاسبه سود/زیان تحقق‌یافته (Realized P&L)

فرمول رسمی و تنها فرمول معتبر برای `calculateProfitLoss()` و به‌روزرسانی Holding هنگام خرید/فروش:

**هنگام خرید** (Weighted Average):
```
newTotalInvested = totalInvested + (quantityBought × price) + feeAmount
newQuantity      = quantity + quantityBought
newAverageBuyPrice = newTotalInvested / newQuantity
```

**هنگام فروش** (`averageBuyPrice` استفاده‌شده = میانگین خرید **قبل از این فروش**):
```
soldPortionCost = quantitySold × averageBuyPrice
realizedPL       = saleProceeds - soldPortionCost - feeAmount
totalInvested    -= soldPortionCost      // کاهش متناسب با بخش فروخته‌شده
quantity         -= quantitySold
averageBuyPrice  بدون تغییر می‌ماند       // Weighted Average فقط با خرید جدید تغییر می‌کند، نه با فروش
```

> **نکات الزامی**:
> - تمام محاسبات بالا باید با `decimal.js` انجام شوند (هرگز `Number`).
> - `calculateProfitLoss(symbol?, brokerageId?)` مجموع `realizedPL` تمام تراکنش‌های فروش (از لاگ `inv_stocks_iran_transactions` با `type=sell`) را برمی‌گرداند؛ سود/زیان **تحقق‌نیافته** (Unrealized) جداگانه و بر اساس `(getLatestPrice('stock', symbol, baseCurrency).price - averageBuyPrice) × quantity` محاسبه می‌شود (طبق فیچر `19-Price-Fetching` — به بخش «نکات طراحی» پایین همین فایل مراجعه شود) و نباید با Realized P&L مخلوط شود.

---

## نکات طراحی

- این زیر‌فیچر مخصوص **سهام بورس ایران** است.
- همه چیز به ریال است، اما نرخ تتر در هر رکورد ذخیره می‌شود.
- میانگین خرید با Weighted Average محاسبه می‌شود.
- کارمزدها هم به ریال و هم معادل تتری ثبت می‌شوند.
- موجودی نقدی کارگزاری جدا از موجودی سهام مدیریت می‌شود.
- **قیمت لحظه‌ای سهام (برای Unrealized P&L)** از فیچر `19-Price-Fetching` (جدول `price_history` با `assetCategory='stock'`) خوانده می‌شود؛ این فیچر مستقیماً به API بیرونی وصل نمی‌شود — فقط `getLatestPrice('stock', symbol)` را صدا می‌زند.
- در آینده زیر‌فیچر جداگانه‌ای برای سهام خارجی اضافه خواهد شد.