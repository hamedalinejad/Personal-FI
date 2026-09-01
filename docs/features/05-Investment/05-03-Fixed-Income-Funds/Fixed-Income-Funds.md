> **Invariant:** `NAV ≠ transactionPrice`؛ valuation و تحقق می‌توانند redemption/subscription جدا داشته باشند.

نام زیر‌فیچر: Investment - Fixed Income Funds (صندوق‌های درآمد ثابت)
توضیح کلی:
این زیر‌فیچر مدیریت سرمایه‌گذاری در صندوق‌های درآمد ثابت ایران را پوشش می‌دهد.

### انواع اصلی صندوق‌ها از نظر پرداخت سود:

| نوع | نحوه سوددهی | رفتار قیمت (NAV) |
|------|--------------|------------------|
| با تقسیم سود (Distribution) | سود نقدی دوره‌ای (معمولاً ماهانه) به حساب سرمایه‌گذار واریز می‌شود | اغلب پس از تقسیم سود، قیمت به نزدیک قیمت پایه برمی‌گردد |
| بدون تقسیم سود (Accumulation) | سود به NAV اضافه می‌شود و قیمت واحد هر روز رشد می‌کند | NAV به صورت روزشمار افزایش می‌یابد |

### سایر ویژگی‌های مهم:

- سود تقریباً همیشه روزشمار محاسبه می‌شود (حتی در تعطیلات).
- سود پیش‌بینی‌شده اعلام می‌شود ولی سود واقعی ممکن است متفاوت باشد و باید قابل پیگیری باشد.
- برخی صندوق‌ها امکان سرمایه‌گذاری مجدد سود (خرید واحد جدید از محل سود) را می‌دهند.
- دو روش معامله: صدور و ابطالی و ETF (قابل معامله در بورس).

مبالغ به **ارز معامله** (معمولاً IRR برای صندوق‌های ایران) ثبت می‌شوند؛ `exchangeRateToBase` نرخ تبدیل به **baseCurrency کاربر** است — نه hard-code ریال/تتر.

User Stories
Must Have:

- ثبت صندوق درآمد ثابت (نام، نوع سوددهی، روش معامله، سود پیش‌بینی‌شده)
- خرید واحد (صدور یا خرید از بورس)
- فروش/ابطال واحد
- ثبت دریافت سود نقدی (تقسیم سود)
- ثبت سرمایه‌گذاری مجدد سود (خرید واحد جدید از محل سود)
- مشاهده تعداد واحد، میانگین خرید و ارزش فعلی
- پیگیری سود پیش‌بینی‌شده در مقابل سود واقعی (فقط در تراکنش‌های nav_update و dividend)
- واریز/برداشت مرتبط با حساب بانکی یا کارگزاری
- ذخیره `exchangeRateToBase` هر رویداد (ارز معامله → baseCurrency)
- ثبت کارمزد (با `feeAmount` + `feeCurrency` + `exchangeRateToBase`)

Should Have:

- ثبت روزانه/دوره‌ای تغییرات NAV
- هشدار تاریخ تقسیم سود
- گزارش بازدهی روزشمار و سالانه‌شده


Business Rules

- ارز معامله روی تراکنش (`currency`)؛ `exchangeRateToBase` → baseCurrency کاربر. پیش‌فرض صندوق‌های ایران اغلب IRR است ولی مدل multi-currency است.
- خرید واحد:
 - موجودی نقدی (حساب بانکی یا کارگزاری) کاهش می‌یابد.
 - تعداد واحد (`units`) افزایش می‌یابد و میانگین خرید بر اساس `transactionPrice` (قیمت صدور) به‌روزرسانی می‌شود.
 - فیلد `nav` (NAV همان روز) برای snapshot تاریخی توصیه می‌شود ولی مبنای میانگین خرید نیست.
 - در صندوق‌های ETF، `brokerageId` در `inv_fif_holdings` و `inv_fif_transactions` پر می‌شود.
 - `units` نمی‌تواند منفی شود.
 - در صورت خرید از کارگزاری، `cashBalance` در `inv_stocks_iran_brokerages` کاهش می‌یابد.
- فروش/ابطال واحد:
 - تعداد واحد کاهش می‌یابد.
 - مبلغ حاصل بر اساس `transactionPrice` (قیمت ابطال) به موجودی نقدی (کارگزاری یا حساب بانکی) اضافه می‌شود.
 - Realized P&L با مقایسه `transactionPrice` فروش و `averageBuyPrice` محاسبه می‌شود.
 - `units` نمی‌تواند منفی شود.
 - در صورت فروش به کارگزاری، `cashBalance` در `inv_stocks_iran_brokerages` افزایش می‌یابد.
