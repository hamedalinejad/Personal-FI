# گزارش بررسی مستندات — باگ‌ها و ارتقاها

تاریخ بررسی: مطابق آخرین کامیت این گزارش.
دامنه بررسی: تمام فایل‌های `docs/` (۲۹ سند، Core + همه فیچرها) با تمرکز ویژه روی روابط بین جداول، فیلدها و APIها، و بخش سرمایه‌گذاری/حسابداری طبق درخواست.

> این یک پروژه Documentation-First است (کد پیاده‌سازی هنوز نوشته نشده)؛ بنابراین «باگ» در این مرحله یعنی **ناسازگاری بین اسناد** (نام جدول/فیلد/enum که در یک سند یک‌جور و در سند دیگر جور دیگری تعریف شده)، **فیلد یا رابطه گم‌شده**، یا **قانونی که مبهم/ناقص مستند شده**. رفع این موارد الان (قبل از کدنویسی) بسیار ارزان‌تر از رفع باگ منطقی بعد از پیاده‌سازی است.

---

## ✅ رفع‌شده در همین بررسی

### باگ ۳۵ — تمایز واحد، عیار و وزن خالص در فلزات (Severity: High)
**محل:** `docs/features/05-Investment/05-04-Metals/Metals.md` + `19-04-Metals-Prices` + `db.md`
**شرح:** مدل قبلی `purity` را فقط روی Holding داشت و روی Transaction نداشت؛ وزن خالص (Fine Weight) تعریف نشده بود؛ خطر قاطی‌شدن `1g Gold 18K` با `1g pure gold` و اشتباه گرفتن mg/gram/ounce وجود داشت.
**راه‌حل اعمال‌شده:**
- واحد پایه ذخیره‌سازی فقط `quantityMg` (وزن **ناخالص**)؛ گرم/اونس فقط در UI
- `purity` + `purityRatio` اجباری روی Holding و Transaction (کد استاندارد، نه متن آزاد)
- `fineWeightMg = quantityMg × purityRatio` فقط محاسبه برای گزارش؛ ذخیره نمی‌شود
- کلید یکتای Holding: `(platformId, metalType, purity)`
- قیمت و میانگین همیشه per-mg **همان عیار**؛ Unrealized از `getLatestMetalPrice(metalType, purity)`
- جدول تبدیل واحد (mg/g/kg/troy oz) در Business Rules
- همگام‌سازی `Metals-Prices.md` و نمونه Schema در `db.md`


### باگ ۳۴ — تمایز قطعی NAV و قیمت معامله در صندوق‌های درآمد ثابت (Severity: High)
**محل:** `docs/features/05-Investment/05-03-Fixed-Income-Funds/Fixed-Income-Funds.md` (Domain Entities + منطق محاسبه)
**شرح:** مدل قبلی فقط یک فیلد `price` داشت که هم به‌عنوان NAV و هم به‌عنوان قیمت واحد معامله استفاده می‌شد. در صندوق‌های صدور/ابطال ایران، NAV، قیمت صدور (subscription) و قیمت ابطال (redemption) اغلب در یک روز با هم متفاوت‌اند. این باعث می‌شد میانگین خرید، Realized P&L و Unrealized P&L اشتباه محاسبه شوند.
**راه‌حل اعمال‌شده:**
- در `inv_fif_transactions`: فیلد `price` حذف و جایگزین شد با:
  - `nav` → NAV در تاریخ تراکنش (برای nav_update و snapshot)
  - `transactionPrice` → قیمت واقعی معامله (صدور در buy/reinvest، ابطال در sell)
- در `inv_fif_holdings`: توضیح صریح تمایز `currentNAV` و `averageBuyPrice` + فیلدهای اختیاری `lastSubscriptionPrice` و `lastRedemptionPrice`
- منطق Weighted Average و Realized P&L فقط بر اساس `transactionPrice`؛ Unrealized P&L بر اساس `currentNAV`
- Business Rules خرید/فروش به‌روز شد تا صریحاً از کدام قیمت استفاده شود
- اسناد مرتبط همگام‌سازی شدند:
  - `docs/core/db/db.md` — نمونه Schema مفهومی `InvFifHolding` و `InvFifTransaction`
  - `docs/features/19-Price-Fetching/19-03-Fund-NAV/Fund-NAV.md` — مرز مسئولیت: فقط NAV
  - `docs/features/19-Price-Fetching/Price-Fetching.md` — یادآوری تمایز NAV در برابر transactionPrice


