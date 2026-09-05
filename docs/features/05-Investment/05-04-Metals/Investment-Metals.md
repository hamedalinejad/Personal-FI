# Investment — Metals (Canonical)

> **Canonical path:** `docs/features/05-Investment/05-04-Metals/Investment-Metals.md`  
> `Metals.md` = همان محتوا (alias سازگاری با لینک‌های قدیمی).

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

تمام مبالغ می‌توانند در هر ارزی باشند و در هر معامله `exchangeRateToBase` (نرخ تبدیل به `baseCurrency` کاربر — ) ذخیره می‌شود تا بتوان عملکرد را در ارز پایه کاربر مقایسه کرد.

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
- ذخیره exchangeRateToBase در هر معامله (نه الزام تتر)
- ثبت کارمزد (با `feeAmount` + `feeCurrency` + `exchangeRateToBase`)

Should Have:

- انتقال فلز بین حساب‌های همان پلتفرم (در صورت پشتیبانی)
- تاریخچه قیمت
- پیوست فاکتور و رسید تحویل فیزیکی
- حداقل وزن برای تحویل فیزیکی و هزینه تحویل


Business Rules

- `exchangeRateToBase` در هر رکورد ذخیره می‌شود (نرخ تبدیل ارز تراکنش → `baseCurrency` کاربر — ).
- **واحد، عیار و وزن خالص باید همیشه مستقل بمانند**:
 - واحد پایه ذخیره‌سازی موجودی: **میلی‌گرم (`quantityMg`)** — هرگز گرم/اونس در دیتابیس ذخیره نمی‌شود.
 - نمایش به کاربر می‌تواند میلی‌گرم / گرم / کیلو / اونس باشد؛ تبدیل فقط در Presentation Layer.
 - `purity` (عیار/خلوص) فیلد اجباری و مستقل از وزن است؛ `1g Gold 18K` هرگز معادل `1g pure gold` نیست.
 - **وزن خالص (Fine Weight)** محاسبه می‌شود و ذخیره نمی‌شود:
 - فرمول واحد برای همه فلزات: `fineWeightMg = quantityMg × purityRatio`
 - `purityRatio` نسبت خلوص نرمال‌شده (۰ تا ۱) است که هنگام ثبت دارایی از عیار اصلی محاسبه و در دیتابیس ذخیره می‌شود — فرمول تبدیل (فقط در UI/ورود ورودی، نه ستون جداگانه در جدول):
 - طلای عیاری: `purityRatio = karat / 24` (مثلاً ۱۸ عیار → `0.750`)
 - خلوص permille: `purityRatio = purityPermille / 1000` (مثلاً ۹۹۹ → `0.999`)
 - سکه (`gold_coin`): `purityRatio` از مشخصات استاندارد سکه؛ قیمت سکه جدا (حباب سکه).
 - **P0-062 — gold_coin instrument class جدا**: سکه ≠ bullion.  
   - `metalType = gold_coin` (یا instrument class جدا) با `purityCode` استاندارد سکه (`emami`, `bahar`, `half`, …).  
   - Valuation از provider quote **سکه** (شامل حباب) استفاده می‌کند؛ نه تبدیل از قیمت طلای آب‌شده × purity.  
   - cost basis و averageBuyPricePerMg برای سکه روی unit سکه (یا mg ناخالص سکه) است؛ قاطی کردن با bullion 18k/24k ممنوع.  
   - quoteBasis برای سکه معمولاً `per_coin` یا `gross_coin` است و باید در price feed صریح باشد.

 - قیمت و میانگین خرید همیشه **به ازای همان purity همان holding** است.
 - جدول تبدیل واحد (فقط نمایش/ورود):
 | واحد نمایش | به میلی‌گرم |
 |------------|-------------|
 | ۱ میلی‌گرم | ۱ |
 | ۱ گرم | ۱٬۰۰۰ |
 | ۱ کیلوگرم | ۱٬۰۰۰٬۰۰۰ |
 | ۱ اونس تروی (troy oz) | ۳۱٬۱۰۳٫۴۷۶۸ |
