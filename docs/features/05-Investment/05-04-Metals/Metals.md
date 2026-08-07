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
- ثبت کارمزد (با `feeAmount` + `feeCurrency` + `exchangeRateToUSDT`)

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
  - موجودی نقدی پلتفرم افزایش می‌یابد.
  - تراکنش در `AccountsBanking_transactions` + جدول تراکنش‌های پلتفرم ثبت و لینک می‌شود.
- برداشت به حساب بانکی:
  - موجودی نقدی پلتفرم کاهش و موجودی حساب بانکی افزایش می‌یابد.
- خرید فلز:
  - از موجودی نقدی پلتفرم کسر می‌شود.
  - موجودی فلز (`quantityMg`) افزایش و میانگین خرید به‌روزرسانی می‌شود.
  - `quantityMg` نمی‌تواند منفی شود.
- فروش فلز:
  - موجودی فلز (`quantityMg`) کاهش می‌یابد.
  - مبلغ حاصل به موجودی نقدی پلتفرم اضافه می‌شود.
  - `quantityMg` نمی‌تواند منفی شود.
- تحویل فیزیکی:
  - یک تراکنش جدید با `type: physical_delivery` در `metals_transactions` ثبت می‌شود.
  - `quantityMg` فلز کاهش می‌یابد (از موجودی دیجیتال خارج می‌شود).
  - `deliveryFee` از موجودی نقدی پلتفرم کسر می‌شود.
  - جزئیات لجستیک (آدرس، فاکتور، وضعیت) در `metals_physical_deliveries` نگهداری می‌شود و به تراکنش لینک می‌شود.
  - وضعیت درخواست پیگیری می‌شود (requested, processing, delivered, cancelled).
- کارمزدها با `feeAmount` + `feeCurrency` + `exchangeRateToUSDT` ثبت می‌شوند.
- موجودی حساب بانکی و موجودی نقدی پلتفرم نمی‌توانند منفی شوند.


Domain Entities
۱. Metals Platform (جدول: metals_platforms)

id → UUID (Primary Key)
name → string (نام پلتفرم — گرمی، میلی، ملی‌گلد و ...)
url → string
supportedMetals → string[] (gold, silver, copper)
minPhysicalDelivery → decimal (حداقل وزن برای تحویل فیزیکی — میلی‌گرم)
description → string
isActive → boolean
createdAt / updatedAt

> نکته: `minBuyAmount` از MVP حذف شد (فقط به عنوان اطلاعات نمایشی در آینده می‌تواند استفاده شود).

۲. Metals Holding (جدول: metals_holdings)

id → UUID
platformId → UUID
metalType → string (gold, silver, copper)
purity → string (مثلاً ۱۸ عیار، ۹۹۹ و ...)
quantityMg → decimal (موجودی به میلی‌گرم)
averageBuyPricePerMg → decimal (میانگین قیمت خرید به ازای هر میلی‌گرم — ریال)
totalInvested → decimal
totalFeesPaid → decimal
totalFeesPaidCurrency → string (IRR یا USDT بر اساس ارز کارمزد اصلی)
createdAt / updatedAt

۳. Metals Transaction (جدول: metals_transactions) — لاگ خرید، فروش و تحویل فیزیکی

id → UUID
platformId → UUID
metalType → string
type → string (buy, sell, physical_delivery)
quantityMg → decimal
pricePerMg → decimal (برای physical_delivery می‌تواند `averageBuyPricePerMg` باشد)
totalAmount → decimal
feeAmount → decimal
feeCurrency → string
exchangeRateToUSDT → decimal
description → string
date → datetime
createdAt

۴. Metals Platform Cash Transaction (جدول: metals_platform_transactions) — لاگ واریز و برداشت

id → UUID
platformId → UUID
type → string (deposit, withdraw)
amount → decimal (ریال)
feeAmount → decimal
feeCurrency → string
exchangeRateToUSDT → decimal
accountId → UUID
accountTransactionId → UUID (لینک به `AccountsBanking_transactions`)
description → string
date → datetime
createdAt

۵. Physical Delivery Request (جدول: metals_physical_deliveries)

id → UUID
transactionId → UUID (لینک به `metals_transactions` که `type=physical_delivery`)
deliveryAddress → string / شعبه
invoiceNumber → string
deliveredAt → datetime (nullable)
status → string (requested, processing, delivered, cancelled)
createdAt / updatedAt

۶. AccountsBanking_transactions

فقط در واریز و برداشت بین حساب بانکی و پلتفرم ثبت می‌شود.


APIهای داخلی
Platform APIs:

createPlatform(data) / updatePlatform(id, data) / getAllPlatforms()

Holding APIs:

getHoldings(platformId?)
getHoldingByMetal(metalType, platformId?)
getPortfolioValue() → ارزش کل به ریال + معادل تتری

Transaction APIs:

createMetalsTransaction(data) → خرید / فروش / تحویل فیزیکی
createPlatformCashTransaction(data) → واریز / برداشت + لینک بانکی
requestPhysicalDelivery(data) → ثبت درخواست تحویل فیزیکی (ایجاد تراکنش + جزئیات)
updateDeliveryStatus(id, status)
getMetalsTransactions(filters)
getPlatformTransactions(filters)
getPhysicalDeliveries(filters)
calculateProfitLoss(metalType?, platformId?)


روابط با سایر فیچرها

Accounts & Banking: واریز و برداشت
Currency & Multi-Currency: نرخ تتر لحظه‌ای
Reports / Dashboard / Portfolio: ارزش پرتفوی فلزات و سود/زیان
Physical Assets (در صورت نیاز): پس از تحویل فیزیکی می‌توان به دارایی فیزیکی منتقل کرد


نکات طراحی

- واحد پایه همیشه میلی‌گرم است تا دقت بالا حفظ شود (۱ گرم = ۱۰۰۰ میلی‌گرم).
- میانگین خرید با Weighted Average محاسبه می‌شود.
- کارمزدها با `feeAmount` + `feeCurrency` + `exchangeRateToUSDT` ثبت می‌شوند.
- تحویل فیزیکی با یک تراکنش `type=physical_delivery` در `metals_transactions` ثبت می‌شود تا تاریخچه کامل موجودی در یک جدول باشد.
- `metals_physical_deliveries` فقط جزئیات لجستیک (آدرس، فاکتور، وضعیت) را نگهداری می‌شود و به تراکنش لینک می‌شود.
- `deliveryFee` همیشه از موجودی نقدی پلتفرم کسر می‌شود.
- این زیر‌فیچر مخصوص پلتفرم‌های ایران است (طلا، نقره، مس).