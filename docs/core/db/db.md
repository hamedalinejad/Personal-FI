ساختار دیتابیس پروژه (Core Level)

## Overview

لایه دیتابیس اصلی پروژه بر اساس **SQLite** با کتابخانه **sql.js** پیاده‌سازی می‌شود.  
این کتابخانه یک SQL engine کامل را در محیط WASM فراهم می‌کند و به IndexedDB متصل می‌شود.

> **نکته حیاتی درباره sql.js**: sql.js کل دیتابیس را **در حافظه (RAM)** نگه می‌دارد و اتصال مستقیم و افزایشی (incremental) به IndexedDB ندارد. برای ذخیره‌سازی دائمی باید کل فایل دیتابیس به‌صورت `Uint8Array` سریالایز و به‌عنوان یک Blob کامل در IndexedDB بازنویسی شود. این موضوع در بخش «سازگاری با PWA و موبایل آفلاین» زیر با جزئیت پوشش داده می‌شود.

## سازگاری با PWA و اجرای آفلاین روی موبایل

پروژه قرار است به‌صورت **PWA نصب‌شونده روی موبایل** و کاملاً آفلاین اجرا شود (Project-Blueprint بخش ۲ و ۷). این محدودیت‌های واقعی مرورگرهای موبایل (به‌ویژه Safari/iOS) باید صراحتاً در معماری دیتابیس لحاظ شوند:

### ۱. ریسک بازنویسی کامل Blob در هر ذخیره‌سازی
چون sql.js افزایشی نیست، هر `save()` باید کل دیتابیس را دوباره سریالایز و در IndexedDB بازنویسی کند. اگر اپ حین این نوشتن (مثلاً به‌خاطر رفتن به پس‌زمینه یا قطع ناگهانی روی موبایل) متوقف شود، ریسک خرابی (corruption) فایل دیتابیس وجود دارد.
- **راه‌حل الزامی**: نوشتن باید به روش **Write-to-temp-then-swap** انجام شود: ابتدا Blob جدید با کلید موقت (`db_pending`) نوشته شود، سپس در یک تراکنش IndexedDB atomic، کلید اصلی (`db_main`) با آن جایگزین شود. هرگز مستقیم روی کلید اصلی overwrite نشود.
- نوشتن‌ها باید **Debounce** شوند (مثلاً حداکثر هر ۲-۳ ثانیه یا بعد از هر تراکنش مالی کامل)، نه به ازای هر تغییر جزئی UI.
- علاوه بر IndexedDB، برای پنجره Beforeunload/Visibilitychange (وقتی کاربر اپ را می‌بندد یا به پس‌زمینه می‌برد) باید یک flush اجباری و همزمان (synchronous-as-possible) اجرا شود.

### ۲. عدم تضمین ماندگاری Storage روی موبایل (خصوصاً iOS Safari)
مرورگرها (به‌خصوص Safari) می‌توانند در شرایط کمبود فضا، داده‌های IndexedDB اپ‌هایی که Persistent Storage درخواست نکرده‌اند را حذف کنند. برای یک اپ حسابداری مالی این ریسک غیرقابل قبول است.
- **راه‌حل الزامی**: در اولین اجرای اپ، `navigator.storage.persist()` باید فراخوانی و نتیجه آن (granted/denied) به کاربر نمایش داده شود.
- یادآوری/هشدار به کاربر در صفحه تنظیمات اگر Persistent Storage تایید نشده باشد.
- **پشتیبان‌گیری دوره‌ای اجباری** (نه صرفاً اختیاری) از طریق Export فایل SQLite به دستگاه/فضای ابری کاربر باید در جریان Onboarding به کاربر یادآوری شود، دقیقاً به‌خاطر همین عدم قطعیت. جدول `stg_backup_logs` باید یادآوری «آخرین بکاپ چند روز پیش بوده» را در Dashboard نمایش دهد.

