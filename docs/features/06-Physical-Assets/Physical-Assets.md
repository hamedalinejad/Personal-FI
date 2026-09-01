# فیچر: Physical Assets (دارایی‌های فیزیکی)

## توضیح کلی

این فیچر مسئولیت مدیریت **دارایی‌های فیزیکی** کاربر را بر عهده دارد. 
شامل طلا و سکه فیزیکی، خودرو، املاک، لوازم گران‌قیمت و سایر دارایی‌هایی است که کاربر واقعاً مالک آن‌هاست و نزد خود نگهداری می‌کند.

تفاوت مهم با زیر‌فیچر Metals:
- **Metals** → سرمایه‌گذاری دیجیتال در پلتفرم‌های آنلاین (میلی، گرمی و ...) با امکان تحویل فیزیکی
- **Physical Assets** → دارایی‌هایی که هم‌اکنون به صورت فیزیکی در اختیار کاربر است

مبالغ به **ارز معامله** ثبت می‌شوند؛ در هر رویداد `exchangeRateToBase` (ارز معامله → baseCurrency کاربر) ذخیره می‌شود.

---

## User Stories

### Must Have
- ثبت دارایی فیزیکی جدید (طلا، سکه، خودرو، ملک، سایر)
- ثبت خرید دارایی (با اتصال به حساب بانکی)
- ثبت فروش دارایی
- ثبت ارزش‌گذاری دوره‌ای (قیمت روز)
- مشاهده لیست دارایی‌ها و ارزش فعلی آن‌ها
- محاسبه سود و زیان (تحقق‌یافته و تحقق‌نیافته)
- مشاهده ارزش کل دارایی‌های فیزیکی
- ذخیره `exchangeRateToBase` هر رویداد

### Should Have
- دسته‌بندی دارایی‌ها
- افزودن تصویر و پیوست (سند، فاکتور، سند ملک)
- ثبت هزینه نگهداری (بیمه، تعمیرات، مالیات و ...)
- یادآوری ارزش‌گذاری دوره‌ای
- انتقال از Metals به Physical Assets پس از تحویل فیزیکی

---

## Business Rules

1. `exchangeRateToBase` در هر رکورد تراکنش ذخیره می‌شود (نرخ تبدیل ارز تراکنش → `baseCurrency` کاربر — قرارداد کامل در `Currency-CrossRate.md`).
2. **الگوی نگهداری دارایی‌ها:**
 - برای دسته‌های `gold` و `coin` (قابل‌تفکیک و هم‌ارز): خرید بیشتر همان نوع دارایی، `quantity` و `averageBuyPrice` (Weighted Average) را روی همان asset آپدیت می‌کند.
 - برای دسته‌های `vehicle`, `real_estate`, `electronics`, `other` (غیرقابل‌تفکیک): هر خرید یک asset جدید مستقل است.
3. هنگام **خرید دارایی**:
 - موجودی حساب بانکی کاهش می‌یابد.
 - تراکنش در `acc_transactions` با `type = 'withdrawal-investment'` و `relatedFeature = 'physical_assets'` ثبت می‌شود (هم‌راستا با Metals/FIF/Crypto — خرید دارایی سرمایه‌گذاری است، نه هزینه معمولی).
 - دارایی جدید (یا به‌روزرسانی موجود) با قیمت خرید ثبت می‌گردد.
4. هنگام **فروش دارایی** (`type = 'sale'`):
 - موجودی حساب بانکی افزایش می‌یابد.
 - تراکنش در `acc_transactions` با `type = 'deposit-investment'` و `relatedFeature = 'physical_assets'` ثبت می‌شود (هم‌راستا با Metals/FIF/Crypto — فروش دارایی درآمد معمولی نیست).
 - سود/زیان تحقق‌یافته محاسبه می‌شود.
 - `quantity` دارایی به اندازه `quantitySold` کاهش می‌یابد.
 - `quantity` نمی‌تواند منفی شود (یعنی `quantitySold` نمی‌تواند از `quantity` فعلی بیشتر باشد).
 - اگر پس از کاهش `quantity = 0` شود (یعنی `quantitySold` برابر کل موجودی قبل از فروش بود)، وضعیت دارایی به `sold` تغییر می‌کند؛ در غیر این صورت دارایی `active` می‌ماند (فروش جزئی).
