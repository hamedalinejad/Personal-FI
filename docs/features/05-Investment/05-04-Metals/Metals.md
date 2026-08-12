نام زیر‌فیچر: Investment - Metals (سرمایه‌گذاری در فلزات اساسی بازار ایران)
توضیح کلی:
این زیر‌فیچر مدیریت سرمایه‌گذاری آنلاین در طلا، نقره و مس از طریق پلتفرم‌های ایرانی (مانند گرمی، میلی، ملی‌گلد، وال‌گلد و مشابه) را پوشش می‌دهد.
ویژگی‌های کلیدی بازار ایران:

- خرید از مقادیر بسیار خرد (میلی‌گرم / سوت) تا گرم و کیلو
- نگهداری دیجیتال در کیف پول پلتفرم با پشتوانه فیزیکی
- امکان دریافت فیزیکی (شمش، ساچمه و ...) با فاکتور رسمی
- قیمت لحظه‌ای بازار
- کارمزد شفاف (معمولاً ۰.۵٪ تا ۱.۵٪)
- واریز و برداشت ریالی از/به حساب بانکی

تمام مبالغ به ریال هستند و در هر معامله نرخ تتر لحظه ذخیره می‌شود تا بتوان عملکرد را نسبت به دلار/تتر نیز مقایسه کرد.

User Stories
Must Have:

- ثبت پلتفرم سرمایه‌گذاری فلزات
- خرید طلا / نقره / مس (به میلی‌گرم، گرم یا کیلو)
- فروش فلز
- واریز از حساب بانکی به پلتفرم
- برداشت از پلتفرم به حساب بانکی
- درخواست و ثبت تحویل فیزیکی
- مشاهده موجودی هر فلز (به میلی‌گرم/گرم) و میانگین خرید
- محاسبه سود و زیان (realized و unrealized)
- مشاهده ارزش کل پرتفوی فلزات
- ذخیره نرخ تتر لحظه هر معامله
- ثبت کارمزد (با `feeAmount` + `feeCurrency` + `exchangeRateToBase`)

Should Have:

- انتقال فلز بین حساب‌های همان پلتفرم (در صورت پشتیبانی)
- تاریخچه قیمت
- پیوست فاکتور و رسید تحویل فیزیکی
- حداقل وزن برای تحویل فیزیکی و هزینه تحویل


Business Rules

- تمام مبالغ به ریال هستند و نرخ تتر لحظه در هر رکورد ذخیره می‌شود.
- واحد پایه ذخیره‌سازی موجودی: میلی‌گرم (برای دقت بالا). نمایش به کاربر می‌تواند گرم یا کیلو باشد.
- واریز از حساب بانکی به پلتفرم:
  - موجودی حساب بانکی کاهش می‌یابد.
  - موجودی نقدی پلتفرم در `inv_metals_platforms.cashBalance` افزایش می‌یابد.
  - تراکنش در `acc_transactions` + جدول `inv_metals_platform_transactions` ثبت و لینک می‌شود.
- برداشت به حساب بانکی:
  - موجودی نقدی پلتفرم در `inv_metals_platforms.cashBalance` کاهش می‌یابد و موجودی حساب بانکی افزایش می‌یابد.
  - تراکنش در `acc_transactions` + جدول `inv_metals_platform_transactions` ثبت و لینک می‌شود.
- خرید فلز:
  - از موجودی نقدی پلتفرم کسر می‌شود.
  - موجودی فلز (`quantityMg`) افزایش و میانگین خرید به‌روزرسانی می‌شود.
  - `quantityMg` نمی‌تواند منفی شود.
- فروش فلز:
  - موجودی فلز (`quantityMg`) کاهش می‌یابد.
  - مبلغ حاصل به موجودی نقدی پلتفرم اضافه می‌شود.
  - `quantityMg` نمی‌تواند منفی شود.