### ۳. پیش‌نیازهای نصب PWA (فعلاً در مستندات نبود)
Project-Blueprint فقط «PWA» را در Technology Decisions ذکر کرده اما پیش‌نیازهای فنی نصب آن مستند نشده بودند:
- **Web App Manifest** (`manifest.json`) با آیکون‌ها، `display: standalone`، و `start_url` باید تعریف شود.
- **Service Worker** برای Cache کردن App Shell (JS/CSS/فونت‌ها) و فایل WASM خود sql.js الزامی است، تا اپ کاملاً بدون اینترنت هم لود شود (نه فقط دیتابیس محلی کار کند، بلکه خود اپ هم بدون شبکه باز شود).
- فایل WASM سنگین sql.js باید توسط Service Worker پیش‌کش (precache) شود تا اولین لود آفلاین هم کار کند.

### ۴. مسیر ارتقا برای آینده (در صورت رشد حجم داده)
sql.js کل دیتابیس را در حافظه نگه می‌دارد؛ برای هزاران تراکنش مشکلی ندارد، اما اگر در آینده حجم داده (با تاریخچه چندساله) در دستگاه‌های موبایل ضعیف‌تر مشکل عملکردی ایجاد کرد، مسیر ارتقا به موتورهایی مانند **wa-sqlite با OPFS** (Origin Private File System) است که امکان نوشتن افزایشی و بدون بازنویسی کامل فایل را فراهم می‌کنند. این تصمیم برای نسخه ۱ لازم نیست اما باید به‌عنوان «مسیر ارتقای شناخته‌شده» مستند بماند تا در آینده نیاز به بازطراحی از صفر نباشد.

## تفکیک لایه‌ها

| لایه | توضیح |
|------|------|
| **SQL Layer** | استفاده از SQL استاندارد با تمام قابلیت‌های آن (Foreign Keys, Transactions, Views, Indexes) |
| **sql.js** | کتابخانه اتصال به دیتابیس و مدیریت WASM |
| **IndexedDB** | ذخیره‌سازی فایل دیتابیس SQLite در مرورگر |
| **LocalStorage** | ذخیره داده‌های غیرحساس و کم‌حجم (پیکربندی UI، تم، تنظیمات فیلتر) |
| **Session Storage** | داده‌های موقت فقط برای سشن فعلی |

## دستورالعمل استفاده

### LocalStorage
- فقط برای داده‌های غیرحساس و کم‌حجم استفاده شود.
- مثال‌ها: تنظیمات UI، وضعیت منوها، تم فعال، فیلترهای ذخیره‌شده.
- داده‌های مالی **هرگز** در LocalStorage ذخیره نشوند.

### Session Storage
- فقط برای داده‌های موقت در حین سشن کاربر استفاده شود.
- مثال‌ها: API Key سرویس دریافت قیمت (که نباید در دیتابیس ذخیره شود)، فرم‌های در حال پر کردن.

### تنظیمات ذخیره‌شده در `stg_settings` (کلیدهای شناخته‌شده)

| کلید (`key`) | نوع | پیش‌فرض | توضیح |
|---|---|---|---|
| `language` | `'fa' \| 'en'` | `'fa'` | زبان اپ |
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | تم |
| `dateFormat` | `'jalali' \| 'gregorian'` | `'jalali'` | فرمت تاریخ |
| `numberFormat` | `'fa' \| 'en'` | `'fa'` | فرمت اعداد |
| `autoVersionCheckEnabled` | `boolean` | `true` | بررسی خودکار نسخه در Startup (به «سیاست دسترسی به شبکه» در `Technical-Architecture.md` مراجعه کنید) |
| `defaultAccountId` | `UUID \| null` | `null` | حساب پیش‌فرض در فرم ثبت تراکنش |
| `dashboardLayout` | `string` | `'default'` | چیدمان داشبورد (به `dash_layouts` مراجعه کنید) |

> **نکته**: این جدول فقط کلیدهای شناخته‌شده و مشترک است. هر فیچر می‌تواند کلیدهای اختصاصی خود را با پیشوند فیچر اضافه کند (مثلاً `price_defaultSourceId`)، اما باید آن‌ها را در سند فیچر خود مستند کند.

### SQLite (sql.js)
- ذخیره‌سازی اصلی داده‌های مالی با تمام قابلیت‌های SQL:
  - **Foreign Keys**: امنیت روابط بین جداول
  - **Transactions**: تضمین اتمیسیت تغییرات
  - **Views**: ساخت نمایه‌های پیچیده برای گزارش‌ها
  - **Indexes**: سرعت بالای جستجو