- واریز از حساب بانکی به پلتفرم:
 - موجودی حساب بانکی کاهش می‌یابد.
 - موجودی نقدی پلتفرم در `inv_metals_platforms.cashBalance` افزایش می‌یابد.
 - تراکنش در `acc_transactions` + جدول `inv_metals_platform_transactions` ثبت و لینک می‌شود.
- برداشت به حساب بانکی:
 - موجودی نقدی پلتفرم در `inv_metals_platforms.cashBalance` کاهش می‌یابد و موجودی حساب بانکی افزایش می‌یابد.
 - تراکنش در `acc_transactions` + جدول `inv_metals_platform_transactions` ثبت و لینک می‌شود.
- خرید فلز:
 - از موجودی نقدی پلتفرم کسر می‌شود.
 - موجودی فلز همان `(metalType, purity)` افزایش و میانگین خرید به‌روزرسانی می‌شود.
 - `purity` و `quantityMg` (وزن ناخالص) اجباری‌اند؛ `pricePerMg` باید قیمت همان عیار باشد.
 - `quantityMg` نمی‌تواند منفی شود.
- فروش فلز:
 - موجودی فلز همان `(metalType, purity)` کاهش می‌یابد.
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

> **معماری حسابداری — Journal/Cache**:
> `inv_metals_platform_transactions` + `inv_metals_transactions` = **Truth (Journal)**
> `inv_metals_platforms.cashBalance` = **Cache (Snapshot برای سرعت)**
>
> **آپدیت Atomic (الزامی)** — همه عملیات در یک BEGIN/COMMIT:
> - هنگام واریز: `cashBalance += amount` (لاگ در `inv_metals_platform_transactions`)
> - هنگام برداشت: `cashBalance -= amount` (لاگ در `inv_metals_platform_transactions`)
> - هنگام خرید فلز: `cashBalance -= totalAmount` (لاگ در `inv_metals_transactions`)
> - هنگام فروش فلز: `cashBalance += totalAmount` (لاگ در `inv_metals_transactions`)
> - هنگام تحویل فیزیکی: `cashBalance -= deliveryFee` (لاگ در `inv_metals_transactions`)
>
> برای بررسی انطباق Snapshot با لاگ: `reconcileMetalsPlatformCash(platformId)` — جزئیات در `db.md`. 
> - این موجودی در محاسبه ثروت در `Portfolio & Wealth Overview` با کنترل `includeCashInWealth` لحاظ می‌شود

۲. Metals Holding (جدول: `inv_metals_holdings`)

- `id` → UUID (Primary Key)
- `platformId` → UUID
- `metalType` → string (`gold` | `silver` | `copper` | `gold_coin`) — `gold_coin` کلاس ابزار جدا (P0-062)
- `purityCode` → string **canonical** (کد استاندارد immutable؛ آزاد نیست — مثلاً `18k`, `24k`, `999`, `emami`, `bahar`, `half`, `quarter`, `gram_coin`) — جزء UNIQUE key
- `purity` → string nullable (label نمایشی؛ می‌تواند با purityCode یکی باشد)
- `purityRatio` → decimal (نسبت خلوص ۰ تا ۱؛ مشتق از purityCode؛ برای identity استفاده نمی‌شود)
- `quantityMg` → decimal (**وزن ناخالص** به میلی‌گرم — واحد پایه ذخیره‌سازی؛ هرگز گرم/اونس)
- `averageBuyPricePerMg` → decimal (میانگین قیمت خرید به ازای **هر میلی‌گرم از همین purity** — ریال؛ نه قیمت طلای خالص)
- `totalInvested` → decimal
- `totalFeesPaidBase` → decimal (کارمزد تجمعی به baseCurrency — )
- `createdAt` → datetime
- `updatedAt` → datetime