- تقسیم سود نقدی:
 - مبلغ سود به عنوان درآمد ثبت می‌شود.
 - در صندوق‌های با تقسیم سود، معمولاً NAV به نزدیک قیمت پایه برمی‌گردد.
 - `predictedProfit` در این تراکنش می‌تواند پر شود (برای مقایسه با سود واقعی).
- سرمایه‌گذاری مجدد سود:
 - به جای دریافت نقدی، تعداد واحد جدید خریداری و به Holding اضافه می‌شود.
 - `predictedProfit` در این تراکنش نیز می‌تواند پر شود.
- سود پیش‌بینی‌شده فقط برای نمایش و مقایسه است؛ سود واقعی از طریق تراکنش‌ها و تغییرات NAV پیگیری می‌شود.
- کارمزدها با `feeAmount` + `feeCurrency` + `exchangeRateToBase` ثبت می‌شوند.
- موجودی حساب بانکی نمی‌تواند منفی شود.
- **ویرایش/حذف معاملات**: تراکنش‌های صندوق پس از ثبت غیرقابل ویرایش هستند. برای اصلاح یا حذف:
 - تراکنش اصل ذخیره می‌ماند (`isVoided = true` در `acc_transactions`)
 - تراکنش‌های معکوس (Reversal) ثبت می‌شوند تا موجودی‌ها و میانگین خرید درست شوند
 - این رویکرد تاریخچه معاملات و محاسبات سود/زیان را حفظ می‌کند

> **نکته طراحی**: برای ETFها، تمام واریز/برداشت‌ها از طریق کارگزاری انجام می‌شوند. بنابراین:
> - در `inv_fif_holdings`, `brokerageId` لینک به کارگزاری است
> - در `inv_fif_transactions`, `brokerageId` برای واریز/برداشت ETF پر می‌شود
> - در صورت واریز/برداشت مستقیم از حساب بانکی، `accountId` پر می‌شود
>
> **نکته مهم - جریان پول صندوق‌های issuance_redemption**:
> - برای صندوق‌های issuance_redemption (صدور و ابطالی)، تمام معاملات از طریق حساب بانکی کاربر انجام می‌شود
> - در `inv_fif_holdings`, `brokerageId` nullable است (چون این صندوق‌ها از طریق کارگزاری نیستند)
> - در `inv_fif_transactions`, `accountId` حتماً پر می‌شود (چون واریز/برداشت از حساب بانکی است)
> - در خرید issuance_redemption: `accountId` پر می‌شود و `brokerageId` nullable است
> - در فروش issuance_redemption: مبلغ به `accountId` واریز می‌شود و `accountId` پر می‌شود
> - تراکنش‌ها در `acc_transactions` با `type = 'deposit-investment'` یا `type = 'withdrawal-investment'` ثبت می‌شوند

> **نکته مهم — لینک به `acc_transactions`**:
>
> | نوع صندوق | relatedFeature در acc_transactions | relatedId |
> |-----------|-----------------------------------|-----------|
> | **issuance_redemption** | `'fif'` | `inv_fif_transactions.id` |
> | **ETF** | `'stocks_iran'` | `inv_stocks_iran_brokerage_transactions.id` |
>
> دلیل: ETFها از طریق کارگزاری خرید/فروش می‌شوند، پس جریان پول دقیقاً مانند سهام ایران است و از `inv_stocks_iran_brokerage_transactions` عبور می‌کند. صندوق‌های issuance_redemption مستقیماً از حساب بانکی هستند و `relatedFeature = 'fif'` می‌گیرند.


Domain Entities
۱. Fixed Income Fund (جدول: `inv_fif_funds`)

- `id` → UUID (Primary Key)
- `name` → string (نام صندوق)
- `symbol` → string (نماد — در صورت ETF، برای issuance_redemption nullable است)
- `fundType` → string (issuance_redemption یا etf)
- `profitType` → string (distribution یا accumulation)
- `predictedAnnualRate` → decimal (سود پیش‌بینی‌شده سالانه — درصد)
- `distributionPeriod` → string (monthly, quarterly, none)
- `basePrice` → decimal (قیمت پایه — nullable)
- `platform` → string (سایت صندوق یا کارگزاری)
- `url` → string
- `description` → string
- `isActive` → boolean
- `createdAt` → datetime
- `updatedAt` → datetime

> **نکته**: برای صندوق‌های ETF، `symbol` نماد بورسی است. برای صندوق‌های issuance_redemption (صدور و ابطالی)، `symbol` nullable است زیرا این صندوق‌ها در بورس معامله نمی‌شوند.

۲. Fixed Income Holding (جدول: `inv_fif_holdings`)