- پشتیبانی از قید کردن و روابط بین جداول
- قابلیت Offline-First کامل
- پشتیبانی از اپراتورهای SQL کامل (JOIN, GROUP BY, HAVING, window functions و ...)

## قوانین نام‌گذاری جداول

همه جداول باید از **snake_case** با پیشوند کوتاه فیچر استفاده کنند:

| پیشوند | فیچر |
|--------|------|
| `acc_` | Accounts & Banking |
| `inc_` | Income |
| `exp_` | Expense |
| `chk_` | Cheque Management |
| `ln_` | Debt & Loan |
| `inv_` | Investment (همه زیر‌فیچرها) |
| `pa_` | Physical Assets |
| `bg_` | Budget Management |
| `fg_` | Financial Goals |
| `br_` | Bills & Recurring |
| `notif_` | Notification & Reminder |
| `rep_` | Reports & Analytics |
| `port_` | Portfolio & Wealth Overview |
| `dash_` | Dashboard |
| `tax_` | Tax Management |
| `docs_` | Document Management |
| `cur_` | Currency & Multi-Currency |
| `stg_` | Settings & Tools |
| `cat_` | Common Categories |
| `sec_` | Security & Privacy |
| `price_` | Price Fetching |

## مدل چندکاربری (Multi-User Model)

طبق Project-Blueprint.md (بخش ۶ و ۱۳)، معماری فعلی **Single-User Local-First** است اما باید قابلیت توسعه به چندکاربره (برای لایسنس‌دهی آینده) را داشته باشد. مدل انتخاب‌شده:

- **هر کاربر = یک فایل دیتابیس SQLite مستقل** (نه ردیف‌های userId داخل جداول مشترک).
- این مدل با فلسفه Local-First/Offline-First سازگار است و نیازی به افزودن ستون‌های userId/workspaceId به جداول موجود ندارد.
- در نسخه چندکاربره، هر کاربر فایل دیتابیس خودش را دارد (مسیر جداگانه در IndexedDB یا فایل جدا هنگام Export/Backup)؛ لایه احراز هویت/لایسنس فقط تعیین می‌کند کدام فایل دیتابیس بارگذاری شود.
- در نتیجه هیچ Migration جدیدی برای اضافه‌شدن چندکاربری لازم نیست؛ فقط لایه انتخاب/مدیریت فایل دیتابیس در سطح اپلیکیشن اضافه می‌شود.

## لیست مرکزی همه‌ی جدول‌ها