> **تمایز حیاتی واحد / عیار / وزن خالص**:
> | مفهوم | فیلد / محاسبه | مثال ۱ گرم طلای ۱۸ عیار |
> |--------|----------------|---------------------------|
> | وزن ناخالص (Gross) | `quantityMg` | ۱٬۰۰۰ mg |
> | عیار / خلوص | `purity` + `purityRatio` | `18k` / `0.750` |
> | وزن خالص (Fine) | `quantityMg × purityRatio` | ۷۵۰ mg طلای خالص |
> | قیمت میانگین | `averageBuyPricePerMg` | به ازای هر mg از طلای ۱۸ عیار، نه ۲۴ عیار |
>
> `1g Gold 18K` ≠ `1g pure gold`. این دو با `purity` متفاوت‌اند و قیمت‌شان از `price_history` با کلید `metalType_purity` جدا خوانده می‌شود.
>
> **کلید یکتای منطقی Holding (P0-060)**: `UNIQUE(platformId, metalType, purityCode)`  
> - `purity` در UI/label می‌تواند باشد؛ **canonical identity** = `purityCode` (کد استاندارد immutable از registry: `18k`, `24k`, `999`, `emami`, …).  
> - `purityRatio` مشتق از `purityCode` است و برای identity استفاده نمی‌شود.  
> - Enforce در schema + domain: duplicate (platformId, metalType, purityCode) = reject.  
> - نمی‌توان طلای ۱۸ و ۲۴ یا دو تعریف متفاوت همان purityCode را در یک ردیف قاطی کرد.

۳. Metals Transaction (جدول: `inv_metals_transactions`) — لاگ خرید، فروش و تحویل فیزیکی

- `id` → UUID (Primary Key)
- `platformId` → UUID
- `metalType` → string (`gold` | `silver` | `copper` | `gold_coin`)
- `purityCode` → string (**اجباری** — همان canonical Holding؛ مثلاً `18k`, `999`, `emami`)
- `purity` → string nullable (label)
- `purityRatio` → decimal (نسبت خلوص در تاریخ تراکنش — snapshot)
- `type` → string (buy, sell, physical_delivery)
- `quantityMg` → decimal (**وزن ناخالص** به میلی‌گرم)
- `pricePerMg` → decimal (قیمت به ازای هر میلی‌گرم **از همین purity**؛ برای physical_delivery می‌تواند `averageBuyPricePerMg` باشد)
- `totalAmount` → decimal
- `feeAmount` → decimal (کارمزد معامله)
- `feeCurrency` → string
- `exchangeRateToBase` → decimal (نرخ تبدیل ارز تراکنش → `baseCurrency` کاربر در لحظه ثبت — ؛ برای کاربران با `baseCurrency=IRR` معمولاً برابر نرخ ریال-به-تتر است، اما عمومی است. قرارداد کامل در `Currency-CrossRate.md`)
- `deliveryFee` → decimal (nullable — هزینه تحویل فیزیکی فقط برای `type=physical_delivery`)
- `description` → string
- `date` → datetime
- `createdAt` → datetime

> **قوانین واحد و عیار در تراکنش**:
> - `quantityMg` همیشه وزن ناخالص است؛ وزن خالص = `quantityMg × purityRatio` فقط برای گزارش/نمایش.
> - `pricePerMg` قیمت همان عیار است؛ هرگز نباید قیمت ۲۴ عیار را بدون اعمال نسبت روی ۱۸ عیار اعمال کرد (مگر Fallback جهانی با برچسب «تخمینی» در `19-04-Metals-Prices`).
>
> ### P0-061 — Price Quote Semantics (gross vs fine)
> هر quote قیمت فلز **باید** `quoteBasis` اعلام کند:
> | quoteBasis | معنی | استفاده |
> |------------|------|---------|
> | `gross_metal` | قیمت به ازای وزن ناخالص همان purity | پیش‌فرض holding valuation وقتی pricePerMg همان purity است |
> | `fine_metal` | قیمت به ازای وزن خالص (fine gold/silver) | فقط وقتی provider fine quote می‌دهد؛ تبدیل: `pricePerGrossMg = pricePerFineMg × purityRatio` |
>
> Valuation: `value = quantityMg × pricePerMg` فقط وقتی quoteBasis با semantics قیمت هم‌خوان است.  
> بدون `quoteBasis` صریح در price_history / getLatestMetalPrice = valuation wrong (P0-061).