- تحویل فیزیکی:
  - یک تراکنش جدید با `type: physical_delivery` در `inv_metals_transactions` ثبت می‌شود.
  - `quantityMg` فلز کاهش می‌یابد (از موجودی دیجیتال خارج می‌شود).
  - `deliveryFee` (در فیلد مخصوص) از موجودی نقدی پلتفرم کسر می‌شود.
  - جزئیات لجستیک (آدرس، فاکتور، وضعیت) در `inv_metals_physical_deliveries` نگهداری می‌شود و به تراکنش لینک می‌شود.
  - وضعیت درخواست پیگیری می‌شود (requested, processing, delivered, cancelled).
  - `feeAmount` فقط کارمزد معامله (خرید/فروش) است، نه هزینه تحویل.
- کارمزدها با `feeAmount` + `feeCurrency` + `exchangeRateToBase` ثبت می‌شوند.
- موجودی حساب بانکی و موجودی نقدی پلتفرم نمی‌توانند منفی شوند.
- **ویرایش/حذف معاملات**: تراکنش‌های فلزات پس از ثبت غیرقابل ویرایش هستند. برای اصلاح یا حذف:
  - تراکنش اصل ذخیره می‌ماند (`isVoided = true` در `acc_transactions`)
  - تراکنش‌های معکوس (Reversal) ثبت می‌شوند تا موجودی‌ها و میانگین خرید درست شوند
  - این رویکرد تاریخچه معاملات و محاسبات سود/زیان را حفظ می‌کند


Domain Entities
۱. Metals Platform (جدول: `inv_metals_platforms`)

- `id` → UUID (Primary Key)
- `name` → string (نام پلتفرم — گرمی، میلی، ملی‌گلد و ...)
- `url` → string
- `supportedMetals` → string[] (gold, silver, copper)
- `minPhysicalDelivery` → decimal (حداقل وزن برای تحویل فیزیکی — میلی‌گرم)
- `cashBalance` → decimal (موجودی نقدی پلتفرم به ریال — برای سرعت بالا در محاسبات)
- `description` → string
- `isActive` → boolean
- `createdAt` → datetime
- `updatedAt` → datetime

> **نکته طراحی**: موجودی نقدی پلتفرم از طریق فیلد `cashBalance` در این جدول با snapshot نگهداری می‌شود.  
> - هنگام واریز: `cashBalance += amount`  
> - هنگام برداشت: `cashBalance -= amount`  
> - هنگام خرید فلز: `cashBalance -= totalAmount`  
> - هنگام فروش فلز: `cashBalance += totalAmount`  
> - هنگام تحویل فیزیکی: `cashBalance -= deliveryFee`  
> - تراکنش‌ها در `inv_metals_platform_transactions` فقط لاگ هستند  
> - این موجودی در محاسبه ثروت در `Portfolio & Wealth Overview` با کنترل `includeCashInWealth` لحاظ می‌شود

۲. Metals Holding (جدول: `inv_metals_holdings`)

id → UUID
platformId → UUID
metalType → string (gold, silver, copper)
purity → string (کد استاندارد خلوص فلز — مقادیر مجاز:)

> | کد | معنا | فلز |
> |----|------|-----|
> | `18k` | طلای ۱۸ عیار (۷۵٪ خلوص) | طلا |
> | `21k` | طلای ۲۱ عیار (۸۷.۵٪ خلوص) | طلا |
> | `22k` | طلای ۲۲ عیار (۹۱.۶٪ خلوص) | طلا |
> | `24k` | طلای ۲۴ عیار (۹۹.۹٪ خلوص) — شمش | طلا |
> | `999` | خلوص ۹۹.۹٪ | نقره / مس |
> | `9999` | خلوص ۹۹.۹۹٪ — شمش بانکی | طلا / نقره |
> | `coin_emami` | سکه امامی | طلا |
> | `coin_bahar` | نیم‌سکه بهار آزادی | طلا |
> | `coin_quarter` | ربع‌سکه | طلا |
> | `coin_gerami` | سکه گرمی | طلا |
> | `other` | سایر | همه |
>
> **نکته**: `purity` در `getHoldingByMetal(metalType, platformId?)` برای گروه‌بندی استفاده می‌شود — اهمیت یکسان‌سازی مقادیر بسیار زیاد است.
quantityMg → decimal (موجودی به میلی‌گرم)
averageBuyPricePerMg → decimal (میانگین قیمت خرید به ازای هر میلی‌گرم — ریال)
totalInvested → decimal
totalFeesPaidBase → decimal (مجموع تجمیعی تمام کارمزدهای پرداخت‌شده، پس از تبدیل هر کارمزد به ارز پایه (ریال) با exchangeRateToBase همان تراکنش)
createdAt / updatedAt

