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

تمام مبالغ به ریال هستند و در هر معامله نرخ تتر لحظه ذخیره می‌شود.

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
- ذخیره نرخ تتر لحظه هر رویداد
- ثبت کارمزد (با `feeAmount` + `feeCurrency` + `exchangeRateToUSDT`)

Should Have:

- ثبت روزانه/دوره‌ای تغییرات NAV
- هشدار تاریخ تقسیم سود
- گزارش بازدهی روزشمار و سالانه‌شده


Business Rules

- تمام مبالغ به ریال هستند و نرخ تتر لحظه در هر رکورد ذخیره می‌شود.
- خرید واحد:
  - موجودی نقدی (حساب بانکی یا کارگزاری) کاهش می‌یابد.
  - تعداد واحد (`units`) افزایش می‌یابد و میانگین خرید به‌روزرسانی می‌شود.
  - در صندوق‌های ETF، `brokerageId` در `inv_fif_holdings` و `inv_fif_transactions` پر می‌شود.
  - `units` نمی‌تواند منفی شود.
  - در صورت خرید از کارگزاری، `cashBalance` در `inv_stocks_iran_brokerages` کاهش می‌یابد.
- فروش/ابطال واحد:
  - تعداد واحد کاهش می‌یابد.
  - مبلغ حاصل به موجودی نقدی (کارگزاری یا حساب بانکی) اضافه می‌شود.
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
- کارمزدها با `feeAmount` + `feeCurrency` + `exchangeRateToUSDT` ثبت می‌شوند.
- موجودی حساب بانکی نمی‌تواند منفی شود.

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
- `averageBuyPrice` → decimal (میانگین قیمت خرید)
- `totalInvested` → decimal
- `totalFeesPaid` → decimal
- `totalFeesPaidCurrency` → string (IRR یا USDT بر اساس ارز کارمزد اصلی)
- `currentNAV` → decimal (آخرین NAV ثبت‌شده)
- `createdAt` → datetime
- `updatedAt` → datetime

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
- `units` → decimal (تعداد واحد — در buy/sell/reinvest)
- `price` → decimal (قیمت واحد / NAV)
- `amount` → decimal (مبلغ ریالی)
- `feeAmount` → decimal
- `feeCurrency` → string
- `exchangeRateToUSDT` → decimal
- `predictedProfit` → decimal (nullable — فقط در nav_update و dividend)
- `actualProfit` → decimal (nullable — فقط در nav_update و dividend)
- `accountId` → UUID (nullable — برای واریز/برداشت مستقیم از حساب بانکی)
- `accountTransactionId` → UUID (لینک به acc_transactions)
- `description` → string
- `date` → datetime
- `createdAt` → datetime

> **نکته**: برای ETFها، واریز/برداشت از طریق کارگزاری انجام می‌شود، بنابراین `brokerageId` پر می‌شود. برای صندوق‌های issuance_redemption، ممکن است `accountId` مستقیماً پر شود.

۴. acc_transactions

در واریز/برداشت و دریافت سود نقدی (در صورت واریز به حساب بانکی) استفاده می‌شود.


APIهای داخلی

createFund(data) / updateFund(id, data) / getAllFunds()
createTransaction(data) → خرید، فروش، تقسیم سود، سرمایه‌گذاری مجدد
createPlatformCashTransaction(data) → واریز (`type='deposit-investment'`) / برداشت (`type='withdrawal-investment'`) + لینک بانکی
updateNAV(fundId, nav, date) → ثبت NAV جدید
getHoldings() / getHoldingByFund(fundId)
getPortfolioValue() → ارزش کل + معادل تتری
getProfitComparison(fundId, period) → مقایسه سود پیش‌بینی‌شده و واقعی (بر اساس تراکنش‌ها)


روابط با سایر فیچرها

Accounts & Banking: واریز، برداشت و دریافت سود نقدی
Currency & Multi-Currency: نرخ تتر لحظه‌ای
Reports / Dashboard / Portfolio: ارزش پرتفوی و بازدهی


نکات طراحی

سود روزشمار با فرمول تقریبی:
$  \text{سود} = \dfrac{\text{سرمایه} \times \text{نرخ سالانه} \times \text{تعداد روز}}{365}  $

در صندوق‌های Distribution پس از تقسیم سود، امکان ثبت بازگشت NAV به قیمت پایه وجود دارد.
سرمایه‌گذاری مجدد سود به صورت تراکنش reinvest ثبت و واحد جدید به Holding اضافه می‌شود.
این زیر‌فیچر مخصوص صندوق‌های درآمد ثابت ایران است.