>
> **نکته physical_delivery**:
>
> ### P0-063 — Physical Delivery + Physical Asset Lineage (اجباری)
> یک عملیات atomic `physical_delivery`:
> 1. کاهش `quantityMg` روی `inv_metals_holdings` (همان platform/metalType/purityCode).
> 2. کسر `deliveryFee` از cash پلتفرم (از طریق CashSettlementPort در صورت نیاز).
> 3. **ایجاد یا لینک** دارایی در Physical Assets (`pa_assets`) با:
>    - `sourceFeature = 'metals'`
>    - `sourceTransactionId` / `sourceOperationId` = همین delivery operation
>    - quantity/cost basis منتقل‌شده (carrying cost released از metals holding)
> 4. رکورد `inv_metals_physical_deliveries` فقط لجستیک؛ lineage مالکیت در `pa_assets` + `pa_transactions` (type=acquisition_from_metals یا equivalent) است.
>
> بدون target physical asset creation/link = missing asset history (P0-063).  
> دو op جدا با related ids فقط اگر transaction boundary اجبار کند؛ ترجیح یک operationId واحد.

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
exchangeRateToBase → decimal (نرخ تبدیل ارز تراکنش → `baseCurrency` کاربر در لحظه ثبت — ؛ برای کاربران با `baseCurrency=IRR` معمولاً برابر نرخ ریال-به-تتر است، اما عمومی است. قرارداد کامل در `Currency-CrossRate.md`)
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
getAllPlatforms → لیست پلتفرم‌ها همراه با `cashBalance`

Holding APIs:

getHoldings(platformId?)
getHoldingByMetal(metalType, platformId?)
getPortfolioValue → ارزش کل به ریال + معادل تتری

Transaction APIs:

createMetalsTransaction(data) → خرید / فروش
createPhysicalDeliveryTransaction(data) → تحویل فیزیکی (با `deliveryFee`)
createPlatformCashTransaction(data) → واریز (`type='deposit'`) / برداشت (`type='withdraw'`) + لینک بانکی
requestPhysicalDelivery(data) → ثبت درخواست تحویل فیزیکی (ایجاد تراکنش + جزئیات)
updateDeliveryStatus(id, status)
getMetalsTransactions(filters) → شامل `deliveryFee` برای تحویل‌ها
getPlatformTransactions(filters)
getPhysicalDeliveries(filters)
calculateProfitLoss(metalType?, platformId?)


روابط با سایر فیچرها

Accounts & Banking: واریز و برداشت
Currency & Multi-Currency: قرارداد `exchangeRateToBase` — نرخ تبدیل ارز تراکنش → `baseCurrency` کاربر
Reports / Dashboard / Portfolio: ارزش پرتفوی فلزات و سود/زیان
Physical Assets (در صورت نیاز): پس از تحویل فیزیکی می‌توان به دارایی فیزیکی منتقل کرد


منطق محاسبه سود/زیان تحقق‌یافته (Realized P&L)

فرمول رسمی برای `calculateProfitLoss` و به‌روزرسانی Holding هنگام خرید/فروش.

> **پیش‌شرط**: Holding بر اساس `(platformId, metalType, purity)` یکتاست. خرید/فروش فقط روی همان `purity` اعمال می‌شود. واحد همه محاسبات: میلی‌گرم ناخالص + قیمت per-mg همان عیار.

**هنگام خرید** (Weighted Average):
```
cost = (quantityMgBought × pricePerMg) + feeAmount
newTotalInvested = totalInvested + cost
newQuantityMg = quantityMg + quantityMgBought
newAverageBuyPricePerMg = newTotalInvested / newQuantityMg
```

**هنگام فروش** (`averageBuyPricePerMg` = میانگین خرید **قبل از این فروش**):
```
soldPortionCost = quantityMgSold × averageBuyPricePerMg
realizedPL = saleProceeds - soldPortionCost - feeAmount
totalInvested -= soldPortionCost
quantityMg -= quantityMgSold
averageBuyPricePerMg بدون تغییر می‌ماند
```

**Unrealized P&L**:
```
currentPricePerMg = getLatestMetalPrice(metalType, purity) / 1000 // قیمت گرمی → per-mg
unrealizedPL = (currentPricePerMg - averageBuyPricePerMg) × quantityMg
```
قیمت لحظه‌ای **همان `metalType_purity`** از `price_history` خوانده می‌شود؛ هرگز قیمت ۲۴ عیار جایگزین ۱۸ عیار نمی‌شود.