### باگ ۱ — نام جدول بدون پیشوند در سند Crypto
**محل:** `docs/features/05-Investment/05-01-Investment-Crypto/Investment-Crypto.md` (خطوط ~۳۷، ۹۷، ۲۳۷، ۲۴۱)
**شرح:** سند چندین‌بار جداول را با نام `crypto_holdings`، `crypto_transactions`، `crypto_exchange_transactions` (بدون پیشوند `inv_`) ارجاع داده بود، در حالی‌که فهرست مرکزی جداول در `db.md` این جداول را با نام‌های `inv_crypto_holdings`، `inv_crypto_transactions`، `inv_crypto_exchange_transactions` تعریف کرده. اگر این ناهماهنگی در مرحله کدنویسی دیده نمی‌شد، احتمال ساخته‌شدن جدول با نام اشتباه یا Query شکسته وجود داشت.
**راه‌حل اعمال‌شده:** همه ارجاع‌ها در سند Crypto با پیشوند صحیح `inv_` جایگزین شد تا با `db.md` یکی باشد.

### باگ ۲ — ناسازگاری مقدار enum فیلد `type` در واریز/برداشت صرافی
**محل:** `Investment-Crypto.md`، بخش «Domain Entities → ۴. Crypto Exchange Transaction» در برابر بخش «APIهای داخلی»
**شرح:** فیلد `inv_crypto_exchange_transactions.type` به‌عنوان enum با مقادیر `deposit` / `withdraw` تعریف شده بود، اما در بخش API همان سند نوشته شده بود `createExchangeTransaction(data)` → `type='deposit-investment'` / `type='withdrawal-investment'` — که در واقع مقدار enum فیلد `acc_transactions.type` است، نه `inv_crypto_exchange_transactions.type`. این ابهام می‌توانست باعث شود پیاده‌ساز مقدار غلط را در جدول غلط بریزد.
**راه‌حل اعمال‌شده:** خط API به‌صراحت هر دو enum را جدا و برچسب‌گذاری کرد: `inv_crypto_exchange_transactions.type='deposit'|'withdraw'` در برابر `acc_transactions.type='deposit-investment'|'withdrawal-investment'`.

### باگ ۳ — جدول `ln_rate_history` در فهرست مرکزی جداول ثبت نشده بود
**محل:** `docs/core/db/db.md`، بخش «لیست مرکزی همه‌ی جدول‌ها»
**شرح:** جدول `ln_rate_history` (تاریخچه نرخ سود برای وام‌های Variable) با جزئیات کامل در `Debt-Loan-Management.md` تعریف شده، اما در فهرست مرکزی جداول `db.md` — که طبق خودِ سند «فهرست مرکزی همه جداول» است — وجود نداشت. چنین جدولی که در فهرست مرکزی نباشد به‌راحتی در پیاده‌سازی Migration فراموش می‌شود.
**راه‌حل اعمال‌شده:** ردیف `ln_rate_history` به جدول فهرست مرکزی در `db.md` اضافه شد.

### باگ ۴ — مثال ناقص از enum مقادیر `acc_transactions.type`
**محل:** `docs/features/00-Accounts-Banking/Accounts-Banking.md`
**شرح:** سند حساب‌ها یک لیست نمونه (نه ارجاع به enum مرکزی) از مقادیر `type` آورده بود که مقدار `deposit-loan` (استفاده‌شده در `Debt-Loan-Management.md` برای وام‌های دریافتی) و چند مقدار دیگر (`withdrawal-cheque`, `deposit-cheque`, مقادیر مالیاتی) در آن نبود؛ در حالی‌که enum کامل و رسمی در `core/types/types.md` (`TransactionType`) تعریف شده بود. خطر: پیاده‌ساز که فقط این سند فیچر را می‌خواند فکر می‌کرد `deposit-loan` وجود ندارد.
**راه‌حل اعمال‌شده:** خط مربوطه در `Accounts-Banking.md` به‌جای تکرار دستی لیست، مستقیماً به enum مرکزی `TransactionType` در `types.md` ارجاع داده شد و کل لیست کامل مقادیر هم به‌صورت کامل آورده شد.

### باگ ۵ — نبود جدول شبکه بلاکچین برای والت‌ها (Severity: High)
**محل:** `docs/features/05-Investment/05-01-Investment-Crypto/Investment-Crypto.md`، بخش «Domain Entities → ۱. Crypto Exchange / Wallet» و «۲. Crypto Holding»
**شرح:** مدل `inv_crypto_exchanges` فقط با `exchangeId` یک والت را تعریف می‌کرد؛ هیچ فیلدی برای شبکه بلاکچین (`network`)، آدرس عمومی والت (`address`)، یا نگهداری چندگانه (`custodyAccount`) وجود نداشت. این مشکل باعث می‌شد که کاربری که USDT روی هر سه شبکه `TRC20`، `ERC20` و `BEP20` دارد، نتواند این دارایی‌های کاملاً متمایز را جداگانه ثبت و پیگیری کند — آدرس‌های متفاوت، موجودی‌های متفاوت، و مسیرهای انتقال متفاوت در یک ردیف واحد له می‌شدند. در حالت پیاده‌سازی قبلی، انتقال از شبکه اشتباه ممکن بود بدون هشدار ثبت شود.
**راه‌حل اعمال‌شده:**
- جدول جدید `inv_crypto_wallet_networks` اضافه شد با فیلدهای `network`، `custodyAccount`، `address`، و `isActive`.
- فیلد `networkId` (nullable FK) به `inv_crypto_holdings` اضافه شد تا هر Holding دقیقاً به شبکه‌ای که روی آن است لینک شود.
- فیلد `network` (nullable) به `inv_crypto_transactions` (برای `transfer_in`/`transfer_out`) و `inv_crypto_exchange_transactions` (برای واریز/برداشت) اضافه شد.
- جدول `inv_crypto_wallet_networks` به فهرست مرکزی جداول `db.md` اضافه شد.

