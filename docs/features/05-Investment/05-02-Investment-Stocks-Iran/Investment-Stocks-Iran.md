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
   - یک رکورد `type = 'dividend'` در `inv_stocks_iran_transactions` ثبت می‌شود (با `totalAmount = netAmount`)
   - **یک رکورد کامل** در `inv_stocks_iran_dividends` ثبت می‌شود با جزئیات:
     - `grossAmountPerShare` × `holdingQuantityAtRecord` = `grossAmount`
     - `taxAmount = grossAmount × taxRate / 100` (اگر معاف از مالیات: `taxAmount = 0`)
     - `netAmount = grossAmount - taxAmount` → این مقدار به `cashBalance` اضافه و در `acc_transactions` ثبت می‌شود
     - تاریخ‌های `exDate`, `recordDate`, `paymentDate` ثبت می‌شوند
     - `holdingQuantityAtRecord` = تعداد سهم در تاریخ `recordDate` (نه تعداد فعلی)
   - **MUST** ایجاد Income Transaction در `acc_transactions` با مبلغ `netAmount`:
     ```
     acc_transactions {
       type: 'deposit-income',
       relatedFeature: 'stocks_iran',
       relatedId: dividend_transaction_id,
       amount: netAmount,
       date: paymentDate,
       description: "Dividend: [symbol] — ناخالص [grossAmount] ریال، مالیات [taxAmount] ریال"
     }
     ```
   - اگر `taxAmount > 0`: یک رکورد در `tax_records` ثبت و `inv_stocks_iran_dividends.taxEntryId` پر می‌شود
   - Dividend در `calculateProfitLoss()` (realized/unrealized) لحاظ نمی‌شود — فقط درآمد است
   - گزارش بازده واقعی: `yieldPerShare = grossAmountPerShare`، `totalYield = grossAmount`، `netYield = netAmount`

7b. **افزایش سرمایه از اندوخته — سهام جایزه (`capital_increase_reserve`)**:
   - `quantity += newShares` در Holding
   - `totalInvested` بدون تغییر می‌ماند (پولی پرداخت نشده)
   - `averageBuyPrice = totalInvested / newQuantity` ← کاهش می‌یابد
   - درآمد مالیاتی محسوب نمی‌شود؛ فقط Holding آپدیت می‌شود

7c. **افزایش سرمایه از آورده نقدی — حق تقدم (`capital_increase_cash`)**:
   - کاربر سه انتخاب دارد: (۱) خرید حق تقدم در بازار، (۲) فروش حق تقدم، (۳) اعمال حق تقدم (پرداخت ۱۰۰۰ ریال/سهم و تبدیل به سهم اصلی)
   - برای هر انتخاب یک رکورد با نوع متناظر ثبت می‌شود (`rights_issue`, `rights_sold`, `rights_exercised`)
   - `rights_exercised`: `totalAmount = quantity × 1000 (اسمی)` از `cashBalance` کارگزاری کسر و به Holding سهم اصلی اضافه می‌شود

7d. **تجزیه سهم (`stock_split`) و ادغام سهم (`reverse_split`)**:
   - `quantity *= splitRatio` (یا `/= splitRatio`)
   - `averageBuyPrice /= splitRatio` (یا `*= splitRatio`)
   - `totalInvested` بدون تغییر — این مهم‌ترین نکته است: ارزش سرمایه‌گذاری عوض نمی‌شود
   - `realizedPL` تاریخی بدون تغییر می‌ماند

7e. **تغییر نماد (`ticker_change`)**:
   - Holding قدیمی با `isActive = false` و `closedAt = date` بسته می‌شود
   - Holding جدید با نماد جدید، همان `totalInvested`، همان `averageBuyPrice`، همان `quantity` باز می‌شود
   - `newSymbol` در رکورد تراکنش برای traceability ذخیره می‌شود

7f. **انتقال سهم (`transfer_in` / `transfer_out`)**:
   - `transfer_in`: فیلد `costBasis` اجباری است — بهای تمام‌شده تاریخی سهم در کارگزاری قبلی باید وارد شود تا `averageBuyPrice` و `totalInvested` صحیح باشد
   - `transfer_out`: `realizedPL`ای ثبت نمی‌شود (انتقال است نه فروش)