| جدول | فیچر | توضیح |
|------|------|------|
| `acc_accounts` | Accounts & Banking | حساب‌های بانکی |
| `acc_transactions` | Accounts & Banking | تراکنش‌های بانکی |
| `inc_transactions` | Income | تراکنش‌های درآمد |
| `inc_recurring` | Income | درآمدهای تکرارشونده |
| `exp_transactions` | Expense | تراکنش‌های هزینه |
| `exp_recurring` | Expense | هزینه‌های تکرارشونده |
| `chk_cheques` | Cheque Management | چک‌ها |
| `ln_loans` | Debt & Loan | وام‌ها |
| `ln_transactions` | Debt & Loan | تراکنش‌های وام |
| `ln_rate_history` | Debt & Loan | تاریخچه نرخ سود وام‌های Variable |
| `inv_crypto_exchanges` | Investment Crypto | صرافی‌ها و والت‌ها |
| `inv_crypto_holdings` | Investment Crypto | دارایی‌های رمزارز |
| `inv_crypto_transactions` | Investment Crypto | تراکنش‌های رمزارز |
| `inv_crypto_exchange_transactions` | Investment Crypto | تراکنش‌های نقدی صرافی |
| `inv_stocks_iran_brokerages` | Investment Stocks Iran | کارگزاری‌ها |
| `inv_stocks_iran_holdings` | Investment Stocks Iran | دارایی‌های سهام |
| `inv_stocks_iran_transactions` | Investment Stocks Iran | تراکنش‌های سهام و Corporate Actions |
| `inv_stocks_iran_brokerage_transactions` | Investment Stocks Iran | تراکنش‌های نقدی کارگزاری |
| `inv_stocks_iran_dividends` | Investment Stocks Iran | سود نقدی با جزئیات gross/tax/net و تاریخ‌های ex/record/payment |
| `inv_fif_funds` | Investment Fixed Income Funds | صندوق‌های درآمد ثابت |
| `inv_fif_holdings` | Investment Fixed Income Funds | دارایی‌های صندوق |
| `inv_fif_transactions` | Investment Fixed Income Funds | تراکنش‌های صندوق |
| `inv_metals_platforms` | Investment Metals | پلتفرم‌های فلزات |
| `inv_metals_holdings` | Investment Metals | دارایی‌های فلزات |
| `inv_metals_transactions` | Investment Metals | تراکنش‌های فلزات |
| `inv_metals_platform_transactions` | Investment Metals | تراکنش‌های نقدی پلتفرم |
| `inv_metals_physical_deliveries` | Investment Metals | تحویل فیزیکی فلزات |
| `pa_assets` | Physical Assets | دارایی‌های فیزیکی |
| `pa_valuations` | Physical Assets | ارزش‌گذاری‌های دارایی |
| `pa_transactions` | Physical Assets | تراکنش‌های دارایی |
| `bg_budgets` | Budget Management | بودجه‌ها |
| `bg_envelopes` | Budget Management | پاکت‌های بودجه |
| `bg_transaction_links` | Budget Management | لینک هزینه به پاکت |
| `bg_transfers` | Budget Management | انتقال بین پاکت‌ها |
| `fg_goals` | Financial Goals | اهداف مالی |
| `fg_contributions` | Financial Goals | کمک‌های اهداف |
| `br_items` | Bills & Recurring | آیتم‌های تکرارشونده |
| `br_occurrences` | Bills & Recurring | رخدادهای تکرارشونده |
| `notif_notifications` | Notification & Reminder | اعلان‌ها |
| `notif_settings` | Notification & Reminder | تنظیمات اعلان |
| `notif_custom_reminders` | Notification & Reminder | یادآوری‌های سفارشی |
| `rep_presets` | Reports & Analytics | پیش‌تنظیم گزارش |
| `rep_net_worth_snapshots` | Reports & Analytics | نمونه‌گیری Net Worth |
| `port_snapshots` | Portfolio & Wealth Overview | نمونه‌گیری پرتفوی |
| `port_settings` | Portfolio & Wealth Overview | تنظیمات پرتفوی |
| `dash_layouts` | Dashboard | چیدمان داشبورد |
| `dash_widget_configs` | Dashboard | تنظیمات ویجت‌ها |
| `tax_records` | Tax Management | رکوردهای مالیاتی |
| `tax_categories` | Tax Management | دسته‌بندی‌های مالیاتی |
| `docs_documents` | Document Management | اسناد |
| `docs_links` | Document Management | پیوندهای اسناد |
| `stg_settings` | Settings & Tools | تنظیمات برنامه |
| `stg_backup_logs` | Settings & Tools | لاگ‌های پشتیبان‌گیری |
| `cur_currencies` | Currency & Multi-Currency | ارزها |
| `cur_exchange_rates` | Currency & Multi-Currency | نرخ‌های تبدیل |
| `cur_currency_preferences` | Currency & Multi-Currency | تنظیمات ارز کاربر |
| `cat_categories` | Common Categories | دسته‌بندی‌های مشترک |
| `sec_settings` | Security & Privacy | تنظیمات امنیتی |
| `sec_session_logs` | Security & Privacy | لاگ‌های نشست (Should Have) |
| `sec_audits` | Security & Privacy | لاگ رویدادهای امنیتی حساس — Append-Only (Should Have) |
| `price_sources` | Price Fetching | منابع/Providerهای قیمت |
| `price_history` | Price Fetching | تاریخچه قیمت دارایی‌ها (Append-Only؛ دستی یا از API) |
| `price_sync_settings` | Price Fetching | تنظیمات به‌روزرسانی خودکار (Auto-Sync) |