- `id` → UUID (Primary Key)
- `fundId` → UUID
- `brokerageId` → UUID (nullable — لینک به کارگزاری برای ETFها)
- `units` → decimal (تعداد واحد فعلی)
- `averageBuyPrice` → decimal (میانگین قیمت **خرید/صدور** بر اساس `transactionPrice` تراکنش‌های buy/reinvest)
- `totalInvested` → decimal (مجموع سرمایه‌گذاری بر اساس قیمت واقعی خرید)
- `totalFeesPaidBase` → decimal (کارمزد تجمعی به baseCurrency — )
- `currentNAV` → decimal (آخرین **NAV** ثبت‌شده — فقط برای ارزش‌گذاری و Unrealized P&L؛ هرگز با قیمت صدور/ابطال قاطی نشود)
- `lastSubscriptionPrice` → decimal (nullable — آخرین قیمت صدور دیده‌شده)
- `lastRedemptionPrice` → decimal (nullable — آخرین قیمت ابطال دیده‌شده)
- `createdAt` → datetime
- `updatedAt` → datetime

> **تمایز حیاتی — سه مفهوم قیمت (هرگز قاطی نشوند)**:
> 1. `transactionPrice` = قیمت واقعی صدور/ابطال کاربر (cost basis / realized)
> 2. `NAV` / `currentNAV` = ارزش خالص واحد (valuation / unrealized NAV)
> 3. `externalReportedProfit` = سود اعلامی صندوق/صورتحساب — **EXTERNAL_REPORTED**؛ overwrite روی calculated ممنوع
>
> و مسیرهای بازده جدا (P0 برای صندوق درآمد ثابت ایران):
>
> | مفهوم | معنی | منبع |
> |--------|------|------|
> | Expected Return | سود/بازده پیش‌بینی‌شده (نمایش) | predicted / policy |
> | Actual Return | بازده محاسبه‌شده سیستم | engine از txs + NAV path |
> | Distributed Income | سود نقدی تقسیم‌شده به کاربر | type=dividend (cash) |
> | Reinvested Income | سود تبدیل به واحد | type=reinvest |
> | Unrealized NAV Gain | تغییر ارزش از NAV بدون الزام دریافت نقد | nav_update / mark |
>
> **مثال:** خرید ۱۰۰ واحد + رشد NAV ≠ لزوماً سود نقدی.  
> **مثال:** `dividend` ممکن است NAV را کاهش دهد در حالی که cash وارد می‌شود.  
> Engine باید **مسیر NAV** و **مسیر توزیع نقدی/سرمایه‌گذاری مجدد** را جدا نگه دارد.

> **نکته**: برای صندوق‌های ETF (که از بورس خرید می‌شوند)، `brokerageId` لینک به کارگزاری است. برای صندوق‌های issuance_redemption (که مستقیماً از صندوق خرید می‌شوند)، `brokerageId` nullable است.

> **نکته مهم - آپدیت cashBalance**:
> - در خرید ETF: `cashBalance -= (amount + fees)` در `inv_stocks_iran_brokerages`
> - در فروش ETF: `cashBalance += (amount - fees)` در `inv_stocks_iran_brokerages`
> - این قانون مانند `inv_stocks_iran_brokerages` در فیچر Stocks Iran است

۳. Fixed Income Transaction (جدول: `inv_fif_transactions`) — لاگ رویدادها

- `id` → UUID (Primary Key)
- `fundId` → UUID
- `brokerageId` → UUID (nullable — برای ETFها که از کارگزاری خرید می‌شوند)
- `type` → string (buy, sell, dividend, reinvest, nav_update)
- `units` → decimal (تعداد واحد — در buy/sell/reinvest؛ در nav_update و dividend معمولاً خالی)
- `nav` → decimal (nullable — **NAV** در تاریخ تراکنش؛ الزامی در nav_update؛ توصیه‌شده در buy/sell برای snapshot تاریخی)
- `transactionPrice` → decimal (nullable — **قیمت واقعی معامله**: قیمت صدور در buy/reinvest، قیمت ابطال در sell؛ در nav_update خالی می‌ماند)
- `amount` → decimal (مبلغ خالص معامله به `currency`؛ معمولاً `units × transactionPrice`)
- `currency` → string (ارز معامله — پیش‌فرض IRR برای صندوق ایران)
- `feeAmount` → decimal
- `feeCurrency` → string
- `feeCategory` → enum (`subscription` | `redemption` | `brokerage` | `management` | `other`) nullable
- `includeInCostBasis` → boolean (**اجباری روی tx جدید با fee**؛ پیش‌فرض: subscription/brokerage buy=true؛ redemption fee on sell=false برای cost و true به‌عنوان feeFromProceeds)
- `operationId` → UUID (**اجباری** برای atomic؛ reinvest و چند leg یکسان)
- `operationRole` → enum nullable (`dividend_income` | `reinvest_purchase` | `standalone`)
- `exchangeRateToBase` → decimal
- `predictedProfit` → decimal (nullable — فقط در nav_update و dividend؛ توسط کاربر هنگام ثبت وارد می‌شود برای مقایسه با سود واقعی محاسبه‌شده توسط `getProfitComparison`)
- `accountId` → UUID (nullable — برای واریز/برداشت مستقیم از حساب بانکی — issuance_redemption)
- `accountTransactionId` → UUID (لینک به acc_transactions)
- `description` → string
- `date` → datetime
- `createdAt` → datetime

