# گزارش بررسی مستندات — باگ‌ها و ارتقاها

تاریخ بررسی: مطابق آخرین کامیت این گزارش.
دامنه بررسی: تمام فایل‌های `docs/` (۲۹ سند، Core + همه فیچرها) با تمرکز ویژه روی روابط بین جداول، فیلدها و APIها، و بخش سرمایه‌گذاری/حسابداری طبق درخواست.

> این یک پروژه Documentation-First است (کد پیاده‌سازی هنوز نوشته نشده)؛ بنابراین «باگ» در این مرحله یعنی **ناسازگاری بین اسناد** (نام جدول/فیلد/enum که در یک سند یک‌جور و در سند دیگر جور دیگری تعریف شده)، **فیلد یا رابطه گم‌شده**، یا **قانونی که مبهم/ناقص مستند شده**. رفع این موارد الان (قبل از کدنویسی) بسیار ارزان‌تر از رفع باگ منطقی بعد از پیاده‌سازی است.

---

## ✅ رفع‌شده در همین بررسی

### BUG-031 — Multi-tab sql.js
**راه‌حل:** navigator.locks + db version optimistic; conflict → reload; no silent LWW.

### BUG-032 — Version check vs offline
**راه‌حل:** sole default network exception; toggleable; documented in onboarding/settings.

### BUG-033 — API key lifecycle
**راه‌حل:** per-provider session keys; clear on tab close/crash; never in logs/backup.

### BUG-034 — Event bus money as string
**راه‌حل:** reinforce all financial event payloads are decimal strings.

### BUG-035 — Unify fetch result types
**راه‌حل:** ProviderFetchResult → map to single PriceFetchResult public API.

### BUG-036 — price_history instrumentId
**راه‌حل:** assetCategory + instrumentId; symbol not sole identity (FIF fundId).

### BUG-037/038 — Quote + marketDate
**راه‌حل:** marketDate + quoteType; latest for NAV/stock by marketDate not only fetchedAt.

### BUG-039 — Route sprawl
**راه‌حل:** prefer generic sheets; justify new sub-routes; bookmark only key paths.

### BUG-040 — Enforce feature boundaries
**راه‌حل:** public-api imports + ESLint/arch tests required at implementation.


### BUG-026 — Declining rate vs frequency
**راه‌حل:** r فقط از getPeriodRate؛ weekly/52، quarterly/4، custom days/365؛ ممنوع annual/12 ثابت در فرمول اصلی.

### BUG-027 — interestRatePeriod در فرمول
**راه‌حل:** monthly rate از طریق نرمال‌سازی در getPeriodRate وارد می‌شود؛ هیچ فرمول مستقیمی /12 بدون توجه به period.

### BUG-028 — Grace vs frequency
**راه‌حل:** gracePeriodCount (تعداد period) مقدم؛ یا تبدیل gracePeriodMonths با periodsPerYear/12.

### BUG-029 — Loan exchangeRateToBase
**راه‌حل:** نرخ به baseCurrency کاربر؛ هم‌راستا با BUG-003.

### BUG-030 — Fee tiers JSON
**راه‌حل:** جدول ln_loan_fee_tiers رابطه‌ای؛ JSON deprecated.


### BUG-021 — Tax payment double ledger
**راه‌حل:** فقط یک acc_transactions با type اختصاصی Tax داخل markAsPaid/payTax؛ ممنوع Expense عمومی + Tax جدا.

### BUG-022 — taxYear بدون تقویم
**راه‌حل:** جفت taxYear + taxCalendar (jalali|gregorian) اجباری.

### BUG-023 — RelatedFeature ناقص
**راه‌حل:** گسترش Union + قانون افزودن فقط از types.md؛ bills/documents/price/accounts اضافه شد.

### BUG-024 — Polymorphic weak integrity
**راه‌حل:** validate در BEGIN؛ reconcile orphan در Backup/Restore و reconcileAll؛ بدون DELETE parent دارای child.

### BUG-025 — Snapshot vs immutable ledger
**راه‌حل:** ledger authoritative؛ rebuild*FromLedger؛ snapshot فقط از atomic path؛ repair صریح.


### BUG-009 — Crypto price path must use assetId/mapping
**راه‌حل:** ساخت PriceAssetRef از Holding شامل assetKey+assetId+priceProviderId.

### BUG-010 — Crypto API Decimal vs string
**راه‌حل:** خروجی API فقط decimal string.

### BUG-011 — assetCategory housing حذف
**راه‌حل:** فقط crypto|stock|fif|metal هم‌راستا با AssetCategory.

### BUG-012 — PriceSyncSettings UNIQUE
**راه‌حل:** UNIQUE(scope, assetCategory, symbol).

### BUG-013 — isDefault در DB
**راه‌حل:** partial unique index یک default فعال per category.

### BUG-014 — Dedupe + assetCategory
**راه‌حل:** کلید dedupe شامل assetCategory.