5. **فروش جزئی در برابر فروش کامل:**
 - هیچ نوع تراکنش جداگانه‌ای وجود ندارد؛ هر دو حالت با همان `type = 'sale'` ثبت می‌شوند و تنها با مقایسه `quantitySold` نسبت به `quantity` پیش از فروش (فروش کامل) یا کمتر از آن (فروش جزئی) تشخیص داده می‌شوند.
 - `averageBuyPrice` بدون تغییر باقی می‌ماند؛ فقط `quantity` به اندازه `quantitySold` کاهش می‌یابد (در فروش کامل که `quantity` به صفر می‌رسد، مقدار `averageBuyPrice` بی‌اثر می‌شود — هم‌راستا با الگوی Metals/Crypto پروژه).
 - `purchasePrice` (کل هزینه اولیه) تغییر نمی‌کند.
6. **ارزش‌گذاری دوره‌ای:**
 - کاربر می‌تواند قیمت روز دارایی را ثبت کند.
 - ارزش فعلی پرتفوی بر اساس آخرین ارزش‌گذاری محاسبه می‌شود.
7. **وضعیت `written_off` (از دست رفته/سوخته):**
 - اگر دارایی به `written_off` تغییر وضعیت دهد، زیان تحقق‌یافته به اندازه `currentValue` ثبت می‌شود.
 - `currentValue` به `0` تنظیم می‌شود.
8. هزینه‌های نگهداری (بیمه، تعمیر، مالیات) قابل ثبت هستند و در محاسبه بازده واقعی لحاظ می‌شوند.
9. موجودی حساب بانکی نمی‌تواند منفی شود.
10. حذف فیزیکی وجود ندارد — فقط تغییر وضعیت (`active`, `sold`, `written_off`).

---

## Domain Entities

### ۱. Physical Asset (جدول: `pa_assets`)