> **تمایز قطعی فیلدهای قیمت**:
> | فیلد | نقش | استفاده |
> |------|-----|---------|
> | `nav` | ارزش خالص دارایی هر واحد | ارزش‌گذاری، Unrealized P&L، nav_update |
> | `transactionPrice` | قیمت واقعی خرید/فروش کاربر | میانگین خرید، Realized P&L، amount |
> | `feeAmount` | کارمزد جدا | کسر از سود |
>
> قوانین پر کردن:
> - `type = 'buy'` یا `'reinvest'`: `transactionPrice` = قیمت صدور؛ `nav` = NAV همان روز (توصیه می‌شود)
> - `type = 'sell'`: `transactionPrice` = قیمت ابطال؛ `nav` = NAV همان روز (توصیه می‌شود)
> - `type = 'nav_update'`: فقط `nav` پر می‌شود؛ `transactionPrice` و `units` و `amount` خالی
> - `type = 'dividend'`: معمولاً فقط مبلغ سود؛ `units`/`transactionPrice` خالی
>
> در صندوق‌های صدور/ابطال ایران، NAV و قیمت صدور و قیمت ابطال اغلب در یک روز با هم فرق دارند و **نباید** یکی فرض شوند.

> **نکته لینک `accountTransactionId`**:
> - برای ETFها: `accountTransactionId` لینک به رکوردی در `inv_stocks_iran_brokerage_transactions` **نیست** — بلکه لینک به `acc_transactions` است که خودش `relatedFeature = 'stocks_iran'` دارد.
> - برای issuance_redemption: `accountTransactionId` لینک به `acc_transactions` با `relatedFeature = 'fif'` است.

۴. acc_transactions

در واریز/برداشت و دریافت سود نقدی (در صورت واریز به حساب بانکی) استفاده می‌شود.


APIهای داخلی

createFund(data) / updateFund(id, data) / getAllFunds
createTransaction(data) → تک‌رویداد (buy/sell/nav_update/…). باید `operationId` داشته باشد.
createReinvest(data) → **الزامی دو ردیف** با یک `operationId`: (1) type=dividend + operationRole=dividend_income (2) type=reinvest + operationRole=reinvest_purchase — نه یک ردیف مبهم تنها.
واریز/برداشت ETF از طریق کارگزاری: APIهای Investment-Stocks-Iran.
updateNAV(fundId, nav, date) → ثبت NAV جدید (از نسخه ۱، این تابع یک Wrapper نازک روی `setManualFundNAV` فیچر `19-Price-Fetching` است تا NAV هم در `price_history` مرکزی و هم در `inv_fif_holdings.currentNAV` ثبت شود؛ جزئیات کامل در `19-03-Fund-NAV/Fund-NAV.md`)
getHoldings / getHoldingByFund(fundId)
getPortfolioValue → ارزش کل + معادل تتری
getProfitComparison(fundId, period) → مقایسه سود پیش‌بینی‌شده و واقعی (Derived — محاسبه در لحظه، نه Stored)

 **فرمول سود واقعی در بازه `period`**:
 ```
 سود واقعی =
 Σ amount تراکنش‌های dividend در بازه
 + unrealizedByMode(holding) ← see valuation mode below
 + realizedPL تراکنش‌های sell در بازه
 ```
 **فرمول سود پیش‌بینی‌شده در بازه `period`**:
 ```
 Σ predictedProfit تراکنش‌های nav_update و dividend در بازه
 ```
 خروجی: `{ predicted: Decimal, actual: Decimal, delta: Decimal, period }`

 > `actualProfit` به‌صورت ستون ذخیره‌شده در `inv_fif_transactions` وجود **ندارد** — سود واقعی همیشه در لحظه از تراکنش‌های `dividend`، تغییرات NAV، و `sell`ها محاسبه می‌شود. این جدول فقط لاگ است.
calculateProfitLoss(fundId?) → سود/زیان تحقق‌یافته از فروش/ابطال واحد (جدا از سود تقسیمی — به بخش «منطق محاسبه سود/زیان تحقق‌یافته» مراجعه شود)