7g. **توقف/بازگشایی نماد (`halt`/`resume`)**:
   - صرفاً لاگ رویداد؛ هیچ تأثیری روی Holding ندارد
   - می‌توان در UI نماد‌های متوقف را با آیکون خاص نشان داد
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
- `symbol` → string (نماد سهم — **نماد جاری**؛ در صورت `ticker_change`، Holding قدیمی بسته و جدید با نماد جدید ساخته می‌شود)
- `name` → string (نام شرکت)
- `quantity` → decimal (تعداد سهم)
- `averageBuyPrice` → decimal (میانگین قیمت خرید — ریال)
- `totalInvested` → decimal
- `totalFeesPaidBase` → decimal (مجموع تجمیعی تمام کارمزدهای پرداخت‌شده، پس از تبدیل هر کارمزد به **ارز پایه کاربر** (`baseCurrency`) با `exchangeRateToBase` همان تراکنش — صرف‌نظر از اینکه کارمزد به IRR یا USDT پرداخت شده)
- `isActive` → boolean (پیش‌فرض: `true`؛ در `ticker_change` برای Holding قدیمی `false` می‌شود)
- `closedAt` → datetime (nullable — تاریخ بسته‌شدن Holding در `ticker_change`)
- `createdAt` → datetime
- `updatedAt` → datetime

> **نکته**: این جدول فقط برای خرید و فروش سهام است. موجودی نقدی کارگزاری در فیلد `cashBalance` از جدول `inv_stocks_iran_brokerages` نگهداری می‌شود (برای سرعت بالا). این موجودی **در `Portfolio & Wealth Overview` با `includeCashInWealth = false` به‌طور پیش‌فرض لحاظ نمی‌شود** تا از شمارش دوگانه (چون همان پول از حساب بانکی آمده) جلوگیری شود.
> 
> **کوئری پیشنهادی برای Holding فعال**: همیشه `WHERE isActive = true` فیلتر کنید تا Holdingهای بسته‌شده (ناشی از `ticker_change`) در محاسبات لحاظ نشوند.

### ۳. Stock Transaction (جدول: `inv_stocks_iran_transactions`) — لاگ خرید، فروش، و Corporate Actions

- `id` → UUID (Primary Key)
- `brokerageId` → UUID
- `symbol` → string (نماد سهم در **لحظه تراکنش** — اهمیت دارد چون با `ticker_change` تغییر می‌کند)
- `type` → string (مقادیر مجاز — تعریف مرکزی در `core/types/types.md`):

  | مقدار | توضیح | اثر روی quantity | اثر روی averageBuyPrice |
  |---|---|---|---|
  | `buy` | خرید سهام | `+= quantity` | Weighted Average |
  | `sell` | فروش سهام | `-= quantity` | بدون تغییر |
  | `dividend` | سود نقدی | بدون اثر | بدون تغییر |
  | `capital_increase_cash` | افزایش سرمایه از محل آورده نقدی — کاربر حق تقدم دارد و می‌تواند بخرد یا بفروشد | در صورت خرید `+= quantity` | Weighted Average (قیمت خرید حق تقدم × quantity جدید) |
  | `capital_increase_reserve` | افزایش سرمایه از محل اندوخته — سهام جایزه (Bonus Shares) — بدون پرداخت | `+= quantity` | `totalInvested` ثابت می‌ماند → `averageBuyPrice = totalInvested / newQuantity` |
  | `rights_issue` | حق تقدم دریافت‌شده — ایجاد موقعیت حق تقدم در پرتفوی | `+= quantity` در نماد حق تقدم | Weighted Average با قیمت اعمال |
  | `rights_sold` | فروش حق تقدم (بدون استفاده از آن) | `-= quantity` از نماد حق تقدم | — |
  | `rights_exercised` | تبدیل حق تقدم به سهم اصلی | `-= quantity` از نماد حق تقدم + `+= quantity` در نماد اصلی | Weighted Average در نماد اصلی |
  | `stock_split` | تجزیه سهم — تعداد ضرب، قیمت تقسیم می‌شود | `quantity *= splitRatio` | `averageBuyPrice /= splitRatio`، `totalInvested` بدون تغییر |
  | `reverse_split` | ادغام سهم — تعداد تقسیم، قیمت ضرب | `quantity /= splitRatio` | `averageBuyPrice *= splitRatio`، `totalInvested` بدون تغییر |
  | `ticker_change` | تغییر نماد شرکت | بدون تغییر در quantity | Holding قدیمی بسته، Holding جدید با همان `totalInvested`/`averageBuyPrice` باز می‌شود |
  | `transfer_in` | انتقال سهم از کارگزاری دیگر به این کارگزاری | `+= quantity` | Weighted Average با `costBasis` اعلام‌شده |
  | `transfer_out` | انتقال سهم به کارگزاری دیگر | `-= quantity` | بدون تغییر در averageBuyPrice باقیمانده |
  | `halt` | توقف نماد | بدون اثر روی اعداد | صرفاً لاگ وضعیت |
  | `resume` | بازگشایی نماد | بدون اثر روی اعداد | صرفاً لاگ وضعیت |
  | `subscription` | پذیره‌نویسی (خرید سهام شرکت در مرحله عرضه اولیه یا پذیره‌نویسی ثانوی) | `+= quantity` | Weighted Average |

