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
   - موجودی نقدی کارگزاری افزایش می‌یابد.
   - تراکنش در `AccountsBanking_transactions` + جدول تراکنش‌های کارگزاری ثبت و به هم لینک می‌شود.
4. **برداشت از کارگزاری به حساب بانکی**:
   - موجودی نقدی کارگزاری کاهش و موجودی حساب بانکی افزایش می‌یابد.
   - تراکنش در هر دو جدول ثبت و لینک می‌شود.
5. **خرید سهام**:
   - از موجودی نقدی کارگزاری کسر می‌شود.
   - موجودی سهم افزایش و میانگین خرید به‌روزرسانی می‌شود.
6. **فروش سهام**:
   - موجودی سهم کاهش می‌یابد.
   - مبلغ حاصل به موجودی نقدی کارگزاری اضافه می‌شود.
7. کارمزدها هم به ریال و هم معادل تتری لحظه ثبت می‌شوند.
8. موجودی حساب بانکی و موجودی نقدی کارگزاری نمی‌توانند منفی شوند.

---

## Domain Entities

### ۱. Brokerage (جدول: `stock_iran_brokerages`)

- `id` → UUID (Primary Key)
- `name` → string (نام کارگزاری)
- `accountNumber` → string (شماره حساب معاملاتی — nullable)
- `url` → string (آدرس سایت یا اپ — nullable)
- `description` → string
- `isActive` → boolean
- `createdAt` → datetime
- `updatedAt` → datetime

### ۲. Stock Holding (جدول: `stock_iran_holdings`)

- `id` → UUID (Primary Key)
- `brokerageId` → UUID
- `symbol` → string (نماد سهم — مثلاً فولاد، شپنا)
- `name` → string (نام شرکت)
- `quantity` → decimal (تعداد سهم)
- `averageBuyPrice` → decimal (میانگین قیمت خرید — ریال)
- `totalInvested` → decimal
- `totalFeesPaidIRR` → decimal
- `totalFeesPaidUSDT` → decimal
- `createdAt` → datetime
- `updatedAt` → datetime

### ۳. Stock Transaction (جدول: `stock_iran_transactions`) — لاگ خرید و فروش

- `id` → UUID (Primary Key)
- `brokerageId` → UUID
- `symbol` → string
- `type` → string (`buy`, `sell`)
- `quantity` → decimal
- `price` → decimal (قیمت هر سهم — ریال)
- `totalAmount` → decimal
- `feeAmount` → decimal
- `feeValueIRR` → decimal
- `feeValueUSDT` → decimal
- `exchangeRateToUSDT` → decimal (نرخ تتر لحظه معامله)
- `description` → string
- `date` → datetime
- `createdAt` → datetime

### ۴. Brokerage Cash Transaction (جدول: `stock_iran_brokerage_transactions`) — لاگ واریز و برداشت

- `id` → UUID (Primary Key)
- `brokerageId` → UUID
- `type` → string (`deposit`, `withdraw`)
- `amount` → decimal (ریال)
- `feeAmount` → decimal
- `feeValueIRR` → decimal
- `feeValueUSDT` → decimal
- `exchangeRateToUSDT` → decimal
- `accountId` → UUID (حساب بانکی مرتبط)
- `accountTransactionId` → UUID (لینک به `AccountsBanking_transactions`)
- `description` → string
- `date` → datetime
- `createdAt` → datetime

### ۵. AccountsBanking_transactions

- فقط در واریز و برداشت بین حساب بانکی و کارگزاری ثبت می‌شود.

---

## APIهای داخلی

### Brokerage APIs
- `createBrokerage(data)`
- `updateBrokerage(id, data)`
- `getAllBrokerages()`
- `getBrokerageById(id)`
- `getBrokerageCashBalance(brokerageId)`

### Holding APIs
- `getHoldings(brokerageId?)`
- `getHoldingBySymbol(symbol, brokerageId?)`
- `getPortfolioValue()` → ارزش کل پرتفوی ایران (ریال + معادل تتری)

### Transaction APIs
- `createStockTransaction(data)` → خرید / فروش
- `createBrokerageTransaction(data)` → واریز / برداشت + لینک به حساب بانکی
- `getStockTransactions(filters)`
- `getBrokerageTransactions(filters)`
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