روابط با سایر فیچرها

Accounts & Banking: واریز، برداشت و دریافت سود نقدی
Currency & Multi-Currency: نرخ تتر لحظه‌ای
Reports / Dashboard / Portfolio: ارزش پرتفوی و بازدهی



## Return / Price Paths (P0 — قاطی نشوند)

```text
Transaction Price     →  cost basis, realized on redeem
NAV                   →  valuation, unrealized NAV gain/loss
External Reported Profit →  EXTERNAL_REPORTED (statement) — never silent overwrite calculated*

Expected Return       →  display / compare only
Actual Return         →  system calculated
Distributed Income    →  dividend cash event
Reinvested Income     →  reinvest units event
Unrealized NAV Gain   →  NAV path without cash distribution
```

`nav_update` بدون cash ≠ `dividend`.  
`dividend` می‌تواند با کاهش NAV همراه باشد؛ این دو event جدا ثبت می‌شوند (یا یک atomic op با دو leg صریح).

## منطق محاسبه سود/زیان تحقق‌یافته (Realized P&L)

فرمول رسمی برای `calculateProfitLoss` و به‌روزرسانی Holding هنگام خرید/فروش یا ابطال واحد (مستقل از سود تقسیمی نقدی که در Business Rules جداگانه توضیح داده شده).

> **قانون اصلی**: محاسبات خرید و میانگین و Realized P&L همیشه بر اساس `transactionPrice` (قیمت واقعی صدور/ابطال) انجام می‌شود. `nav` فقط برای ارزش‌گذاری و Unrealized P&L استفاده می‌شود.

**هنگام خرید/صدور واحد یا سرمایه‌گذاری مجدد سود** (Weighted Average):
```
cost = (unitsBought × transactionPrice) + feeAmount
newTotalInvested = totalInvested + cost
newUnits = units + unitsBought
newAverageBuyPrice = newTotalInvested / newUnits
```
(در صورت وجود، `lastSubscriptionPrice` را با `transactionPrice` به‌روز کنید.)

**هنگام فروش/ابطال واحد** (`averageBuyPrice` استفاده‌شده = میانگین خرید **قبل از این فروش**):
```
soldPortionCost = unitsSold × averageBuyPrice
saleProceeds = unitsSold × transactionPrice // قیمت ابطال واقعی
realizedPL = saleProceeds - soldPortionCost - feeAmount
totalInvested -= soldPortionCost // کاهش متناسب با بخش فروخته‌شده
units -= unitsSold
averageBuyPrice بدون تغییر می‌ماند // Weighted Average فقط با خرید/صدور جدید تغییر می‌کند
```
(در صورت وجود، `lastRedemptionPrice` را با `transactionPrice` به‌روز کنید.)

> **نکات الزامی**:
> - تمام محاسبات بالا باید با `decimal.js` انجام شوند (هرگز `Number`).
> - سود تقسیمی نقدی (`dividend`) بخشی از `realizedPL` نیست؛ به‌عنوان درآمد جداگانه ثبت می‌شود (طبق Business Rules).
> - `calculateProfitLoss(fundId?)` فقط مجموع `realizedPL` تراکنش‌های `type=sell` را برمی‌گرداند.
> - **Unrealized پیش‌فرض issuance/redemption:** `liquidationValue - totalInvested` با `liquidationValue = units × lastRedemptionPrice` (یا redemption روز).
> - **Unrealized حالت nav:** `(currentNAV - averageBuyPrice) × units` فقط وقتی `valuationMode='nav'` صریح انتخاب شود.
> - ETF: `(marketPrice - averageBuyPrice) × units`.


نکات طراحی

سود روزشمار با فرمول تقریبی:
$ \text{سود} = \dfrac{\text{سرمایه} \times \text{نرخ سالانه} \times \text{تعداد روز}}{365} $

در صندوق‌های Distribution پس از تقسیم سود، امکان ثبت بازگشت NAV به قیمت پایه وجود دارد.
سرمایه‌گذاری مجدد سود به صورت تراکنش reinvest ثبت و واحد جدید به Holding اضافه می‌شود.
این زیر‌فیچر مخصوص صندوق‌های درآمد ثابت ایران است.

> **Tax:** فقط `linkedTaxEventId` به `tax_events`. فیلدهای metadata محلی deprecated. Reversal/correction صندوق = `core.reverseOperation(operationId)` نه void تنها.

> **exchangeRateToBase**: همیشه نرخ ارز تراکنش → `baseCurrency` کاربر است، نه الزاماً ریال/تتر. قرارداد در `Currency-CrossRate.md`.