- `quantity` → decimal (nullable — برای `dividend`, `halt`, `resume`, `ticker_change` مقدار `null`)
- `price` → decimal (nullable — قیمت هر سهم در لحظه تراکنش؛ برای `capital_increase_reserve`, `halt`, `resume`, `ticker_change` مقدار `null`)
- `totalAmount` → decimal (مبلغ کل — برای `dividend`: مبلغ سود نقدی؛ برای `buy`/`sell`: `quantity × price`)
- `feeAmount` → decimal (پیش‌فرض: `0`)
- `feeCurrency` → string
- `exchangeRateToBase` → decimal (نرخ تتر لحظه معامله)
- `splitRatio` → decimal (nullable — فقط برای `stock_split` و `reverse_split`؛ مثلاً `2` یعنی ۱ سهم → ۲ سهم)
- `newSymbol` → string (nullable — فقط برای `ticker_change`؛ نماد جدید)
- `costBasis` → decimal (nullable — فقط برای `transfer_in`؛ بهای تمام‌شده تاریخی سهام در کارگزاری قبلی)
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

### ۵. Dividend Record (جدول: `inv_stocks_iran_dividends`) — سود نقدی با جزئیات کامل

برای پشتیبانی از گزارش‌های سود سرمایه‌گذاری، درآمد، مالیات، و بازده واقعی، سود نقدی علاوه بر یک رکورد در `inv_stocks_iran_transactions`، در این جدول مستقل هم ذخیره می‌شود تا تمام جزئیات مالی و تاریخی قابل گزارش‌گیری باشد.

- `id` → UUID (Primary Key)
- `brokerageId` → UUID
- `symbol` → string (نماد سهم)
- `holdingQuantityAtRecord` → decimal (**تعداد سهم در تاریخ `recordDate`** — برای محاسبه بازده واقعی per-share الزامی است؛ نه تعداد فعلی)
- `grossAmountPerShare` → decimal (سود ناخالص به ازای هر سهم — ریال)
- `grossAmount` → decimal (`grossAmountPerShare × holdingQuantityAtRecord`)
- `taxRate` → decimal (nullable — نرخ مالیات کسر‌شده به درصد، مثلاً `5.0` برای ۵٪؛ اگر معاف از مالیات باشد `0` و اگر نامشخص باشد `null`)
- `taxAmount` → decimal (nullable — مبلغ مالیات کسر‌شده: `grossAmount × taxRate / 100`)
- `netAmount` → decimal (**مبلغ واقعی دریافتی** = `grossAmount - taxAmount`؛ این مقدار به `cashBalance` کارگزاری اضافه می‌شود)
- `exDate` → date (nullable — آخرین روزی که با خرید سهام، مشمول دریافت این سود می‌شوید)
- `recordDate` → date (nullable — تاریخ ثبت سهامداران واجد شرایط — برای محاسبه `holdingQuantityAtRecord`)
- `paymentDate` → date (**تاریخ واقعی پرداخت سود** — این تاریخ در `acc_transactions` و `inv_stocks_iran_transactions` استفاده می‌شود)
- `source` → enum (`bourse_announcement`, `brokerage_statement`, `manual`) — منبع اطلاعات سود
- `transactionId` → UUID (لینک به `inv_stocks_iran_transactions.id` با `type='dividend'`)
- `accountingEntryId` → UUID (لینک به `acc_transactions.id` — Income entry)
- `taxEntryId` → UUID (nullable — لینک به `tax_records.id` اگر مالیات این سود در Tax Management پیگیری شود)
- `description` → string (nullable)
- `createdAt` → datetime