### BUG-015 — Manual vs API priority
**راه‌حل:** Manual با expiresAt؛ fetch پیش‌فرض Manual غیرمنقضی را override نمی‌کند.

### BUG-016 — Future timestamp reject
**راه‌حل:** fetchedAt بیش از ۲ دقیقه در آینده → validation_error.

### BUG-017 — Unified PriceAssetRef
**راه‌حل:** قرارداد هویت واحد برای Adapterها.

### BUG-018 — Brokerage cashBalance authority
**راه‌حل:** Ledger منبع حقیقت؛ snapshot فقط کش؛ repair صریح.

### BUG-019 — FIF account on transactions
**راه‌حل:** accountId اجباری روی تراکنش issuance؛ audit از ledger.

### BUG-020 — Valuation triple
**راه‌حل:** price + priceCurrency + asOf؛ نرخ تتر به‌تنهایی کافی نیست.


### BUG-002 — Decimal string در Events و ExchangeRate
**راه‌حل:** همه payloadهای مالی Event و `ExchangeRate.rate` به `string` (decimal)؛ `number` فقط برای شمارنده‌های غیرمالی.

### BUG-003 — exchangeRateToBase = نرخ به Base واقعی
**راه‌حل:** تعریف صریح amount→baseCurrency کاربر؛ ممنوع فرض دائمی «ریال/تتر»؛ قرارداد در Currency-CrossRate.md.

### BUG-004 — هویت قیمت Crypto
**راه‌حل:** قیمت‌گیری با assetKey / chainId+contract نه فقط symbol؛ USDT چند شبکه جدا.

### BUG-005 — تفکیک cash صرافی و on-chain
**راه‌حل:** `inv_crypto_exchange_transactions` فقط Bank↔Exchange؛ transfer آنچین در `inv_crypto_transactions`.

### BUG-006 — networkId یکسان
**راه‌حل:** FK `networkId` روی Transaction و Holding؛ ممنوع string آزاد network.

### BUG-007 — Unique Holding Crypto
**راه‌حل:** UNIQUE ترکیب‌های exchangeId+symbol / exchangeId+networkId+contractAddress / native.

### BUG-008 — Fee و quantity/cost basis
**راه‌حل:** قرارداد fee-in-quote در برابر fee-in-asset؛ net quantity و cost سازگار؛ feeQuantity وقتی fee از خود asset است.


### باگ ۵۶ — Tax از Investment جدا بود بدون metadata روی معامله
**راه‌حل:** فیلدهای tax metadata اجباری روی تراکنش‌های Investment (isTaxableEvent, cost basis, proceeds, realizedGain, taxYear, …)؛ قرارداد در Tax-Management؛ پل getTaxableEvents.

### باگ ۵۷ — Audit Trail ناکافی
**راه‌حل:** operationId، createdBy، source، reason، reversalOf روی عملیات حساس؛ fin_audit_log اختیاری برای void/repair.

### باگ ۵۸ — License نباید به Data Model مالی قفل شود
**راه‌حل:** لایسنس بیرون SQLite مالی؛ بدون FK لایسنس به تراکنش‌ها؛ backup/restore آفلاین مستقل از سرور لایسنس.

### باگ ۵۹ — Domain زیاد ≠ صفحه زیاد
**راه‌حل:** تأیید الگوی Price Fetching/Tax/Documents؛ قانون «فیچر جدید اول داخل ۹ صفحه موجود».


### باگ ۵۱ — Reconciliation مرکزی نبود (Critical)
**راه‌حل:** APIهای reconcileAccount/Crypto/Brokerage/Fund/Metals/Loan/Portfolio/All؛ مقایسه snapshot با ledger؛ خروجی ReconcileResult؛ بدون auto-repair در v1.

### باگ ۵۲ — CHECK constraints ناکافی
**راه‌حل:** حداقل CHECK برای quantity/amount/fee/rate/price در schema.sql؛ Domain + DB دفاع دولایه؛ PRAGMA foreign_keys=ON.

### باگ ۵۳ — سیاست ON DELETE مبهم
**راه‌حل:** پیش‌فرض RESTRICT برای FKهای مالی/تاریخچه‌ای؛ CASCADE فقط برای تنظیمات غیرمالی؛ هر FK صریح در schema.

### باگ ۵۴ — Polymorphic relatedFeature/relatedId
**راه‌حل:** validate Domain + reconcile orphan + enum بسته؛ محدودیت SQLite پذیرفته و مستند شد.

### باگ ۵۵ — تاریخ/Timezone
**راه‌حل:** UTC برای timestamp؛ businessDate/settlementDate/marketDate/dueDate جدا برای بازار ایران و سررسیدها.


### باگ ۴۳ — beforeunload تضمین Save نیست (Critical)
**راه‌حل:** UI Success فقط بعد از COMMIT + await Write-to-temp-then-swap؛ beforeunload فقط best-effort.