---

## حساب منبع پول برای صدور/ابطال

`inv_fif_holdings` می‌تواند units را aggregate کند، ولی **منبع پول هر معامله** روی `inv_fif_transactions.accountId` (اجباری برای `fundType=issuance_redemption`) حفظ می‌شود.

قوانین:
1. خرید/ابطال issuance بدون `accountId` ممنوع است.
2. اگر کاربر همان صندوق را از دو حساب بخرد، Holding می‌تواند یکی بماند؛ تاریخچه per-account از ledger تراکنش‌ها و `acc_transactions` بازیابی می‌شود.
3. برای Audit/Report «از کدام حساب خرید شده» باید از transactions استفاده شود نه فقط Holding.
4. Should Have: نمای تفکیک units per account از Σ تراکنش‌ها (بدون اجباری کردن Holding جدا per account در v1).

---

## Cost Basis و کارمزد صندوق

`transactionPrice` = قیمت واحد (صدور/ابطال). **Cost basis تحصیل** ممکن است fee داشته باشد.

### طبقه‌بندی کارمزد
| نوع | فیلد پیشنهادی / feeCategory | وارد Cost Basis؟ | رفتار حسابداری |
|-----|------------------------------|------------------|----------------|
| کارمزد صدور / subscription | `subscription` | **بله** (پیش‌فرض) | به `totalInvested` اضافه می‌شود |
| کارمزد خرید کارگزاری (ETF) | `brokerage` | **بله** (پیش‌فرض) | به `totalInvested` |
| کارمزد ابطال / redemption | `redemption` | **خیر** — از عایدی فروش کم می‌شود | expense روی realized |
| کارمزد نگهداری دوره‌ای | `management` / periodic | معمولاً **expense** جدا (نه averageBuy) | در صورت کسر از units طبق قرارداد صندوق مستند شود |

### فرمول
```text
buy/reinvest:
 unitsCost = units × transactionPrice
 feesInBasis = Σ feeAmount (where includeInCostBasis=true) // به همان currency یا تبدیل‌شده
 totalInvested += unitsCost + feesInBasis
 averageBuyPrice = totalInvested / units // یا فقط unitsCost/units اگر سیاست «قیمت واحد خالص» انتخاب شود — پیش‌فرض پروژه: totalInvested شامل feeهای includeInCostBasis

sell:
 grossProceeds = units × transactionPrice
 netProceeds = grossProceeds - redemptionFees
 costRemoved = averageBuyPrice × units // بر اساس basis قبلی
 realizedPL = netProceeds - costRemoved
```

- روی `inv_fif_transactions`: `feeAmount`, `feeCurrency`, **`includeInCostBasis` boolean**
- Unrealized: `(currentNAV - averageBuyPrice) × units` با همان تعریف average که basis را ساخت.


---

## راهنمای پیاده‌سازی

### APIها
- `createFund` / `buyUnits` / `sellUnits` / `registerDividend` / `reinvest` / `updateNAV`
- NAV فقط از Price Fetching / manual؛ `transactionPrice` مبنای basis خرید/ابطال
- issuance: `accountId` اجباری روی تراکنش

### Atomic buy
```text
validate cash (bank or brokerage)
INSERT inv_fif_transactions (transactionPrice, fees, includeInCostBasis)
update units + totalInvested + averageBuyPrice
journal + acc or brokerage cash
COMMIT → persist
```

### تست
issuance vs ETF path؛ fee in basis vs redemption fee؛ NAV ≠ transactionPrice

### مثال عددی NAV در برابر قیمت صدور

```
NAV روز: 1,000
قیمت صدور (subscription): 1,010
کارمزد صدور includeInCostBasis=true: 5,000 IRR
خرید 10 واحد:

units += 10
unitsCost = 10 × 1010 = 10,100
totalInvested += 10,100 + 5,000 = 15,100
averageBuyPrice = 15,100 / 10 = 1,510

Unrealized با NAV:
  (1000 - 1510) × 10 = -5,100
(نه با transactionPrice)
```

---

## Valuation و گزارش ارزش صندوق

دو متریک جدا — مخلوط نشوند:

| متریک | فرمول | کاربرد |
|--------|--------|--------|
| `navValue` | `units × currentNAV` | مقایسه با اعلامیه صندوق / tracking error |
| `estimatedRedemptionValue` | `units × lastRedemptionPrice` (یا قیمت ابطال روز) − fees تخمینی | ارزش تقریبی نقدشوندگی سرمایه‌گذار |

**Invariant:** UI/Portfolio برای «چقدر می‌توانم نقد کنم؟» پیش‌فرض `estimatedRedemptionValue` (issuance/redemption)؛ برای «ارزش اعلامی واحد» از `navValue`. ETF: معمولاً قیمت بازار آخرین معامله ≈ هر دو.

