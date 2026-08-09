# فیچر: Physical Assets (دارایی‌های فیزیکی)

## توضیح کلی

این فیچر مسئولیت مدیریت **دارایی‌های فیزیکی** کاربر را بر عهده دارد.  
شامل طلا و سکه فیزیکی، خودرو، املاک، لوازم گران‌قیمت و سایر دارایی‌هایی است که کاربر واقعاً مالک آن‌هاست و نزد خود نگهداری می‌کند.

تفاوت مهم با زیر‌فیچر Metals:
- **Metals** → سرمایه‌گذاری دیجیتال در پلتفرم‌های آنلاین (میلی، گرمی و ...) با امکان تحویل فیزیکی
- **Physical Assets** → دارایی‌هایی که هم‌اکنون به صورت فیزیکی در اختیار کاربر است

تمام مبالغ به **ریال** ثبت می‌شوند و در هر رویداد **نرخ تتر لحظه** ذخیره می‌شود تا بتوان ارزش دارایی‌ها را نسبت به دلار/تتر نیز مقایسه کرد.

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
- ذخیره نرخ تتر لحظه هر رویداد

### Should Have
- دسته‌بندی دارایی‌ها
- افزودن تصویر و پیوست (سند، فاکتور، سند ملک)
- ثبت هزینه نگهداری (بیمه، تعمیرات، مالیات و ...)
- یادآوری ارزش‌گذاری دوره‌ای
- انتقال از Metals به Physical Assets پس از تحویل فیزیکی

---

## Business Rules

1. تمام مبالغ به ریال هستند و نرخ تتر لحظه در هر رکورد ذخیره می‌شود.
2. **الگوی نگهداری دارایی‌ها:**
   - برای دسته‌های `gold` و `coin` (قابل‌تفکیک و هم‌ارز): خرید بیشتر همان نوع دارایی، `quantity` و `averageBuyPrice` (Weighted Average) را روی همان asset آپدیت می‌کند.
   - برای دسته‌های `vehicle`, `real_estate`, `electronics`, `other` (غیرقابل‌تفکیک): هر خرید یک asset جدید مستقل است.
3. هنگام **خرید دارایی**:
   - موجودی حساب بانکی کاهش می‌یابد.
   - تراکنش در `acc_transactions` ثبت می‌شود.
   - دارایی جدید (یا به‌روزرسانی موجود) با قیمت خرید ثبت می‌گردد.
4. هنگام **فروش دارایی**:
   - موجودی حساب بانکی افزایش می‌یابد.
   - سود/زیان تحقق‌یافته محاسبه می‌شود.
   - `quantity` دارایی کاهش می‌یابد.
   - `quantity` نمی‌تواند منفی شود.
   - اگر `quantity = 0`، وضعیت دارایی به `sold` تغییر می‌کند.
5. **فروش جزئی (partial_sale):**
   - مقدار فروخته شده از `quantity` کم می‌شود.
   - `averageBuyPrice` با Weighted Average به‌روزرسانی می‌شود.
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
- `averageBuyPrice` → decimal (میانگین قیمت خرید به ازای واحد — فقط برای `gold`, `coin`, `electronics`; برای `vehicle`, `real_estate` مقدار ثابت یا قیمت کل بر واحد)
- `status` → string (`active`, `sold`, `written_off`)
- `location` → string (محل نگهداری — اختیاری)
- `description` → string
- `hasAttachment` → boolean
- `attachmentPath` → string
- `accountId` → UUID (حساب بانکی مرتبط با خرید — nullable)
- `exchangeRateToUSDT` → decimal (نرخ تتر لحظه خرید — ریال به ازای ۱ تتر، مثلاً ۶۰,۰۰۰)
- `createdAt` → datetime
- `updatedAt` → datetime

> **نکته مهم - فیلد `purchaseTransactionId` حذف شد**:  
> - برای دسته‌های قابل‌تفکیک (`gold`, `coin`): ممکن است دارایی چند بار خریداری شود و `averageBuyPrice` به‌روزرسانی شود  
> - برای دسته‌های غیرقابل‌تفکیک (`vehicle`, `real_estate`, `electronics`): `averageBuyPrice` به معنی قیمت خرید به ازای هر واحد است (برای مثال قیمت هر متر مربع برای املاک یا هر قطعه برای خودروها)  
> - برای `electronics`: `averageBuyPrice` میانگین قیمت خرید به ازای هر قطعه است (اگر چند قطعه خریده شود)  
> - فیلد `purchaseTransactionId` در این حالت معنای نامشخص دارد (به کدام خرید اشاره دارد؟)  
> - برای ردیابی تمام خریدها، از جدول `pa_transactions` استفاده کنید  
> - در صورت نیاز به لینک به تراکنش خرید اصلی، می‌توانید از `pa_transactions` با `assetId` استفاده کنید

### ۲. Physical Asset Valuation (جدول: `pa_valuations`)

- `id` → UUID
- `assetId` → UUID
- `value` → decimal (ارزش ثبت‌شده — ریال)
- `exchangeRateToUSDT` → decimal (نرخ تتر لحظه — ریال به ازای ۱ تتر، مثلاً ۶۰,۰۰۰)
- `note` → string
- `date` → datetime
- `createdAt` → datetime

### ۳. Physical Asset Transaction (جدول: `pa_transactions`)

- `id` → UUID
- `assetId` → UUID
- `type` → string (`purchase`, `sale`, `expense`, `partial_sale`)
- `amount` → decimal
- `feeAmount` → decimal
- `feeCurrency` → string
- `exchangeRateToUSDT` → decimal (نرخ تتر لحظه — ریال به ازای ۱ تتر، مثلاً ۶۰,۰۰۰)
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
- `changeAssetStatus(id, status)` → شامل تغییر به `written_off` با ثبت زیان

### Valuation APIs
- `addValuation(assetId, value, date, note?)` → ثبت ارزش‌گذاری جدید
- `getValuations(assetId)`
- `getLatestValuation(assetId)`

### Transaction APIs
- `createAssetTransaction(data)` → خرید، فروش، هزینه نگهداری
- `sellAsset(assetId, amount, date, accountId)` → فروش کامل یا جزئی
- `getAssetTransactions(assetId)`

### Portfolio APIs
- `getPortfolioValue()` → ارزش کل دارایی‌های فیزیکی (ریال + معادل تتری)
- `calculateProfitLoss(assetId?)` → سود/زیان تحقق‌یافته و تحقق‌نیافته
- `getAssetsByCategory()`

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
- برای دسته‌های `gold` و `coin`: `averageBuyPrice` با Weighted Average به‌روزرسانی می‌شود.
- برای دسته‌های غیرقابل‌تفکیک (`vehicle`, `real_estate`, `electronics`): هر خرید یک asset جدید مستقل است.

---

## تفاوت با سایر فیچرهای مرتبط

| فیچر | ماهیت |
|------|------|
| **Metals** | سرمایه‌گذاری دیجیتال در پلتفرم‌های آنلاین طلا/نقره/مس |
| **Physical Assets** | دارایی فیزیکی که کاربر واقعاً در اختیار دارد |
| **Stocks Iran** | سهام بورس ایران |
| **Crypto** | رمزارز |