**وزن خالص (فقط گزارش، نه مبنای P&L پیش‌فرض)**:
```
fineWeightMg = quantityMg × purityRatio
```

> **نکات الزامی**:
> - تمام محاسبات با `decimal.js` (هرگز `Number`).
> - `type=physical_delivery`: بدون `realizedPL`؛ فقط کاهش `quantityMg` و کسر `deliveryFee` از نقد پلتفرم.
> - `calculateProfitLoss(metalType?, platformId?, purity?)` مجموع `realizedPL` تراکنش‌های `type=sell` را برمی‌گرداند.
> - `1g 18K` و `1g 24K` دو دارایی جدا با قیمت و میانگین جدا هستند.


نکات طراحی

- واحد پایه همیشه میلی‌گرم (**وزن ناخالص**) است؛ گرم/کیلو/اونس فقط در UI.
- `purity` و `purityRatio` اجباری‌اند؛ کدهای `purity` از لیست استاندارد می‌آیند (نه متن آزاد).
- وزن خالص (`fineWeightMg`) محاسبه می‌شود و ذخیره نمی‌شود تا از دوباره‌کاری و ناسازگاری جلوگیری شود.
- میانگین خرید و قیمت لحظه‌ای همیشه per-mg **همان عیار** هستند؛ `1g Gold 18K ≠ 1g pure gold`.
- کارمزدها با `feeAmount` + `feeCurrency` + `exchangeRateToBase` ثبت می‌شوند.
- تحویل فیزیکی با `type=physical_delivery` در `inv_metals_transactions` ثبت می‌شود.
- `inv_metals_physical_deliveries` فقط جزئیات لجستیک را نگه می‌دارد.
- `deliveryFee` همیشه از موجودی نقدی پلتفرم کسر می‌شود.
- این زیر‌فیچر مخصوص پلتفرم‌های ایران است (طلا، نقره، مس، سکه).

> **Tax metadata**: تراکنش‌های این فیچر فیلدهای مشترک مالیاتی (`isTaxableEvent`, cost basis/proceeds/realizedGain, `taxYear`, …) را طبق قرارداد `Tax-Management.md` دارند تا محاسبه مالیات بعدی بدون از دست رفتن داده ممکن باشد.


---

## راهنمای پیاده‌سازی

### واحدها
- ذخیره فقط `quantityMg` (وزن ناخالص)
- `fineWeightMg = quantityMg × purityRatio` محاسبه‌ای — ذخیره نکن
- قیمت per mg همان عیار؛ 18K ≠ pure

### APIها (Atomic)
- `buyMetal` / `sellMetal` / `physicalDelivery` / platform cash deposit-withdraw
- instrumentId قیمت: `metalType_purity` (مثلاً gold_18k)
- `rebuildMetalsHolding` / `reconcileMetalsHolding` / `reconcileMetalsPlatformCash`

### تست
خرید 1g 18K؛ delivery؛ platform cash vs bank؛ purity اشتباه نپذیرد

### مثال عددی عیار و وزن (تست)

```
خرید: 1 گرم طلای ۱۸ عیار
quantityMg = 1000
purity = 18k
purityRatio = 18/24 = 0.75
fineWeightMg (محاسبه‌ای) = 1000 × 0.75 = 750

قیمت روز طلای ۱۸ عیار: 3,000,000 IRR per gram → pricePerMg = 3,000
totalAmount = 1000 × 3000 = 3,000,000

اشتباه ممنوع:
  ارزش‌گذاری با قیمت ۲۴ عیار روی quantityMg=1000
  یا فرض fineWeightMg=1000 برای ۱۸ عیار

خرید دوم همان holding (همان metalType+purity):
  +500mg @ 3,200 per mg
  qty=1500, weighted average از totalInvested
```

Holding جدا برای `gold`+`24k` در برابر `gold`+`18k`.

---

## سکه در برابر وزن