- `id` → UUID (Primary Key)
- `name` → string (نام دارایی — مثلاً «سکه تمام بهار آزادی ۱۴۰۳» یا «پراید ۱۳۹۸»)
- `category` → string (`gold`, `coin`, `vehicle`, `real_estate`, `electronics`, `other`)
- `subCategory` → string (اختیاری — مثلاً نوع سکه یا مدل خودرو)
- `quantity` → decimal (تعداد یا متراژ)
- `unit` → string (`piece`, `gram`, `kilogram`, `square_meter`, ...)
- `purchasePrice` → decimal (قیمت خرید کل — ریال)
- `purchaseDate` → datetime
- `currentValue` → decimal (آخرین ارزش‌گذاری — ریال)
- `currentValueDate` → datetime
- `averageBuyPrice` → decimal (قیمت خرید به ازای واحد):
 - **Weighted Average (چند خرید روی یک asset):** فقط برای `gold` و `coin` — هر خرید بعدی این مقدار را با فرمول Weighted Average به‌روز می‌کند
 - **قیمت خرید ثابت اولیه (یک خرید = یک asset):** برای `vehicle`, `real_estate`, `electronics`, `other` — چون هر خرید یک asset مستقل است (Business Rule #2)، این فیلد برابر `totalCost / quantity` همان خرید اولیه است و هرگز با خرید بعدی به‌روز نمی‌شود
- `status` → string (`active`, `sold`, `written_off`)
- `location` → string (محل نگهداری — اختیاری)
- `description` → string
- `hasAttachment` → boolean
- `attachmentPath` → string
- `accountId` → UUID (حساب بانکی مرتبط با اولین خرید — nullable)

> **نکته طراحی — `accountId` برای خریدهای بعدی**:
> - برای دسته‌های `vehicle`, `real_estate`, `electronics`, `other` (غیرقابل‌تفکیک): هر خرید یک asset جدید مستقل است، پس `accountId` همیشه همان حساب خرید آن asset است.
> - برای دسته‌های `gold` و `coin` (قابل‌تفکیک): چند خرید روی همان asset انجام می‌شود. `accountId` در `pa_assets` **ثابت می‌ماند** و نشان‌دهنده حساب اولین خرید است. خریدهای بعدی `accountId` خود را در `pa_transactions.accountId` ذخیره می‌کنند.
> - برای دریافت همه حساب‌های مرتبط با یک asset: از `pa_transactions` با `assetId` استفاده کنید.
- `exchangeRateToBase` → decimal (نرخ تبدیل ارز تراکنش → `baseCurrency` کاربر در لحظه ثبت (؛ نه الزاماً ریال/تتر — قرارداد کامل در `Currency-CrossRate.md`))
- `createdAt` → datetime
- `updatedAt` → datetime

> **نکته مهم - فیلد `purchaseTransactionId` حذف شد**: 
> - برای دسته‌های قابل‌تفکیک (`gold`, `coin`): ممکن است دارایی چند بار خریداری شود و `averageBuyPrice` به‌روزرسانی شود 
> - برای دسته‌های غیرقابل‌تفکیک (`vehicle`, `real_estate`, `electronics`, `other`): `averageBuyPrice` برابر `totalCost / quantity` همان خرید اولیه است و هرگز با Weighted Average به‌روز نمی‌شود، چون هر خرید یک asset جدید مستقل است (Business Rule #2) 
> - فیلد `purchaseTransactionId` در این حالت معنای نامشخص دارد (به کدام خرید اشاره دارد؟) 
> - برای ردیابی تمام خریدها، از جدول `pa_transactions` استفاده کنید 
> - در صورت نیاز به لینک به تراکنش خرید اصلی، می‌توانید از `pa_transactions` با `assetId` استفاده کنید

### ۲. Physical Asset Valuation (جدول: `pa_valuations`)

- `id` → UUID
- `assetId` → UUID
- `value` → decimal (ارزش ثبت‌شده — ریال)
- `exchangeRateToBase` → decimal (نرخ تبدیل ارز تراکنش → `baseCurrency` کاربر در لحظه ثبت (؛ نه الزاماً ریال/تتر — قرارداد کامل در `Currency-CrossRate.md`))
- `note` → string
- `date` → datetime
- `createdAt` → datetime

### ۳. Physical Asset Transaction (جدول: `pa_transactions`)

- `id` → UUID
- `assetId` → UUID
- `type` → string (`purchase`, `sale`, `expense`, `write_off`)
 - `write_off`: هنگامی که دارایی به وضعیت `written_off` تغییر می‌کند؛ `amount` برابر با ارزش جاری دارایی (`currentValue`) در لحظه رونویسی است و جهت آن منفی (زیان) ثبت می‌شود
- `amount` → decimal
- `quantitySold` → decimal (nullable — فقط برای `type = 'sale'`؛ مقدار فروخته‌شده. اگر برابر با کل `quantity` دارایی قبل از این فروش باشد، فروش کامل محسوب می‌شود، در غیر این صورت فروش جزئی)
- `feeAmount` → decimal
- `feeCurrency` → string
- `exchangeRateToBase` → decimal (نرخ تبدیل ارز تراکنش → `baseCurrency` کاربر در لحظه ثبت (؛ نه الزاماً ریال/تتر — قرارداد کامل در `Currency-CrossRate.md`))
- `accountId` → UUID (nullable)
- `accountTransactionId` → UUID (لینک به `acc_transactions`)
- `description` → string
- `date` → datetime
- `createdAt` → datetime

### ۴. acc_transactions

- در خرید و فروش دارایی و هزینه‌های مرتبط ثبت می‌شود.

---

## APIهای داخلی

### Asset APIs
- `createAsset(data)` → ثبت دارایی جدید + در صورت خرید، ثبت تراکنش بانکی
- `updateAsset(id, data)`
- `getAllAssets(filters)` → فیلتر بر اساس دسته، وضعیت و ...
- `getAssetById(id)`
- `changeAssetStatus(id, status)` → تغییر وضعیت دارایی؛ **هنگام تغییر به `written_off`**: به‌صورت atomic هم `pa_assets.status = 'written_off'` و `currentValue = 0` را به‌روز می‌کند، هم یک رکورد `pa_transactions` از نوع `write_off` با `amount = -currentValue` (مقدار قبل از صفرشدن) می‌سازد تا زیان تحقق‌یافته در Immutable Log ثبت بماند

### Valuation APIs
- `addValuation(assetId, value, date, note?)` → ثبت ارزش‌گذاری جدید
- `getValuations(assetId)`
- `getLatestValuation(assetId)`

### Transaction APIs
- `createAssetTransaction(data)` → خرید، فروش، هزینه نگهداری
- `sellAsset(assetId, amount, date, accountId)` → فروش کامل یا جزئی
- `getAssetTransactions(assetId)`

### Portfolio APIs
- `getPortfolioValue` → ارزش کل دارایی‌های فیزیکی (ریال + معادل تتری)
- `calculateProfitLoss(assetId?)` → سود/زیان تحقق‌یافته و تحقق‌نیافته؛ **سود/زیان تحقق‌یافته** = جمع `amount` تمام رکوردهای `pa_transactions` با `type = 'sale'` یا `type = 'write_off'` (هر دو نوع در یک جمع یکپارچه از روی Transaction Log، بدون نیاز به اسکن جداگانه `pa_assets.status`)
- `getAssetsByCategory`

---

## روابط با سایر فیچرها

- **Accounts & Banking**: خری��، فروش و هزینه‌های مرتبط
- **Currency & Multi-Currency**: نرخ تتر لحظه‌ای
- **Metals**: پس از تحویل فیزیکی می‌توان دارایی را از Metals به اینجا منتقل کرد
- **Reports / Dashboard / Portfolio**: ارزش کل دارایی‌های فیزیکی و سود/زیان
- **Document Management**: نگهداری سند ملک، فاکتور خرید و تصاویر

---

## دسته‌بندی‌های پیشنهادی

| دسته | مثال‌ها |
|------|---------|
| `gold` | طلای آب‌شده فیزیکی، شمش |
| `coin` | سکه امامی، بهار آزادی، گرمی |
| `vehicle` | خودرو، موتورسیکلت |
| `real_estate` | خانه، زمین، مغازه |
| `electronics` | لپ‌تاپ، موبایل گران‌قیمت، دوربین |
| `other` | فرش، آثار هنری، ساعت و ... |

---

## نکات طراحی

- ارزش فعلی پرتفوی بر اساس **آخرین ارزش‌گذاری** هر دارایی محاسبه می‌شود.
- اگر ارزش‌گذاری ثبت نشده باشد، از قیمت خرید به عنوان ارزش فعلی استفاده می‌شود.
- هزینه‌های نگهداری در محاسبه بازده واقعی (Real Return) لحاظ می‌شوند.
- پس از فروش کامل، وضعیت دارایی `sold` می‌شود و از محاسبات پرتفوی فعال خارج می‌گردد.
- امکان فروش جزئی (مثلاً فروش بخشی از سکه‌ها) پشتیبانی می‌شود.
- نرخ تتر در خرید، فروش و هر ارزش‌گذاری ذخیره می‌شود تا گزارش‌های تاریخی دقیق باشند.
- برای دسته‌های `gold` و `coin`: `averageBuyPrice` فقط هنگام **خرید** با Weighted Average به‌روزرسانی می‌شود — هنگام فروش بدون تغییر باقی می‌ماند.
- برای دسته‌های غیرقابل‌تفکیک (`vehicle`, `real_estate`, `electronics`, `other`): هر خرید یک asset جدید مستقل است؛ `averageBuyPrice` یعنی `totalCost / quantity` همان خرید اولیه — Weighted Average اعمال نمی‌شود.

---

## تفاوت با سایر فیچرهای مرتبط

| فیچر | ماهیت |
|------|------|
| **Metals** | سرمایه‌گذاری دیجیتال در پلتفرم‌های آنلاین طلا/نقره/مس |
| **Physical Assets** | دارایی فیزیکی که کاربر واقعاً در اختیار دارد |
| **Stocks Iran** | سهام بورس ایران |
| **Crypto** | رمزارز |

---

## راهنمای پیاده‌سازی
- دسته‌های `gold`/`coin` فیزیکی ≠ Metals پلتفرمی؛ انتقال از Metals با delivery باید دو فیچر را atomic لینک کند (یا دو op با related ids)
- `exchangeRateToBase` اجباری روی تراکنش
- rebuild از `pa_transactions`؛ snapshot ارزش روز از قیمت/ارزش‌گذاری دستی

## ساده نگه دارید

فقط: Asset · Acquisition · Disposal · Valuation · Document. نه ERP.

## FEAT-P0 LOCK (Physical)

### Write-off (P0-042)
Record `carryingAmountBeforeWriteOff` and loss/impairment explicitly. Setting currentValue=0 is snapshot, not the loss amount itself.

### Acquisitions (P0-043)
Header = identity; purchase facts in `pa_transactions` (cost, qty, date, settlement). Header price/date = legacy/snapshot only.

## FEAT-P0-041 LOCK (Physical realized P&L)

On disposal/sale:
```text
realized = netProceeds - carryingAmountReleased
```
Not `salePrice - purchasePrice` alone when multiple acquisitions or impairments exist.
Carrying amount from acquisition costs (± impairments) via pa_transactions rebuild.