### باگ ۴۴ — ریسک حجم sql.js
**راه‌حل:** persistenceQueue سریال؛ محدودیت‌ها و mitigation در db.md؛ مسیر ارتقا OPFS مستند.

### باگ ۴۵ — Worker برای SQL سنگین
**راه‌حل:** Worker Strategy — گزارش/P&L/serialize ترجیحاً یا اجباری در Dedicated Worker.

### باگ ۴۶ — Migration فقط روی کاغذ
**راه‌حل:** قرارداد schema_version + جریان Startup + migrations شماره‌دار؛ صراحت که تا implementation تضمین عملی نیست.

### باگ ۴۷ — Backup بدون Integrity Contract
**راه‌حل:** checksum، schemaVersion، integrity_check، FK check، required tables قبل از پذیرش.

### باگ ۴۸ — Restore باید Atomic باشد
**راه‌حل:** load temp → validate → migrate → swap؛ شکست = حفظ DB قبلی.

### باگ ۴۹ — دسترسی مستقیم به DB بین Featureها
**راه‌حل:** فقط Feature Public API؛ ممنوع UI→SQL و Feature A→جداول B.

### باگ ۵۰ — Atomic Financial Operation Contract
**راه‌حل:** قالب مرکزی BEGIN→validate→writes→accounting→COMMIT→persist؛ helper مشترک الزامی.


### باگ ۳۸ — طبقه‌بندی خطای شبکه ناقص بود (فقط navigator.onLine)
**راه‌حل:** `navigator.onLine` فقط پیش‌فیلتر؛ `failureKind`: network_error / timeout / http_error / invalid_payload / validation_error / rate_limit / not_found.

### باگ ۳۹ — Validation دامنه قبل از ذخیره قیمت نبود
**راه‌حل:** قبل از INSERT: price > 0، timestamp معتبر، currency معتبر، symbol معتبر، source فعال؛ رد → `validation_error` بدون نوشتن.

### باگ ۴۰ — Stale Price تشخیص داده نمی‌شد
**راه‌حل:** `getLatestPrice` همیشه `priceAgeMs`, `staleAfterMs`, `isStale` برمی‌گرداند؛ UI برچسب قیمت قدیمی اجباری.

### باگ ۴۱ — اولویت/منبع پیش‌فرض Provider نبود
**راه‌حل:** فیلدهای `priority` و `isDefault` روی `price_sources`؛ انتخاب default و tie-break در getLatestPrice.

### باگ ۴۲ — Fetch تکراری تاریخچه را پر از duplicate می‌کرد
**راه‌حل:** `fetchRequestId` per run؛ dedupe در پنجره ۶۰ثانیه برای `(symbol, sourceId, price, priceCurrency)`؛ `deduped: true` بدون INSERT اضافه.


### باگ ۳۷ — سیاست ذخیره API Key مبهم بود (SessionStorage / UX / امنیت)
**محل:** `Price-Fetching.md`, `db.md`, `services.md`, `Security-Privacy.md`
**شرح:** معماری فقط می‌گفت کلید در Session Storage باشد؛ مشخص نبود بعد از بستن tab چه می‌شود، آیا LocalStorage رمزنگاری‌شده مجاز است، و Auto-Sync بدون کلید چه رفتاری دارد.
**تصمیم صریح نسخه ۱:**
- فقط Session Storage (`sessionStorageService`)؛ با بستن tab کلید از بین می‌رود و کاربر دوباره وارد می‌کند
- هرگز SQLite و هرگز LocalStorage plaintext
- Fetch دستی بدون کلید → مودال ورود کلید؛ Auto-Sync بدون کلید → Skip منبع + پیام وضعیت (بدون پرامپت مزاحم)
- خارج از v1: Remember با Web Crypto و Credential Vault


### باگ ۳۶ — قرارداد Adapter برای Providerهای قیمت ناقص بود (Severity: High)
**محل:** `docs/features/19-Price-Fetching/Price-Fetching.md` + `core/types/types.md` + `core/services/services.md`
**شرح:** بدون interface واحد، هر Provider مستقیماً وارد Domain می‌شد و با افزودن منبع دوم معماری ماژولار از بین می‌رفت.
**راه‌حل اعمال‌شده:**
- تعریف `PriceProviderAdapter` با متدهای اجباری: `fetchPrices`, `normalizeSymbol`, `normalizePrice`, `validateTimestamp`, `validateCurrency`
- انواع `NormalizedPriceQuote` و `ProviderFetchResult`
- فیلد `adapterKey` روی `price_sources` برای registry
- قوانین: Domain فقط interface را می‌شناسد؛ Adapterها در `infrastructure/providers/`
- به‌روزرسانی جریان `fetchAndStorePrices` برای عبور اجباری از Adapter
- Types در `types.md`؛ مرز مسئولیت در `services.md`؛ اشاره در زیرفیچرهای قیمت


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