| نوع holding | کمیت اصلی | وزن |
|-------------|-----------|------|
| طلا آب‌شده / شمش / ساخته | `quantityMg` (اجباری) | همان |
| سکه (`gold_coin` + purity emami/bahar/…) | **`quantityCoins`** (تعداد) اجباری | `quantityMg` مشتق از وزن استاندارد سکه × تعداد یا optional override |

```text
fineWeightMg = quantityMg × purityRatio
برای سکه: quantityMg = quantityCoins × standardWeightMg(coinType) مگر وزن واقعی ثبت شود
قیمت سکه می‌تواند حباب داشته باشد ≠ قیمت طلای هم‌وزن
اجرت ساخت: fee جدا (expense یا cost_basis_in طبق treatment)
```

---

## واحد canonical

**ذخیره همیشه `quantityMg` (میلی‌گرم).**  
UI: mg / g / kg فقط تبدیل نمایش (`0.5g = 500mg`). اختلاف واحد در DB ممنوع.

## Physical Delivery = Cross-Domain Atomic Operation

```text
one operationId:
  inv_metals (platform) −qty
  + physical_asset +qty
  + delivery fee legs
  + journal
```

**ممنوع:** کم کردن طلا پلتفرم بدون ثبت دارایی فیزیکی در همان op → Net Worth اشتباه.

`gold_type`: seke_emami \| seke_bahar \| 18ayar \| abshode \| … · weight (canonical mg) · labor_fee · is_physical.

---

## وزن داخلی: milligram (تأیید)

```text
quantityMg
purityRatio
fineWeightMg = quantityMg × purityRatio
```

1g طلای ۱۸ عیار ≠ 1g طلای خالص.

ذخیره canonical فقط **mg**؛ تبدیل g/kg/oz فقط در UI/import. از ذخیره هم‌زمان چند واحد جلوگیری می‌شود.

---

## مثقال (نمایش / ورودی ایران)

ذخیره canonical همچنان **mg**.  
ورودی/نمایش اختیاری: مثقال با ضریب ثابت versioned (تقریباً ۱ مثقال ≈ ۴.۶۰۸۳ گرم ≈ ۴۶۰۸.۳ mg).  
تبدیل فقط در مرز UI/import — نه واحد موازی در ledger.

## FEAT-P0 LOCK (Metals)

### Cash (P0-038)
v1 platform cash: **IRR-only** unless `cashPosition(currency)` multi-currency enabled.
Scalar `cashBalance` without currency = IRR-only scope explicit.

### Physical delivery (P0-039)
One atomic operation: digital holding ↓ + physical asset ↑ + fees + journal.
If Physical Assets disabled: standalone delivery record + later materialize — do not drop NW.

### Coin qty (P0-040)
Canonical storage: **quantityMg** (and purity).
`quantityCoins` = derived/display or auxiliary input that normalizes to mg — not a second SoT mass.

## FEAT-P0-038 DEEP
v1: platform cashBalance is IRR-only (documented scope). Multi-currency requires cashPosition(currency) rows — not ambiguous scalar.

## FEAT-P0-039 DEEP
Physical delivery operation must: decrease digital holding, create/increase physical asset, post fees, journal — same operationId. Forbid digital-only decrease.

## FEAT-P0-040 DEEP
quantityMg is SoT mass. quantityCoins is input helper: mg = coins × mgPerCoin(coinType). Never dual SoT.


## Delivery cost basis to Physical Assets (CROSS-CUTTING BATCH-3 §2)

On `physical_delivery`, PA acquisition cost = **historical carrying cost released** from the metals holding for delivered qty (cost-basis method on that holding).  
`deliveryFee` is cash only; include in PA basis only if `include_delivery_fee_in_basis=true` (default **false**). Always set `sourceOperationId` + cost on `pa_transactions`.

## Metals ME locks (P0)

Full ME-001…ME-010: `METALS-ME-001-010-LOCKS.md`

## Locks full text (from METALS-ME-001-010-LOCKS.md)

# Metals Locks ME-001 … ME-010 (P0)

---

## ME-001 — quantityMg is sole quantity SoT

- Storage/holding SoT quantity = **`quantityMg`** (gross mg).
- Coin counts = derived helper or input conversion only — not a second parallel SoT balance.