> **رابطه با `inv_stocks_iran_transactions`**:
> - یک رکورد `type='dividend'` در `inv_stocks_iran_transactions` همیشه با یک رکورد در `inv_stocks_iran_dividends` همراه است (یک‌به‌یک).
> - `inv_stocks_iran_transactions.totalAmount` = همان `netAmount` در این جدول (مبلغ واقعی دریافتی).
> - اگر به جزئیات `gross`/`tax` نیازی نباشد (مثلاً برای ورودی سریع)، `taxRate=0` و `taxAmount=0` ست می‌شود و `grossAmount = netAmount`.

### ۶. acc_transactions

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
- `createStockTransaction(data)` → خرید / فروش (`type = 'buy'` یا `'sell'`)
- `createBrokerageTransaction(data)` → واریز (`type='deposit-investment'`) / برداشت (`type='withdrawal-investment'`) + لینک به حساب بانکی
- **`recordDividend(data)` — سود نقدی کامل**
  ```typescript
  interface RecordDividendInput {
    brokerageId: UUID
    symbol: string
    grossAmountPerShare: Decimal   // سود ناخالص هر سهم (ریال)
    holdingQuantityAtRecord: Decimal // تعداد سهم در تاریخ recordDate (اجباری)
    taxRate?: Decimal              // نرخ مالیات درصدی (پیش‌فرض: 0)
    exDate?: date                  // آخرین تاریخ مشمولیت خرید
    recordDate?: date              // تاریخ ثبت سهامداران
    paymentDate: date              // تاریخ واقعی پرداخت (اجباری)
    source: 'bourse_announcement' | 'brokerage_statement' | 'manual'
    description?: string
  }
  ```

  **Process** (atomic — همه یا هیچ):
  ```
  grossAmount = grossAmountPerShare × holdingQuantityAtRecord
  taxAmount   = grossAmount × (taxRate ?? 0) / 100
  netAmount   = grossAmount - taxAmount

  1. CREATE inv_stocks_iran_transactions {
       type: 'dividend', brokerageId, symbol,
       totalAmount: netAmount,  // مبلغ واقعی دریافتی
       date: paymentDate
     }

  2. CREATE acc_transactions {
       type: 'deposit-income',
       relatedFeature: 'stocks_iran',
       relatedId: step1.id,
       amount: netAmount,
       date: paymentDate,
       description: "Dividend: " + symbol + " — ناخالص " + grossAmount + "، مالیات " + taxAmount
     }

  3. IF taxAmount > 0:
     CREATE tax_records {
       type: 'dividend_withholding',
       relatedFeature: 'stocks_iran',
       relatedId: step1.id,
       amount: taxAmount,
       date: paymentDate,
       status: 'paid'   // مالیات تکلیفی — از قبل کسر شده
     }

  4. CREATE inv_stocks_iran_dividends {
       brokerageId, symbol,
       holdingQuantityAtRecord,
       grossAmountPerShare, grossAmount,
       taxRate: taxRate ?? 0, taxAmount, netAmount,
       exDate, recordDate, paymentDate, source,
       transactionId: step1.id,
       accountingEntryId: step2.id,
       taxEntryId: step3.id (nullable)
     }

  5. UPDATE inv_stocks_iran_brokerages { cashBalance += netAmount }

  6. RETURN { dividendId: step4.id, transactionId: step1.id,
              grossAmount, taxAmount, netAmount }
  ```

### Corporate Action APIs

- `applyBonusShares(holdingId, newShares, date, description?)` → `capital_increase_reserve`
  - `quantity += newShares`، `totalInvested` ثابت، `averageBuyPrice = totalInvested / newQuantity`

- `applyStockSplit(holdingId, splitRatio, date, description?)` → `stock_split` (و `reverse_split` با `splitRatio < 1`)
  - `quantity *= splitRatio`، `averageBuyPrice /= splitRatio`، `totalInvested` ثابت

- `applyTickerChange(holdingId, newSymbol, newName, date, description?)` → `ticker_change`
  - Holding قدیمی: `isActive = false`، `closedAt = date`
  - Holding جدید با نماد جدید و همان `quantity`/`averageBuyPrice`/`totalInvested` ساخته می‌شود

- `recordRightsIssue(brokerageId, symbol, rightsQuantity, exercisePrice, expiryDate, description?)` → `rights_issue`
  - یک Holding موقت برای نماد حق تقدم (`symbol + 'ح'` در بورس ایران) ساخته می‌شود

- `recordRightsSold(holdingId, quantity, price, date, description?)` → `rights_sold`
  - فروش حق تقدم → Realized P&L محاسبه می‌شود (با `costBasis = 0` چون حق تقدم رایگان دریافت شده)