## فراهم کردن دسترسی یکپارچه به داده‌ها

این فایل (`db.md`) نقش **فهرست مرکزی همه‌ی جدول‌ها** را دارد:
- همه جداول تمام فیچرها در اینجا لیست شده‌اند
- هر جدول با نام یکپارچه و پیشوند معین آمده
- برای جزئیات فیلدها، به فایل فیچر مربوطه مراجعه شود

---

## نمونه مفهومی Schema (ساده)

```typescript
// db/models.ts
export interface AccAccount {
  id: string;
  name: string;
  accountNumber: string;
  iban: string;
  currency: string;
  currentBalance: Decimal; // استفاده از decimal.js
  isArchived: boolean;
}

export interface AccTransaction {
  id: string;
  date: string;
  type: string;
  amount: Decimal; // استفاده از decimal.js — صفاف و دقیق
  feeAmount?: Decimal;
  feeCurrency?: string;
  exchangeRateToBase?: Decimal; // نرخ تبدیل نسبت به baseCurrency تنظیم‌شده در cur_currency_preferences (مثال: اگر baseCurrency=IRR باشد، ریال به ازای ۱ واحد ارز تراکنش)
  balanceAfterTransaction: Decimal; // snapshot برای جلوگیری از خطاهای رُند
  accountId: string;
  isVoided: boolean;
}
```

## قانون Minor Unit Storage (حتمی)

> **باگ ۲۱ — تضاد بالقوه Minor Unit با Crypto Decimals (رفع‌شده)**  
> معماری قبلی برای همه مبالغ یک قانون Minor Unit یکسان داشت اما `scale` و `precision` برای فیلدهای `quantity` رمزارزها مشخص نشده بود. این ابهام می‌توانست مستقیماً P&L را خراب کند.  
> **قانون جدید**: دو دسته مجزا — **Currency Amount** (مبالغ مالی) و **Asset Quantity** (تعداد دارایی) — هرکدام قانون ذخیره‌سازی جداگانه دارند.

---

### بخش الف — Currency Amount (مبالغ مالی)

فیلدهایی که **مبلغ پولی** هستند: `totalAmount`, `totalAmountBase`, `priceBase`, `feeAmount`, `totalInvested`, `averageBuyPrice`, `currentBalance`, `cashBalance` و مشابهات.

این فیلدها به **کوچک‌ترین واحد پول** (Minor Unit) ذخیره می‌شوند — **عدد صحیح**:

| ارز | Minor Unit | Scale (توان ۱۰) | مثال |
|-----|---|---|---|
| **IRR (ریال)** | ۱ ریال | 0 | ۱۲۳۴۵۶۷۸ = ۱۲،۳۴۵،۶۷۸ ریال |
| **USD** | ۱ سنت | 2 | ۱۲۳۴۵ = ۱۲۳.۴۵ دلار |
| **EUR** | ۱ سنت | 2 | ۶۷۸۹۰ = ۶۷۸.۹۰ یورو |
| **AED** | ۱ فلس | 2 | ۱۰۰۰ = ۱۰.۰۰ درهم |
| **USDT** | ۱ میکرو‌تتر | 6 | ۱۲۳۴۵۶۷۸۹۰ = ۱۲۳۴.۵۶۷۸۹۰ USDT |
| **BTC** | ۱ ساتوشی | 8 | ۱۰۰۰۰۰۰۰۰ = ۱ BTC |
| **ETH** | ۱ Gwei | 9 | ۱۰۰۰۰۰۰۰۰۰ = ۱ ETH (نه Wei؛ 18 رقم بیش از حد است) |

> **چرا ETH از Gwei استفاده می‌کند نه Wei؟**  
> Wei (scale=18) عدد صحیحی با ۱۸ رقم می‌سازد که در SQLite INTEGER (64-bit signed max ≈ 9.2×10^18) برای مقادیر بزرگ overflow می‌کند. Gwei (scale=9) برای اکثر تراکنش‌های DeFi کافی است. اگر در آینده نیاز به scale=18 پیش آمد، باید به TEXT ذخیره‌سازی مهاجرت شود.