۳. Metals Transaction (جدول: `inv_metals_transactions`) — لاگ خرید، فروش و تحویل فیزیکی

- `id` → UUID (Primary Key)
- `platformId` → UUID
- `metalType` → string (gold, silver, copper)
- `type` → string (buy, sell, physical_delivery)
- `quantityMg` → decimal
- `pricePerMg` → decimal (nullable برای `physical_delivery` — برای خرید و فروش: قیمت بازار در لحظه معامله؛ برای تحویل فیزیکی: `null` چون هیچ محاسبه P&L رخ نمی‌دهد)

> **نکته**: `pricePerMg` در `physical_delivery` لازم نیست پر شود — تحویل فیزیکی فروش نیست و `realizedPL` ایجاد نمی‌کند. اگر مقداری ذخیره شود فقط برای رفرنس است.
- `totalAmount` → decimal
- `feeAmount` → decimal (کارمزد معامله)
- `feeCurrency` → string
- `exchangeRateToBase` → decimal (نرخ تتر لحظه — ریال به ازای ۱ تتر، مثلاً ۶۰,۰۰۰)
- `deliveryFee` → decimal (nullable — هزینه تحویل فیزیکی فقط برای `type=physical_delivery`)
- `description` → string
- `date` → datetime
- `createdAt` → datetime

> **نکته**: برای `type = 'physical_delivery'`:
> - `deliveryFee` هزینه تحویل فیزیکی است (از موجودی نقدی پلتفرم کسر می‌شود)
> - این مبلغ با `feeAmount` (کارمزد معامله) متفاوت است
> - اگر `deliveryFee = 0` یا null باشد، یعنی هیچ هزینه تحویلی پرداخت نشده است

۴. Metals Platform Cash Transaction (جدول: `inv_metals_platform_transactions`) — لاگ واریز و برداشت

id → UUID
platformId → UUID
type → string (deposit, withdraw)
amount → decimal (ریال)
feeAmount → decimal
feeCurrency → string
exchangeRateToBase → decimal (نرخ تتر لحظه — ریال به ازای ۱ تتر، مثلاً ۶۰,۰۰۰)
accountId → UUID
accountTransactionId → UUID (لینک به `acc_transactions`)
description → string
date → datetime
createdAt

۵. Physical Delivery Request (جدول: `inv_metals_physical_deliveries`)

id → UUID
transactionId → UUID (لینک به `metals_transactions` که `type=physical_delivery`)
deliveryAddress → string / شعبه
invoiceNumber → string
deliveredAt → datetime (nullable)
status → string (requested, processing, delivered, cancelled)
createdAt / updatedAt

۶. acc_transactions

فقط در واریز و برداشت بین حساب بانکی و پلتفرم ثبت می‌شود.


APIهای داخلی
Platform APIs:

createPlatform(data) → ایجاد پلتفرم با `cashBalance = 0`
updatePlatform(id, data) → به‌روزرسانی اطلاعات پلتفرم (شامل `cashBalance`)
getAllPlatforms() → لیست پلتفرم‌ها همراه با `cashBalance`

Holding APIs:

getHoldings(platformId?)
getHoldingByMetal(metalType, platformId?)
getPortfolioValue() → ارزش کل به ریال + معادل تتری

Transaction APIs:

createMetalsTransaction(data) → خرید / فروش
createPhysicalDeliveryTransaction(data) → تحویل فیزیکی (با `deliveryFee`)
createPlatformCashTransaction(data) → واریز (`type='deposit-investment'`) / برداشت (`type='withdrawal-investment'`) + لینک بانکی
requestPhysicalDelivery(data) → ثبت درخواست تحویل فیزیکی (ایجاد تراکنش + جزئیات)
updateDeliveryStatus(id, status)
getMetalsTransactions(filters) → شامل `deliveryFee` برای تحویل‌ها
getPlatformTransactions(filters)
getPhysicalDeliveries(filters)
calculateProfitLoss(metalType?, platformId?)