## ME-002 — quoteBasis mandatory

Every metals price observation: `quoteBasis` = `gross_metal` | `fine_metal` | `per_coin` | … (P0-061). Valuation must match basis.

## ME-003 — Purity-aware quotes

Price for 18K is not substitutable by 24K without explicit conversion policy. Quotes keyed by metalType + purityCode (and basis).

## ME-004 — Gold coin ≠ bullion

`gold_coin` (or per-coin instruments) separate instrument/quote semantics including premium/bubble; not bullion×purity only (P0-062).

## ME-005 — Platform cash

Platform cashBalance is **projection**; canonical cash via fin_account / venue cash model + CashSettlementPort. No competing prose SoT.

## ME-006 — Delivery request vs economic debit

| Status | Holding effect |
|--------|----------------|
| requested / processing | **no** economic qty debit (or reservation model only if explicitly documented) |
| delivered | economic transfer: metals qty down + PA lineage |

## ME-007 — Cancel after debit

If qty was debited before final delivery, **cancel requires Core reverse** (or compensating op). Prefer: no debit until delivered (ME-006).

## ME-008 — Fee categories

`deliveryFee` ≠ trading/spread fee. Separate FeeCategories / fee events; treatments independent.

## ME-009 — Metals → Physical cost

On delivered transfer: `sourceOperationId` + **transferred carrying cost** from metals holding (not mark price). See BATCH-3 §2 / P0-063.

## ME-010 — Making / labor / tax breakdown

Making charge, labor, VAT/tax components = explicit fee/tax component lines with treatment (cost vs expense vs tax event) — not one opaque “extra” amount.

---

## Status: ME-001…ME-010 **LOCKED** 2026-09-02


---

## Requirements Lock (MR-168 … MR-183) — 100% complete 2026-09-05

| # | Requirement | Status | Implementation |
|---|-------------|--------|----------------|
| MR-168 | Gold/silver support | ✅ LOCKED | `ref_instruments.asset_class = metal` + platforms |
| MR-169 | Gross weight | ✅ LOCKED | `inv_metals_holdings.quantity_mg` / tx `quantity_mg` (mg canonical) |
| MR-170 | Purity | ✅ LOCKED | `purity_code` + `purity_ratio` (0–1) |
| MR-171 | Fine weight | ✅ LOCKED | Derived: `quantity_mg × purity_ratio` (never stored as SoT) |
| MR-172 | Unit of weight | ✅ LOCKED | mg canonical; display conversion table only |
| MR-173 | Buy/sell price | ✅ LOCKED | `metal_price_per_mg` + total `amount` |
| MR-174 | Fabrication/premium | ✅ LOCKED | `premium_amount` **separate** from metal price (never folded into unit metal price) |
| MR-175 | Brokerage/dealer fee | ✅ LOCKED | `fee_amount` + `fee_currency` on transaction |
| MR-176 | Delivery fee | ✅ LOCKED | `inv_metals_physical_deliveries.fee_amount` (logistics only) |
| MR-177 | Physical delivery | ✅ LOCKED | `inv_metals_physical_deliveries` + link to `pa_assets` on completion |
| MR-178 | Account/location/custody | ✅ LOCKED | `inv_metals_platforms` + optional `fin_account_id` |
| MR-179 | Partial sales | ✅ LOCKED | `is_partial` + `quantity_mg ≤ holding.quantity_mg`; cost-basis releases proportional carrying |
| MR-180 | Historical cost | ✅ LOCKED | `total_invested` + `average_cost_per_mg` maintained by Cost-Basis Engine |
| MR-181 | Valuation price | ✅ LOCKED | `price_history` for metal instruments (quoteBasis per purity / per coin); offline last-known + manual override |
| MR-182 | FX if quoted in another currency | ✅ LOCKED | `exchange_rate_to_base` on every tx |
| MR-183 | Standalone mode | ✅ LOCKED | Feature-Independence-Contract; metals APIs usable without full ledger UI |

**Conservation rules:** premium and trade fee are distinct legs; delivery fee is a separate cash event; partial sell conserves cost basis (same as transferCost / economic-swap invariants).