> **استثنا — قیمت دارایی‌ها در `price_history`**: فیلد `price` در جدول `price_history` **از این قانون مستثناست**؛ به‌جای Minor Unit، قیمت به‌صورت `TEXT` (decimal string — مثلاً `"65432.12345678"`) ذخیره می‌شود. دلیل: قیمت دارایی یک «نرخ تبدیل/مرجع» است، نه یک «مبلغ تراکنش مالی» — Minor Unit آن معنای مشخص و ثابتی ندارد. همین استثنا برای `cur_exchange_rates.rate` هم صدق می‌کند.

---

### بخش ب — Asset Quantity (تعداد/مقدار دارایی)

فیلدهایی که **تعداد دارایی** هستند: `quantity` در `inv_crypto_holdings`, `inv_crypto_transactions`, `inv_metals_holdings`, `inv_metals_transactions` و مشابهات.

این فیلدها **متفاوت از Currency Amount** هستند — قانون:

> **Asset Quantity به‌صورت `TEXT` (decimal string) در SQLite ذخیره می‌شود و در Domain Layer با `decimal.js` خوانده/نوشته می‌شود.**

دلیل: هر رمزارز precision متفاوتی دارد و هیچ Minor Unit ثابتی برای «تعداد دارایی» معنا ندارد:

| دارایی | Max Decimal Places | مثال |
|--------|---|---|
| **BTC** | 8 | `"0.00000001"` (1 ساتوشی) |
| **ETH** | 9 (در این سیستم — Gwei-based) | `"0.000000001"` |
| **USDT** | 6 | `"0.000001"` |
| **SOL** | 9 | `"0.000000001"` |
| **سایر ERC-20 / Token** | تا 18 | `"0.000000000000000001"` |
| **طلا (گرم)** | 4 | `"0.0001"` |
| **سهام (ایران)** | 0 | `"1"` (واحد کامل) |

```typescript
// SQLite Schema (schema.sql)
-- ❌ اشتباه:
quantity REAL  -- floating point: دقت گم می‌شود

-- ✅ درست:
quantity TEXT  -- decimal string: "0.00000001"

-- ✅ برای Currency Amount:
amount INTEGER -- minor unit: 100000000 = 1 BTC
```

```typescript
// Domain Layer — خواندن quantity از DB
import Decimal from 'decimal.js';

// خواندن از SQLite (TEXT)
const rawQty = row.quantity; // "0.12345678"
const qty = new Decimal(rawQty); // دقیق — بدون floating point error

// نوشتن به SQLite (TEXT)
const newQty = qty.plus(new Decimal('0.00000001'));
db.run('UPDATE inv_crypto_holdings SET quantity = ? WHERE id = ?',
  [newQty.toFixed(), holdingId]); // "0.12345679"
```

---

### بخش ج — جدول خلاصه «کدام فیلد چه نوع ذخیره‌سازی»

| نوع فیلد | مثال | SQLite Type | Domain Layer |
|----------|------|-------------|--------------|
| مبلغ مالی (ارز فیات/USDT) | `totalAmount`, `currentBalance` | `INTEGER` (minor unit) | `new Decimal(row.amount).dividedBy(scale)` |
| مبلغ مالی (به ارز پایه) | `totalAmountBase`, `averageBuyPrice` | `INTEGER` (minor unit ارز پایه) | همان |
| تعداد دارایی کریپتو/فلز | `quantity` | `TEXT` (decimal string) | `new Decimal(row.quantity)` |
| قیمت مرجع/نرخ ارز | `price_history.price`, `cur_exchange_rates.rate` | `TEXT` (decimal string) | `new Decimal(row.price)` |
| تعداد سهام (ایران) | `quantity` در stocks/fif | `INTEGER` | مستقیم |

---

### بخش د — قانون تبدیل در Domain Layer