پارامتر API: `getFundPositionValue(holdingId, mode: 'nav' | 'redemption')`.

---

## Realized / Total Economic Return صندوق

**ممنوع** به‌عنوان تنها سود اقتصادی: `sellPrice - averageBuyPrice`.

```text
totalEconomicReturn(period) =
  Σ cash dividends (type=dividend, isVoided=false)
  + Σ realizedPL on sells (transactionPrice vs avg cost, after redemption fees)
  + unrealized (اختیاری، جدا برچسب): units × (markPrice - avg) با mark = NAV یا redemption طبق mode
```

بعد از distribution: NAV افت می‌کند؛ سود نقدی در leg dividend است — capital leg جدا گزارش شود.

---

## Reinvested Dividend — دو Event یک operationId

```text
BEGIN operationId=O
  1) Domain+Journal: dividend income
       Dr cash_or_receivable / Cr income   amount = dividend cash equivalent
  2) Domain+Journal: buy/reinvest units
       Dr fund_unit / Cr cash_or_receivable
       units += X; totalInvested += amount (includeInCostBasis طبق fee)
  fin_journal دو طرفه؛ در صورت bank: acc_transactions فقط اگر پول واقعاً از حساب رد شود
  // اگر reinvest مستقیم بدون ورود به حساب بانکی: acc نباشد؛ journal همچنان دو leg
COMMIT
```

فقط `units += X` بدون income leg → Income گم می‌شود.  
فقط income بدون purchase → cost basis خراب.

### Dividend صندوق — Gross / Net
همان قرارداد سهام: `grossDividend`, `withholdingTaxAmount`, `netDividend`؛ `totalAmount` = خالص دریافتی.

---

## حالت‌های Valuation و Performance

| حالت | فرمول | گزارش |
|------|--------|--------|
| `navValuation` | units × currentNAV | اعلامیه / tracking |
| `liquidationValue` | units × redemptionPrice − exit fees | «اگر الان ابطال کنم» |
| `acquisitionReference` | averageBuyPrice (از transactionPrice خرید) | cost basis |
| `etfMarketValue` | units × last market price | ETF |

**Unrealized برای نمایش کاربر (issuance/redemption):** پیش‌فرض `liquidationValue - totalInvested` نه الزاماً `(NAV - avg)×units`.  
UI می‌تواند هر دو را نشان دهد با برچسب صریح.

### Total Return / Performance واحد

```text
totalReturn =
  realizedPL_from_sells
  + Σ netDividend (و reinvest به‌عنوان acquisition جدا؛ dividend leg در income)
  − fees که expense شده‌اند (نه دوبار در cost)
  + unrealized (بر اساس valuation mode انتخابی)
```

API: `getFundPerformance(holdingId, { valuationMode, period })` یک آبجکت با breakdown برمی‌گرداند — نه فقط یک عدد مبهم.

---

## Fee policy واحد صندوق

| feeCategory | خرید/reinvest | فروش |
|-------------|---------------|------|
| subscription | includeInCostBasis=true (feeIn) | — |
| brokerage | معمولاً true روی buy | feeFromProceeds روی sell |
| redemption | — | feeFromProceeds (نه دوباره در cost) |
| management | expense دوره‌ای مگر مستند capitalize | — |

`feeAmount` + `feeCurrency` + `feeCategory` + `includeInCostBasis` روی هر tx با fee.

## Unrealized — یک قرارداد

```text
getUnrealizedPL(holdingId, mode = 'liquidation' | 'nav' | 'etf_market')
liquidation: units * redemptionPrice - totalInvested
nav:         units * currentNAV - totalInvested   // equivalent to (NAV - avg)*units if avg from totalInvested/units
etf_market:  units * marketPrice - totalInvested
```

`getProfitComparison` از `unrealizedByMode` با پیش‌فرض `liquidation` برای issuance_redemption و `etf_market` برای ETF استفاده می‌کند — **هرگز** `avgBuyNAV` (وجود ندارد؛ فقط `averageBuyPrice` / `totalInvested`).

---

## سه NAV صندوق ایران

| فیلد | معنی |
|------|------|
| `nav` / `currentNAV` | NAV آماری / گزارش |
| `subscriptionPrice` / قیمت صدور | خرید از صندوق |
| `redemptionPrice` / قیمت ابطال | فروش به صندوق |

روی `inv_fif_transactions` در صورت نیاز:
- `navStatistical`, `navSubscription`, `navRedemption` (nullable snapshot روز)
- `transactionPrice` همچنان مبنای cost/realized

---

## Decision table — ETF در برابر issuance_redemption