---

## ⚠️ نیازمند تصمیم محصولی (فقط ثبت شد — تغییر اعمال نشد چون به تصمیم شما نیاز دارد)

### مورد ۵ — نبود جدول قیمت مستقل قبل از این بررسی
**محل:** کل بخش Investment (Crypto/Stocks/FIF/Metals)
**شرح:** پیش از این بررسی، هیچ سندی مشخص نمی‌کرد قیمت لحظه‌ای رمزارز/سهام/فلز از کجا و چطور تأمین و کش می‌شود؛ فقط یک جمله کلی «قیمت لحظه‌ای می‌تواند از API خارجی + کش آفلاین تأمین شود» در `Investment-Crypto.md` بود بدون جدول یا API مشخص. این دقیقاً همان نیازی بود که در پیام شما خواسته شده بود.
**راه‌حل اعمال‌شده:** فیچر جدید `19-Price-Fetching` (به همراه زیرفیچر `19-01-Crypto-Prices`) با جداول `price_sources` و `price_history` ساخته و به `db.md`، `Product-Map-FA/EN.md` و `Pages-IA.md` اضافه شد (جزئیات کامل در فایل‌های همان فیچر).

### مورد ۶ — عدم قطعیت Provider قیمت کریپتو
**محل:** `19-01-Crypto-Prices/Crypto-Prices.md`
**شرح:** این سند عمداً یک API خاص (مثلاً Nobitex یا CoinGecko) را قفل نکرده، چون انتخاب Provider (نرخ محدودیت درخواست، نیاز به کلید API، پوشش نمادها، هزینه) یک تصمیم محصولی/فنی است که باید جدا از این بررسی مستندسازی گرفته شود. فیلد `price_sources.baseUrl` و `requiresApiKey` برای هر Provider که انتخاب شود آماده است.
**نیاز به تصمیم شما:** کدام سرویس(ها) برای دریافت قیمت کریپتو (و بعداً سهام/مسکن/فلزات ایران) استفاده شود؟

---

## 📋 نکات کیفیت مستندات (جزئی — فقط برای اطلاع، نیازی به اقدام فوری ندارند)

- سند `Accounts-Banking.md` مقدار enum را قبلاً به‌صورت متن آزاد می‌نوشت به‌جای ارجاع به `types.md`؛ این الگو (تکرار دستی enum به‌جای ارجاع) در چند سند دیگر هم دیده می‌شود (مثلاً `loanType` در `Debt-Loan-Management.md`) — پیشنهاد می‌شود در آینده همه enumهای مشترک فقط در `types.md` تعریف و بقیه اسناد فقط ارجاع دهند تا از این نوع Drift دوباره جلوگیری شود.
- شماره‌گذاری فیچرها در `Product-Map-FA/EN.md` (۱ تا ۱۹) با شماره‌گذاری پوشه‌های `docs/features/` (۰۰ تا ۱۸ به‌علاوه ۹۹-Common-Categories) یکی نیست (اختلاف ۱ واحدی چون Product-Map از ۱ شروع می‌شود و پوشه‌ها از ۰۰). این خودش باگ نیست (دو سیستم شماره‌گذاری متفاوت و مستقل‌اند) اما در مکالمه بین تیم می‌تواند گیج‌کننده باشد؛ فیچر جدید Price Fetching برای همین به‌عنوان «۲۰» در Product-Map و «۱۹-Price-Fetching» در پوشه‌ها اضافه شد، دقیقاً با همین offset یک‌واحدی موجود، تا با الگوی فعلی ناسازگار نباشد.

---

## نتیجه‌گیری

هیچ باگ منطقی/محاسباتی بزرگی در فرمول‌های حسابداری، وام یا کریپتو پیدا نشد — بخش‌های Debt & Loan و Investment-Crypto از نظر فرمول (Weighted Average، Realized/Unrealized P&L، انواع محاسبه قسط) کامل و داخلی سازگار بودند. باگ‌های پیداشده همگی از نوع «Drift بین اسناد» (نام جدول/فیلد که در یک‌جا به‌روز شده ولی در جای دیگر نه) بودند که در این بررسی رفع شدند، به‌علاوه یک فیچر کاملاً جدید (دریافت قیمت‌ها) که طبق درخواست شما اضافه شد.