- `recordRightsExercised(rightsHoldingId, stockHoldingId, quantity, date, description?)` → `rights_exercised`
  - `quantity` از Holding حق تقدم کم می‌شود
  - `quantity` به Holding سهم اصلی اضافه می‌شود با `price = 1000` (ارزش اسمی پرداخت‌شده)
  - `totalAmount = quantity × 1000` از `cashBalance` کارگزاری کسر می‌شود

- `recordTransferIn(brokerageId, symbol, quantity, costBasis, date, description?)` → `transfer_in`
  - **`costBasis` اجباری است** — بدون بهای تمام‌شده تاریخی، `averageBuyPrice` نادرست خواهد بود

- `recordTransferOut(holdingId, quantity, date, description?)` → `transfer_out`
  - `realizedPL` صفر (انتقال نه فروش)، `quantity` کاهش می‌یابد

- `getStockTransactions(filters)`
- `getBrokerageTransactions(filters)` → برای واریز/برداشت
- `calculateProfitLoss(symbol?, brokerageId?)`
- `getDividends(filters?)` → لیست سودهای نقدی از `inv_stocks_iran_dividends` با فیلتر symbol/brokerage/dateRange
- `getDividendSummary(symbol?, dateRange?)` → خلاصه: `totalGross`, `totalTax`, `totalNet`, `yieldBySymbol[]`

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

**اثر Corporate Actions بر `averageBuyPrice` و `totalInvested`**:

| رویداد | اثر روی `quantity` | اثر روی `totalInvested` | اثر روی `averageBuyPrice` |
|---|---|---|---|
| `capital_increase_reserve` (سهام جایزه) | `+= bonusShares` | **ثابت** | `= totalInvested / newQuantity` ← کاهش |
| `stock_split` (تجزیه) | `*= splitRatio` | **ثابت** | `/ = splitRatio` ← کاهش |
| `reverse_split` (ادغام) | `/= splitRatio` | **ثابت** | `*= splitRatio` ← افزایش |
| `rights_exercised` (اعمال حق تقدم) | `+= quantity` (در نماد اصلی) | `+= quantity × 1000` | Weighted Average مجدد |
| `transfer_in` | `+= quantity` | `+= costBasis` | Weighted Average با `costBasis` |
| `ticker_change` | Holding قدیمی بسته، Holding جدید مساوی باز | Holding جدید: مساوی Holding قدیمی | Holding جدید: مساوی Holding قدیمی |

> **قانون طلایی**: `totalInvested` در همه Corporate Actions که «سهام رایگان» می‌دهند (سهام جایزه، split) **ثابت** می‌ماند. فقط در رویدادهایی که پول واقعی جابه‌جا می‌شود (`rights_exercised`، `transfer_in`) تغییر می‌کند.

> **نکات الزامی**:
> - تمام محاسبات بالا باید با `decimal.js` انجام شوند (هرگز `Number`).
> - `calculateProfitLoss(symbol?, brokerageId?)` مجموع `realizedPL` تمام تراکنش‌های فروش (`type=sell`) و فروش حق تقدم (`type=rights_sold`) را برمی‌گرداند؛ `dividend` و Corporate Actions دیگر هرگز در این مجموع نیستند.
> - سود/زیان **تحقق‌نیافته** (Unrealized) جداگانه بر اساس `(getLatestPrice('stock', symbol, baseCurrency).price - averageBuyPrice) × quantity` محاسبه می‌شود (طبق فیچر `19-Price-Fetching`) و نباید با Realized P&L مخلوط شود.

---

## نکات طراحی

- این زیر‌فیچر مخصوص **سهام بورس ایران** است.
- همه چیز به ریال است، اما نرخ تتر در هر رکورد ذخیره می‌شود.
- میانگین خرید با Weighted Average محاسبه می‌شود.
- کارمزدها هم به ریال و هم معادل تتری ثبت می‌شوند.
- موجودی نقدی کارگزاری جدا از موجودی سهام مدیریت می‌شود.
- **قیمت لحظه‌ای سهام (برای Unrealized P&L)** از فیچر `19-Price-Fetching` (جدول `price_history` با `assetCategory='stock'`) خوانده می‌شود؛ این فیچر مستقیماً به API بیرونی وصل نمی‌شود — فقط `getLatestPrice('stock', symbol)` را صدا می‌زند.
- در آینده زیر‌فیچر جداگانه‌ای برای سهام خارجی اضافه خواهد شد.