| شرط | ETF (`fundType = 'etf'`) | صدور/ابطال (`fundType = 'issuance_redemption'`) |
|------|---------------------------|-----------------------------------------------------|
| `brokerageId` | **اجباری** روی holding و tx | **null** (ممنوع پر کردن برای جریان پول) |
| `accountId` روی tx خرید/فروش | nullable (پول از کارگزاری) | **اجباری** |
| جریان نقد | `inv_stocks_iran_brokerage_transactions` | `acc_transactions` |
| `acc_transactions.relatedFeature` | معمولاً `stocks_iran` (مسیر کارگزاری) | **`fif`** |
| `symbol` | نماد بورسی | nullable |
| قیمت | بازار / کارگزاری | `transactionPrice` = صدور یا ابطال |
| valuation پیش‌فرض | market | liquidation ≈ redemptionPrice |

```text
if fundType == 'etf':
  brokerageId mandatory
  accountId nullable
  cash via brokerage cash ledger (+ acc فقط اگر bank↔broker)
if fundType == 'issuance_redemption':
  accountId mandatory on buy/sell
  brokerageId null
  cash via acc_transactions relatedFeature='fif'
```

Validate در createTransaction: نقض جدول بالا → reject.

---

## ETF و نقد کارگزاری — یک Ledger

```text
Brokerage Cash Ledger = تنها منبع مانده نقد کارگزاری
```

- ETF **مصرف‌کننده** سرویس cash همان کارگزاری است
- **ممنوع:** `Stock Brokerage Cash` + `FIF Brokerage Cash` دو مانده مستقل برای یک `brokerageId`
- FIF domain فقط units/NAV/tx؛ حرکت پول ETF از همان مسیر brokerage cash (+ journal) که سهام استفاده می‌کند

issuance_redemption همچنان از `acc_transactions` / حساب بانکی — جدا از مسیر ETF.

---

## Distribution / Reinvestment

| نوع | units | cash | cost basis |
|-----|-------|------|------------|
| Cash dividend | بدون تغییر اجباری | + به حساب | unchanged |
| Reinvested dividend | ↑ units جدید | معمولاً ۰ خالص | **دو leg:** income + acquisition (یک operationId) |
| Unit bonus | ↑ | ۰ | total cost same → avg ↓ |

**NAV ≠ subscription ≠ redemption** حفظ می‌شود.

## fundBehaviorProfile

```text
supportsCashDistribution, supportsReinvestment, usesNAV,
usesRedemptionPrice, usesIssuePrice, accumulating?
```

رفتار محاسبه از profile — نه if/else پراکنده per fund instance.

---

## NAV ≠ transactionPrice (قفل P0)

این‌ها الزاماً یکی نیستند و جدا نگه داشته می‌شوند:

| مفهوم | نقش |
|--------|------|
| NAV | ارزش خالص دارایی اعلامی |
| transactionPrice | قیمت واقعی معامله کاربر |
| subscriptionPrice / issuance | قیمت صدور |
| redemptionPrice | قیمت ابطال |

Domain concepts جدا:

- Distribution vs Accumulation
- ETF vs Issue/Redemption fund

Cost basis و Realized P&L از **transactionPrice** (و fees) می‌آید؛ NAV برای valuation/unrealized است مگر policy صریح خلاف بگوید.

---

## سه گزارش مستقل Performance (P0/P1 — جلوگیری از double-count)

**ممنوع:** ریختن current unrealized مستقیم داخل period P&L تاریخی.

### 1. Since Inception
total invested + income + realized + unrealized (مرز از شروع)

### 2. Period Economic P&L
```text
opening value
+ cash flows
+ income
+ realized
→ vs closing value
```

### 3. Return %
جدا: TWR · MWR/IRR (بعداً)

### NAV sources
- reported NAV: value, source, reportedAt, marketDate, provider, rawValue
- calculated NAV (ممکن است ≠ reported)
- Liquidation Value ≠ NAV ≠ Transaction Price (early redemption fee, broker commission, …)

### ETF vs Issue/Redemption dependency
- صدور/ابطال: Fund + Core کافی (standalone)
- ETF: conditional dependency به Broker + Stock Settlement — نه global اجباری

## FEAT-P0 LOCK (Funds)

### NAV vs price (P0-036)
Cost/realized from **transactionPrice**; valuation from **NAV** / liquidation.
Performance outputs independent: **income | realized | unrealized**.
`predictedProfit` = comparison metadata only — never add into period economic P&L with unrealized.

### ETF vs issuance (P0-037)
`fundType` discriminator: ETF → brokerage settlement route; issuance/redemption → account route.
SettlementPort only — no dual mandatory FKs.

