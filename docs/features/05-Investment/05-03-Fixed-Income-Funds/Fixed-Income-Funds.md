نام زیر‌فیچر: Investment - Fixed Income Funds (صندوق‌های درآمد ثابت)
توضیح کلی:
این زیر‌فیچر مدیریت سرمایه‌گذاری در صندوق‌های درآمد ثابت ایران را پوشش می‌دهد.
انواع اصلی صندوق‌ها از نظر پرداخت سود:




















نوعنحوه سوددهیرفتار قیمت (NAV)با تقسیم سود (Distribution)سود نقدی دوره‌ای (معمولاً ماهانه) به حساب سرمایه‌گذار واریز می‌شوداغلب پس از تقسیم سود، قیمت به نزدیک قیمت پایه برمی‌گرددبدون تقسیم سود (Accumulation)سود به NAV اضافه می‌شود و قیمت واحد هر روز رشد می‌کندNAV به صورت روزشمار افزایش می‌یابد
سایر ویژگی‌های مهم:

سود تقریباً همیشه روزشمار محاسبه می‌شود (حتی در تعطیلات).
سود پیش‌بینی‌شده اعلام می‌شود ولی سود واقعی ممکن است متفاوت باشد و باید قابل پیگیری باشد.
برخی صندوق‌ها امکان سرمایه‌گذاری مجدد سود (خرید واحد جدید از محل سود) را می‌دهند.
دو روش معامله: صدور و ابطالی و ETF (قابل معامله در بورس).

تمام مبالغ به ریال هستند و در هر معامله نرخ تتر لحظه ذخیره می‌شود.

User Stories
Must Have:

ثبت صندوق درآمد ثابت (نام، نوع سوددهی، روش معامله، سود پیش‌بینی‌شده)
خرید واحد (صدور یا خرید از بورس)
فروش/ابطال واحد
ثبت دریافت سود نقدی (تقسیم سود)
ثبت سرمایه‌گذاری مجدد سود (خرید واحد جدید از محل سود)
مشاهده تعداد واحد، میانگین خرید و ارزش فعلی
پیگیری سود پیش‌بینی‌شده در مقابل سود واقعی
واریز/برداشت مرتبط با حساب بانکی یا کارگزاری
ذخیره نرخ تتر لحظه هر رویداد
ثبت کارمزد (به ریال + معادل تتری)

Should Have:

ثبت روزانه/دوره‌ای تغییرات NAV
هشدار تاریخ تقسیم سود
گزارش بازدهی روزشمار و سالانه‌شده


Business Rules

تمام مبالغ به ریال هستند و نرخ تتر لحظه در هر رکورد ذخیره می‌شود.
خرید واحد:
موجودی نقدی (حساب بانکی یا کارگزاری) کاهش می‌یابد.
تعداد واحد و میانگین خرید به‌روزرسانی می‌شود.

فروش/ابطال واحد:
تعداد واحد کاهش می‌یابد.
مبلغ حاصل به موجودی نقدی اضافه می‌شود.

تقسیم سود نقدی:
مبلغ سود به عنوان درآمد ثبت می‌شود.
در صندوق‌های با تقسیم سود، معمولاً NAV به نزدیک قیمت پایه برمی‌گردد.

سرمایه‌گذاری مجدد سود:
به جای دریافت نقدی، تعداد واحد جدید خریداری و به Holding اضافه می‌شود.

سود پیش‌بینی‌شده فقط برای نمایش و مقایسه است؛ سود واقعی از طریق تراکنش‌ها و تغییرات NAV پیگیری می‌شود.
کارمزدها هم به ریال و هم معادل تتری لحظه ثبت می‌شوند.
موجودی حساب بانکی نمی‌تواند منفی شود.


Domain Entities
۱. Fixed Income Fund (جدول: fif_funds)

id → UUID
name → string (نام صندوق)
symbol → string (نماد — در صورت ETF)
fundType → string (issuance_redemption یا etf)
profitType → string (distribution یا accumulation)
predictedAnnualRate → decimal (سود پیش‌بینی‌شده سالانه — درصد)
distributionPeriod → string (monthly, quarterly, none)
basePrice → decimal (قیمت پایه — nullable)
platform → string (سایت صندوق یا کارگزاری)
url → string
description → string
isActive → boolean
createdAt / updatedAt

۲. Fixed Income Holding (جدول: fif_holdings)

id → UUID
fundId → UUID
units → decimal (تعداد واحد فعلی)
averageBuyPrice → decimal (میانگین قیمت خرید)
totalInvested → decimal
totalFeesPaidIRR → decimal
totalFeesPaidUSDT → decimal
currentNAV → decimal (آخرین NAV ثبت‌شده)
createdAt / updatedAt

۳. Fixed Income Transaction (جدول: fif_transactions) — لاگ رویدادها

id → UUID
fundId → UUID
type → string (buy, sell, dividend, reinvest, nav_update)
units → decimal (تعداد واحد — در buy/sell/reinvest)
price → decimal (قیمت واحد / NAV)
amount → decimal (مبلغ ریالی)
feeAmount → decimal
feeValueIRR → decimal
feeValueUSDT → decimal
exchangeRateToUSDT → decimal
predictedProfit → decimal (nullable — برای مقایسه)
actualProfit → decimal (nullable)
accountId → UUID (nullable)
accountTransactionId → UUID (لینک به AccountsBanking_transactions)
description → string
date → datetime
createdAt

۴. AccountsBanking_transactions

در واریز/برداشت و دریافت سود نقدی (در صورت واریز به حساب بانکی) استفاده می‌شود.


APIهای داخلی

createFund(data) / updateFund(id, data) / getAllFunds()
createTransaction(data) → خرید، فروش، تقسیم سود، سرمایه‌گذاری مجدد
updateNAV(fundId, nav, date) → ثبت NAV جدید
getHoldings() / getHoldingByFund(fundId)
getPortfolioValue() → ارزش کل + معادل تتری
getProfitComparison(fundId, period) → مقایسه سود پیش‌بینی‌شده و واقعی
calculateDailyAccrual(fundId, days) → محاسبه تقریبی سود روزشمار


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