روابط با سایر فیچرها

Accounts & Banking: واریز و برداشت
Currency & Multi-Currency: نرخ تتر لحظه‌ای
Reports / Dashboard / Portfolio: ارزش پرتفوی فلزات و سود/زیان
Physical Assets (در صورت نیاز): پس از تحویل فیزیکی می‌توان به دارایی فیزیکی منتقل کرد


منطق محاسبه سود/زیان تحقق‌یافته (Realized P&L)

فرمول رسمی برای `calculateProfitLoss()` و به‌روزرسانی Holding هنگام خرید/فروش (واحد پایه: میلی‌گرم):

**هنگام خرید** (Weighted Average):
```
newTotalInvested = totalInvested + (quantityMgBought × pricePerMg) + feeAmount
newQuantityMg     = quantityMg + quantityMgBought
newAverageBuyPricePerMg = newTotalInvested / newQuantityMg
```

**هنگام فروش** (`averageBuyPricePerMg` استفاده‌شده = میانگین خرید **قبل از این فروش**):
```
soldPortionCost = quantityMgSold × averageBuyPricePerMg
realizedPL       = saleProceeds - soldPortionCost - feeAmount
totalInvested    -= soldPortionCost      // کاهش متناسب با بخش فروخته‌شده
quantityMg       -= quantityMgSold
averageBuyPricePerMg  بدون تغییر می‌ماند  // Weighted Average فقط با خرید جدید تغییر می‌کند، نه با فروش
```

> **نکات الزامی**:
> - تمام محاسبات بالا باید با `decimal.js` انجام شوند (هرگز `Number`).
> - در `type=physical_delivery`، هیچ `realizedPL`ای محاسبه نمی‌شود (فروش واقعی نیست)؛ فقط `quantityMg` کاهش و به دارایی فیزیکی منتقل می‌شود؛ `deliveryFee` جداگانه از موجودی نقدی پلتفرم کسر می‌شود (نه از `soldPortionCost`).
> - `calculateProfitLoss(metalType?, platformId?)` مجموع `realizedPL` تراکنش‌های `type=sell` را برمی‌گرداند؛ سود/زیان **تحقق‌نیافته** جداگانه بر اساس `(currentPricePerMg - averageBuyPricePerMg) × quantityMg` محاسبه می‌شود، که در آن `currentPricePerMg = getLatestPrice(metalType, baseCurrency) / 1000` است (چون `19-Price-Fetching` قیمت را به‌ازای هر گرم برمی‌گرداند — به بخش «نکات طراحی» پایین همین فایل مراجعه شود).


نکات طراحی

- واحد پایه همیشه میلی‌گرم است تا دقت بالا حفظ شود (۱ گرم = ۱۰۰۰ میلی‌گرم).
- **قیمت لحظه‌ای فلزات (برای Unrealized P&L)** از فیچر `19-Price-Fetching` (جدول `price_history` با `assetCategory='metal'`) به‌صورت **قیمت هر گرم** خوانده می‌شود؛ تبدیل از گرم به میلی‌گرم (`÷ 1000`) در لایه Domain انجام می‌شود.
- میانگین خرید با Weighted Average محاسبه می‌شود.
- کارمزدها با `feeAmount` + `feeCurrency` + `exchangeRateToBase` ثبت می‌شوند.
- تحویل فیزیکی با یک تراکنش `type=physical_delivery` در `metals_transactions` ثبت می‌شود تا تاریخچه کامل موجودی در یک جدول باشد.
- `metals_physical_deliveries` فقط جزئیات لجستیک (آدرس، فاکتور، وضعیت) را نگهداری می‌شود و به تراکنش لینک می‌شود.
- `deliveryFee` همیشه از موجودی نقدی پلتفرم کسر می‌شود.
- این زیر‌فیچر مخصوص پلتفرم‌های ایران است (طلا، نقره، مس).