```typescript
// core/utils/amount.ts

import Decimal from 'decimal.js';

// Scale map برای Currency Amount (minor unit)
const CURRENCY_SCALE: Record<string, number> = {
  IRR: 0,   // 10^0 = 1
  USD: 2,   // 10^2 = 100
  EUR: 2,
  AED: 2,
  GBP: 2,
  TRY: 2,
  USDT: 6,  // 10^6 = 1_000_000
  BTC: 8,   // 10^8 = 100_000_000
  ETH: 9,   // 10^9 = 1_000_000_000 (Gwei-based)
};

/** Currency Amount: عدد کاربر → INTEGER minor unit برای ذخیره در DB */
export function toMinorUnit(amount: Decimal, currency: string): bigint {
  const scale = CURRENCY_SCALE[currency];
  if (scale === undefined) throw new Error(`Unknown currency scale: ${currency}`);
  return BigInt(amount.times(new Decimal(10).pow(scale)).toFixed(0));
}

/** Currency Amount: INTEGER minor unit از DB → عدد قابل نمایش */
export function fromMinorUnit(minorUnit: bigint | number, currency: string): Decimal {
  const scale = CURRENCY_SCALE[currency];
  if (scale === undefined) throw new Error(`Unknown currency scale: ${currency}`);
  return new Decimal(minorUnit.toString()).dividedBy(new Decimal(10).pow(scale));
}

/** Asset Quantity: رشته TEXT از DB → Decimal */
export function parseQuantity(raw: string): Decimal {
  return new Decimal(raw); // decimal.js از string می‌خواند — بدون precision loss
}

/** Asset Quantity: Decimal → رشته TEXT برای ذخیره در DB */
export function formatQuantity(qty: Decimal): string {
  return qty.toFixed(); // مثلاً "0.00000001" — بدون نماد علمی
}
```

> **نکته مهم — `BigInt` برای Currency Amount**:  
> چون SQLite INTEGER 64-bit signed است و `Number` در JavaScript فقط 53 بیت دقت دارد، مقادیر بزرگ IRR (مثلاً `1_000_000_000_000` ریال) با `Number` دقت از دست می‌دهند. در Domain Layer برای Currency Amount از `BigInt` یا `Decimal` استفاده شود — هرگز `Number`.

**قاعده کلی**:
- در مرحله **ورود** (Presentation): مقدار از کاربر به‌صورت string دریافت شود
- در مرحله **پردازش** (Domain): `toMinorUnit()` یا `parseQuantity()` بر اساس نوع فیلد
- در مرحله **ذخیره‌سازی** (Database): INTEGER برای Currency Amount، TEXT برای Asset Quantity
- در مرحله **نمایش** (Presentation): `fromMinorUnit()` یا `parseQuantity()`

**نکات حساس**:
- هیچ محاسبه‌ای درون Database انجام نشود — تمام محاسبات در Domain Layer
- هنگام محاسبه Realized P&L برای کریپتو: `quantity` (TEXT→Decimal) × `averageBuyPrice` (INTEGER→Decimal) باید هر دو از DB خوانده و سپس در Domain Layer ضرب شوند
- `toFixed()` روی Decimal.js از نماد علمی (مثل `1e-8`) جلوگیری می‌کند — الزامی است
- هرگز `REAL` یا `FLOAT` در SQLite برای هیچ فیلد مالی استفاده نشود

## مسیر فایل‌های دیتابیس

```bash
core/db/
├── db.ts              # تعریف دیتابیس و اتصال
├── schema.sql         # تعریف جداول با SQL
├── models.ts          # TypeScript types برای هر جدول
├── migrations.ts      # مدیریت مایگRATION‌های SQLite
├── queries/           # کوئری‌های SQL تجمیع شده
│   ├── reports.ts     # کوئری‌های گزارش‌گیری
│   └── analytics.ts   # کوئری‌های تحلیلی
└── index.ts           # Export اصلی
```

## قوانین

- تمام تراکنش‌های مالی در SQLite ذخیره می‌شوند.
- LocalStorage فقط برای تنظیمات UI و داده‌های غیرحساس استفاده شود.
- داده‌های حساس (مثلاً API keys) هرگز ذخیره نشوند.
- تمام مبالغ باید بر اساس قانون "Minor Unit Storage" ذخیره شوند (بخش ۱۱ Project-Blueprint).
- نوشتن دیتابیس در IndexedDB همیشه با الگوی Write-to-temp-then-swap و Debounce انجام شود (بخش «سازگاری با PWA و اجرای آفلاین روی موبایل»).
- در اولین اجرا، `navigator.storage.persist()` باید درخواست شود.
---

## Financial Architecture: Journal-Based Balance (Critical)

### Problem Statement (مشکل قدیمی)

اگر `currentBalance` در `acc_accounts` به عنوان **Snapshot** (نه Journal) نگهداری شود:
- اگر transaction جا بیفتد → balance غلط
- اگر rollback ناقص باشد → balance غلط
- اگر migration خراب شود → balance غلط
- اگر snapshot اشتباه update شود → balance غلط
- **هیچ راهی نیست برای reconciliation**

### Solution: Journal as Single Source of Truth

**Architecture**:

```
acc_transactions (Journal/Log) = TRUTH
         ↓ (Calculate when needed)
acc_accounts.currentBalance = CACHE (for speed)
```

**True Balance Calculation**:

```typescript
calculateTrueBalance(accountId: UUID): Decimal {
  const transactions = await db.query(`
    SELECT amount, type, isVoided, relatedTransactionId 
    FROM acc_transactions 
    WHERE accountId = $1 
      AND isVoided = false 
      AND relatedTransactionId IS NULL
  `, [accountId])
  
  let balance = initialBalance
  for (const tx of transactions) {
    const sign = ['deposit', 'transfer-in'].includes(tx.type) ? 1 : -1
    balance = balance.plus(new Decimal(tx.amount).times(sign))
  }
  
  return balance
}
```

**Snapshot Update Pattern**:

```
BEGIN TRANSACTION
  1. Calculate: newBalance = calculateTrueBalance(accountId) + transactionAmount
  2. INSERT acc_transactions
  3. UPDATE acc_accounts.currentBalance = newBalance
COMMIT or ROLLBACK (atomic)
```

### Reconciliation API

**Purpose**: Verify cached snapshot matches journal

```typescript
reconcileAccount(accountId: UUID): {
  status: 'ok' | 'mismatch'
  calculatedBalance: Decimal,
  storedBalance: Decimal,
  transactions_count: number
}
```

**When to Use**:
- User clicks "Reconcile Account" button
- Nightly batch job (daily verification)
- After migrations or data imports
- After backup restoration
- Audit/compliance checks

**If Mismatch**:
```
1. Log to audit_log: {accountId, calculatedBalance, storedBalance, timestamp}
2. Alert user: "Balance mismatch detected — review transactions"
3. Option to auto-fix: currentBalance = calculateTrueBalance() (recalc from journal)
```

### Never Do This ❌

```typescript
// ❌ NEVER directly update balance without transaction
db.update('acc_accounts', {currentBalance: 1000})

// ❌ NEVER use cached balance as source of truth
const balance = account.currentBalance  // Wrong for critical operations

// ❌ NEVER assume snapshot is accurate (without reconciliation)
```

### Always Do This ✅

```typescript
// ✅ For read-heavy (UI/Dashboard): use cache
const balance = account.currentBalance

// ✅ For critical operations (transfer/withdrawal): recalculate
const trueBalance = calculateTrueBalance(accountId)
validate(trueBalance >= withdrawAmount)

// ✅ For compliance/audit: reconcile regularly
reconcileAccount(accountId)
```

### Immutable Transactions + Reversal

**Edit/Correction Pattern**:

```
Original:  {id: tx1, amount: +100, isVoided: false}
User corrects to +110

Process:
  1. Mark original: isVoided = true, relatedTransactionId = tx2
  2. Create reversal: {id: tx2, amount: -100, isVoided: false, relatedTransactionId: tx1}
  3. Create correction: {id: tx3, amount: +110, isVoided: false}
  
Note: Journal now has 3 records. true Balance counts only active ones (isVoided=false and leaf transactions)
```

### Precision: decimal.js Mandatory

All balance calculations **must** use Decimal:

```typescript
// ❌ Don't
let sum = 1000 + 0.1 + 0.1 + 0.1  // Result: 1000.3000000000001

// ✅ Do
let sum = new Decimal(1000)
  .plus(new Decimal('0.1'))
  .plus(new Decimal('0.1'))
  .plus(new Decimal('0.1'))  // Result: 1000.3
```
