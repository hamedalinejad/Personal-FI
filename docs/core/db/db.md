ساختار دیتابیس پروژه (Core Level)

## Overview

لایه دیتابیس اصلی پروژه بر اساس **SQLite** با کتابخانه **sql.js** پیاده‌سازی می‌شود. 
این کتابخانه یک SQL engine کامل را در محیط WASM فراهم می‌کند و به IndexedDB متصل می‌شود.

> **نکته حیاتی درباره sql.js**: sql.js کل دیتابیس را **در حافظه (RAM)** نگه می‌دارد و اتصال مستقیم و افزایشی (incremental) به IndexedDB ندارد. برای ذخیره‌سازی دائمی باید کل فایل دیتابیس به‌صورت `Uint8Array` سریالایز و به‌عنوان یک Blob کامل در IndexedDB بازنویسی شود. این موضوع در بخش «سازگاری با PWA و موبایل آفلاین» زیر با جزئیت پوشش داده می‌شود.

## سازگاری با PWA و اجرای آفلاین روی موبایل

پروژه قرار است به‌صورت **PWA نصب‌شونده روی موبایل** و کاملاً آفلاین اجرا شود (Project-Blueprint بخش ۲ و ۷). این محدودیت‌های واقعی مرورگرهای موبایل (به‌ویژه Safari/iOS) باید صراحتاً در معماری دیتابیس لحاظ شوند:

### ۱. ریسک بازنویسی کامل Blob در هر ذخیره‌سازی
چون sql.js افزایشی نیست، هر `save` باید کل دیتابیس را دوباره سریالایز و در IndexedDB بازنویسی کند. اگر اپ حین این نوشتن (مثلاً به‌خاطر رفتن به پس‌زمینه یا قطع ناگهانی روی موبایل) متوقف شود، ریسک خرابی (corruption) فایل دیتابیس وجود دارد.
- **راه‌حل الزامی — چند اسلات IndexedDB** (نه فقط یک pending):

| کلید | نقش |
|------|------|
| `db_main` | نسخه فعال آخرین persist موفق |
| `db_pending` | نوشتهٔ در حال انجام (temp) |
| `db_backup` | کپی آخرین `db_main` موفق قبل از هر swap (rolling safety) |
| `db_meta` | JSON: `{ schemaVersion, appVersion, databaseId, checksum, lastSuccessfulPersist, pendingChecksum? }` |

جریان persist:
```text
1. serialize sql.js → Uint8Array
2. checksum = hash(blob)
3. write db_pending + update meta.pendingChecksum
4. copy current db_main → db_backup (اگر main وجود دارد)
5. atomic IDB tx: db_pending → db_main؛ پاک کردن pending
6. meta.lastSuccessfulPersist = now; meta.checksum = checksum
```
اگر pending خراب شد: main و backup دست‌نخورده‌اند.  
Recovery boot: اگر main corrupt → امتحان backup با verify checksum؛ اگر pending کامل و main ناقص → می‌توان pending را با احتیاط validate کرد.

- هرگز overwrite مستقیم روی `db_main`.
- نوشتن‌ها باید **Debounce** شوند برای تغییرات غیرمالی UI؛ برای **عملیات مالی کامل** مسیر جداست (پایین).
- `visibilitychange` / `beforeunload` فقط **best-effort flush** هستند — **هرگز تضمین persist نیستند**.
- **UI Success Contract**: پیام «ثبت شد» / `Saved` فقط پس از موفقیت گام ۶ persist (swap + meta) مجاز است. SQL COMMIT در RAM بدون IndexedDB swap = هنوز unsaved؛ UI باید pending/error نشان دهد.
 - روی موبایل (به‌ویژه iOS Safari) `beforeunload` اغلب اجرا نمی‌شود یا فرصت serialize کامل ندارد.
 - بنابراین اعتماد به این رویدادها برای «آخرین تغییر حتماً ذخیره شد» **ممنوع** است.

### ۲. عدم تضمین ماندگاری Storage روی موبایل (خصوصاً iOS Safari)
مرورگرها (به‌خصوص Safari) می‌توانند در شرایط کمبود فضا، داده‌های IndexedDB اپ‌هایی که Persistent Storage درخواست نکرده‌اند را حذف کنند. برای یک اپ حسابداری مالی این ریسک غیرقابل قبول است.
- **راه‌حل الزامی**: در اولین اجرای اپ (و قابل تکرار از Settings)، `navigator.storage.persist()` فراخوانی شود و نتیجه در `stg_settings` ذخیره شود: `persistentStorage: 'granted' | 'denied' | 'unknown'`.

### Policy اجرایی وقتی `denied` یا پشتیبانی نیست
| وضعیت | رفتار |
|--------|--------|
| `granted` | حالت عادی؛ همچنان Backup دوره‌ای توصیه می‌شود |
| `denied` | بنر پایدار در Dashboard + Settings (قرمز/هشدار): «مرورگر ممکن است داده را در کمبود فضا پاک کند» |
| `denied` | Onboarding نمی‌تواند بدون تأیید «متوجه شدم + Backup الان» کامل شود (چک‌باکس اجباری) |
| `denied` | یادآوری Backup اجباری‌تر: اگر آخرین backup > N روز (پیش‌فرض ۷) → modal مسدودکننده خفیف در ورود |
| `unknown` / API absent | همان UXی `denied` + توضیح محدودیت مرورگر |
| هر حالت | Export دستی و `createBackup` همیشه در دسترس |

**تضمین نیست:** حتی `granted` حذف ۱۰۰٪ را وعده نمی‌دهد — کپی backup کاربر جزء قرارداد محصول است.

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
- مثال‌ها: API Key سرویس دریافت قیمت، فرم‌های در حال پر کردن.
- **API Key قیمت (تصمیم v1 — )**:
 - محل ذخیره: **فقط** Session Storage via `sessionStorageService` (هرگز SQLite، هرگز LocalStorage plaintext).
 - عمر: تا بستن tab / پایان سشن مرورگر؛ بعد از آن کاربر باید دوباره وارد کند.
 - جزئیات UX و مسیر آینده (encrypted remember / vault) در `Price-Fetching.md` بخش سیاست API Key.

### تنظیمات ذخیره‌شده در `stg_settings` (کلیدهای شناخته‌شده)

| کلید (`key`) | نوع | پیش‌فرض | توضیح |
|---|---|---|---|
| `language` | `'fa' \| 'en'` | `'fa'` | زبان اپ |
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | تم |
| `dateFormat` | `'jalali' \| 'gregorian'` | `'jalali'` | فرمت تاریخ |
| `numberFormat` | `'fa' \| 'en'` | `'fa'` | فرمت اعداد |
| `autoVersionCheckEnabled` | `boolean` | **`false`** | بررسی خودکار نسخه در Startup — **پیش‌فرض خاموش (Offline-by-default)**؛ فقط با opt-in صریح کاربر روشن می‌شود |
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

همه جداول باید از **snake_case** با پیشوند کوتاه استفاده کنند. پیشوندها به دو دسته تقسیم می‌شوند:

### الف) پیشوندهای فیچر (Feature-scoped)

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

### ب) پیشوندهای Core مشترک (Cross-cutting Infrastructure)

این جداول به هیچ فیچر خاصی تعلق ندارند و به همه فیچرها خدمت می‌کنند. پیشوند فیچر برای آن‌ها معنا ندارد.

| پیشوند | کاربرد | مثال |
|--------|---------|------|
| `fin_` | زیرساخت مالی مشترک — Audit Trail، تاریخچه تغییرات | `fin_audit_log` |
| `ref_` | یکپارچگی داده و صف عملیات تأخیری | `ref_integrity_queue` |

> **قاعده**: جدول جدیدی که به بیش از یک فیچر خدمت می‌کند یا ماهیتاً زیرساختی است، باید از پیشوند `fin_` یا `ref_` استفاده کند — نه پیشوند یکی از فیچرهای موجود.

## مدل چندکاربری (Multi-User Model)

v1: **Single-User Local-First**. مسیر آینده ترجیحی همچنان **یک فایل SQLite per کاربر/tenant** است (نه `userId` روی هر ردیف مالی).

### مرزبندی برای migration آینده
| رویکرد | وضعیت |
|--------|--------|
| `userId` / `tenantId` روی همه جداول مالی v1 | **عمداً اضافه نمی‌شود** — از انفجار schema جلوگیری می‌کند |
| انتخاب فایل DB توسط لایه اپ + License | **Must** برای multi-user |
| polymorphic `relatedId` | فقط داخل **همان فایل DB** معنا دارد؛ cross-tenant reference غیرممکن است اگر هر tenant فایل جدا داشته باشد |

اگر روزی shared-DB اجباری شد (غیرترجیحی): آن‌گاه migration بزرگ + `tenantId` NOT NULL روی همه جداول + همه validateهای polymorphic باید `tenantId` را match کنند. تا آن روز schema مالی v1 بدون tenant ستون می‌ماند و مرز = فایل.

Invariant: هیچ `relatedId` به دادهٔ خارج از فایل بازشده اشاره نمی‌کند.

## لیست مرکزی همه‌ی جدول‌ها

| جدول | فیچر | توضیح |
|------|------|------|
| `acc_accounts` | Accounts & Banking | حساب‌های بانکی |
| `acc_transactions` | Accounts & Banking | تراکنش‌های نقدی/بانکی (Cash ledger) |
| `fin_journal_entries` | Core Accounting | **دفتر روزنامه یکپارچه همه رویدادهای مالی** |
| `inc_transactions` | Income | تراکنش‌های درآمد |
| `inc_recurring` | Income | درآمدهای تکرارشونده |
| `exp_transactions` | Expense | تراکنش‌های هزینه |
| `exp_recurring` | Expense | هزینه‌های تکرارشونده |
| `chk_cheques` | Cheque Management | چک‌ها |
| `ln_loans` | Debt & Loan | وام‌ها |
| `ln_loan_fees` | Debt & Loan | کارمزدهای وام (صدور، پیش‌پرداخت، ماهانه، پلکانی و ...) |
| `ln_loan_fee_tiers` | Debt & Loan | ردیف‌های پلکانی کارمزد وام (جایگزین فیلد قدیمی `tiers` در `ln_loan_fees`) |
| `ln_transactions` | Debt & Loan | تراکنش‌های وام |
| `ln_rate_history` | Debt & Loan | تاریخچه نرخ سود وام‌های Variable |
| `inv_crypto_exchanges` | Investment Crypto | صرافی‌ها و والت‌ها |
| `inv_crypto_wallet_networks` | Investment Crypto | شبکه‌های بلاکچین هر والت |
| `inv_crypto_wallet_addresses` | Investment Crypto | چند آدرس/derivation per شبکه |
| `inv_crypto_holdings` | Investment Crypto | دارایی‌های رمزارز |
| `inv_crypto_transactions` | Investment Crypto | تراکنش‌های رمزارز |
| `inv_crypto_exchange_transactions` | Investment Crypto | تراکنش‌های نقدی صرافی |
| `inv_stocks_iran_brokerages` | Investment Stocks Iran | کارگزاری‌ها |
| `inv_stocks_iran_holdings` | Investment Stocks Iran | دارایی‌های سهام |
| `inv_stocks_iran_transactions` | Investment Stocks Iran | تراکنش‌های سهام |
| `inv_stocks_iran_brokerage_transactions` | Investment Stocks Iran | تراکنش‌های نقدی کارگزاری |
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
| `price_sources` | Price Fetching | منابع/Providerهای قیمت |
| `price_history` | Price Fetching | تاریخچه قیمت دارایی‌ها (Append-Only؛ دستی یا از API) |
| `price_sync_settings` | Price Fetching | تنظیمات به‌روزرسانی خودکار (Auto-Sync) |
| `acc_transaction_links` | Accounts & Banking (مشترک) | لینک صریح polymorphic برای گزارش/reconcile — Should Have |
| `fin_audit_log` | Core (مشترک همه فیچرها) | ردپای عملیاتی void/reversal/repair/import/restore — **Must Have** |
| `ref_integrity_queue` | Core (مشترک همه فیچرها) | صف detect→quarantine→reconcile→repair — **Must Have** |

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
 balanceAfterTransaction: Decimal; // derived snapshot only — ledger authoritative
 accountId: string;
 isVoided: boolean;
}

// --- نمونه مفهومی صندوق درآمد ثابت (تمایز NAV و قیمت معامله — ) ---
export interface InvFifHolding {
 id: string;
 fundId: string;
 brokerageId?: string;
 units: Decimal;
 averageBuyPrice: Decimal; // میانگین قیمت خرید/صدور (بر اساس transactionPrice)
 totalInvested: Decimal;
 totalFeesPaidBase: Decimal;
 currentNAV: Decimal; // فقط NAV — برای Unrealized P&L و ارزش پرتفوی
 lastSubscriptionPrice?: Decimal;
 lastRedemptionPrice?: Decimal;
}

export interface InvFifTransaction {
 id: string;
 fundId: string;
 brokerageId?: string;
 type: 'buy' | 'sell' | 'dividend' | 'reinvest' | 'nav_update';
 units?: Decimal;
 nav?: Decimal; // NAV در تاریخ تراکنش
 transactionPrice?: Decimal; // قیمت واقعی معامله (صدور در buy، ابطال در sell)
 amount?: Decimal;
 feeAmount?: Decimal;
 feeCurrency?: string;
 exchangeRateToBase?: Decimal;
 predictedProfit?: Decimal;
 actualProfit?: Decimal;
 accountId?: string;
 accountTransactionId?: string;
 description?: string;
 date: string;
}
```

> **تمایز حیاتی در FIF**: `nav` / `currentNAV` هرگز با `transactionPrice` یکی فرض نمی‌شوند. جزئیات کامل و قوانین پر کردن در `Fixed-Income-Funds.md`.

```typescript
// --- نمونه مفهومی فلزات (تمایز واحد / عیار / وزن خالص — ) ---
export interface InvMetalsHolding {
 id: string;
 platformId: string;
 metalType: 'gold' | 'silver' | 'copper' | 'gold_coin';
 purity: string; // کد استاندارد: 18k, 24k, 999, emami, ...
 purityRatio: Decimal; // 0..1 — fineWeightMg = quantityMg × purityRatio
 quantityMg: Decimal; // وزن ناخالص به میلی‌گرم (هرگز گرم/اونس)
 averageBuyPricePerMg: Decimal; // میانگین همان purity (نه طلای خالص)
 totalInvested: Decimal;
 totalFeesPaidBase: Decimal;
}

export interface InvMetalsTransaction {
 id: string;
 platformId: string;
 metalType: 'gold' | 'silver' | 'copper' | 'gold_coin';
 purity: string; // اجباری
 purityRatio: Decimal; // snapshot
 type: 'buy' | 'sell' | 'physical_delivery';
 quantityMg: Decimal; // وزن ناخالص
 pricePerMg: Decimal; // قیمت همان purity
 totalAmount?: Decimal;
 feeAmount?: Decimal;
 feeCurrency?: string;
 exchangeRateToBase?: Decimal;
 deliveryFee?: Decimal;
 date: string;
}
```

> **تمایز حیاتی در Metals**: `quantityMg` = وزن ناخالص؛ وزن خالص (`fineWeightMg`) محاسبه می‌شود و ذخیره نمی‌شود؛ `purity` و `purityRatio` مستقل‌اند. `1g Gold 18K ≠ 1g pure gold`. جزئیات کامل در `Metals.md`.

## قانون Minor Unit Storage (حتمی)

تمام مبالغ در دیتابیس به **کوچک‌ترین واحد پول** ذخیره می‌شوند:

| ارز | کوچک‌ترین واحد | مثال |
|-----|---|---|
| **IRR (ریال)** | ۱ ریال | ۱۲۳۴۵۶۷۸ = ۱۲،۳۴۵،۶۷۸ ریال |
| **USD** | سنت (Cent) | ۱۲۳۴۵ سنت = ۱۲۳.۴۵ دلار |
| **EUR** | سنت | ۶۷۸۹۰ سنت = ۶۷۸.۹۰ یورو |
| **BTC** | ۱ ساتوشی = ۱۰^-۸ BTC | ۱۲۳۴۵۶۷۸۹ ساتوشی |
| **ETH** | ۱ Gwei = ۱۰^-۹ ETH | از Gwei برای ذخیره استفاده شود (نه Wei که بیش از حد کوچک است) |
| **USDT** | ۱ میکرو = ۱۰^-۶ USDT | ۱۲۳۴۵۶۷۸۹۰ میکرو |

> **استثنا — قیمت دارایی‌ها در `price_history`**: فیلد `price` در جدول `price_history` **از این قانون مستثناست**؛ به‌جای Minor Unit، قیمت به‌صورت `decimal` (عدد اعشاری خام) ذخیره می‌شود. دلیل: قیمت دارایی (مثلاً قیمت طلا به ریال به ازای هر گرم، یا BTC به USDT) یک «نرخ تبدیل/مرجع» است، نه یک «مبلغ تراکنش مالی» — Minor Unit آن معنای مشخص و ثابتی ندارد (چون واحد پایه متفاوت است: «هر گرم»، «هر BTC»). همین استثنا برای `cur_exchange_rates.rate` هم صدق می‌کند.

**قاعده**:
- در مرحله **ورود** (لایه Presentation)، مقدار از کاربر به فرمت عادی (۱۲۳۴.۵۶) دریافت می‌شود
- در مرحله **پردازش** (لایه Domain)، تبدیل به کوچک‌ترین واحد انجام می‌شود (۱۲۳۴۵۶)
- در مرحله **ذخیره‌سازی** (Database)، صرفاً عدد صحیح ذخیره می‌شود
- در مرحله **نمایش** (لایه Presentation)، دوباره به فرمت عادی برگردانده می‌شود

**پیاده‌سازی**:
```typescript
// Domain Layer
import Decimal from 'decimal.js';

// ورود: "1234.56" → تبدیل به کوچک‌ترین واحد
const inputAmount = new Decimal('1234.56');
const minorUnits = inputAmount.times(100).toNumber; // 123456

// ذخیره‌سازی: 123456
database.save({ amount: minorUnits });

// خروجی: 123456 → بازگرداندن به فرمت عادی
const storedAmount = new Decimal(123456);
const displayAmount = storedAmount.dividedBy(100); // 1234.56
```

**نکات حساس** (ریسک‌های احتمالی):
- خیلی مهم که هیچ محاسبه درون Database انجام نشود. تمام محاسبات در Domain Layer انجام شود.
- هنگام محاسبه Realized Profit/Loss برای کریپتو، صفاف بودن اعشار حیاتی است (مثلاً 0.00000001 BTC)
- هنگام تبدیل بین ارزها، از decimal.js استفاده کنید (هرگز Number)
- Snapshot موجودی (`balanceAfterTransaction`) حتمی است

## مسیر فایل‌های دیتابیس

```bash
core/db/
├── db.ts # تعریف دیتابیس و اتصال
├── schema.sql # تعریف جداول با SQL
├── models.ts # TypeScript types برای هر جدول
├── migrations.ts # مدیریت مایگRATION‌های SQLite
├── queries/ # کوئری‌های SQL تجمیع شده
│ ├── reports.ts # کوئری‌های گزارش‌گیری
│ └── analytics.ts # کوئری‌های تحلیلی
└── index.ts # Export اصلی
```

## قوانین

- تمام تراکنش‌های مالی در SQLite ذخیره می‌شوند.
- LocalStorage فقط برای تنظیمات UI و داده‌های غیرحساس استفاده شود.
- داده‌های حساس (مثلاً API keys) هرگز ذخیره نشوند.
- تمام مبالغ باید بر اساس قانون "Minor Unit Storage" ذخیره شوند (بخش ۱۱ Project-Blueprint).


---

## قرارداد ماندگاری مالی

برای سیستم حسابداری، کاربر فقط وقتی باید «ثبت شد» ببیند که داده **واقعاً persist** شده باشد.

### مسیر اجباری هر عملیات مالی موفق

```text
BEGIN (SQLite transaction)
 → validate
 → write all related rows
COMMIT (SQLite)
 → serialize DB → Write-to-temp-then-swap در IndexedDB (await کامل)
 → فقط بعد از resolve موفق swap → UI «ثبت شد»
```

قوانین:
1. **UI Success فقط بعد از persist موفق IndexedDB** — نه بعد از COMMIT درون‌حافظه‌ای sql.js به‌تنهایی.
2. اگر swap شکست بخورد → UI خطا؛ کاربر نباید فکر کند داده ذخیره شده؛ در صورت امکان rollback منطقی یا علامت «unsaved».
3. `beforeunload` / `visibilitychange` فقط برای تلاش اضافی flush پس‌زمینه؛ **جایگزین مسیر بالا نیستند**.
4. دکمه‌های ثبت تا پایان persist غیرفعال/loading بمانند تا double-submit و حس کاذب موفقیت پیش نیاید.

---

## صف ماندگاری و محدودیت حجم sql.js

sql.js کل DB را در RAM نگه می‌دارد و هر persist کل فایل را serialize می‌کند. برای نسخه ۱ قابل‌قبول است، ولی این قراردادها **الزامی**اند:

### Persistence Queue
- یک صف سریال (`persistenceQueue`) فقط یک serialize/swap در هر لحظه.
- عملیات مالی await همان job صف را می‌کنند (تا UI Success درست باشد).
- debounce فقط برای flushهای غیربحرانی (تنظیمات UI، نه خرید/فروش/قسط).

### محدودیت‌های شناخته‌شده v1
| ریسک | mitigation نسخه ۱ |
|------|-------------------|
| RAM بالا با ده‌ها هزار تراکنش + price_history | هشدار در Settings وقتی تخمین حجم از آستانه گذشت؛ تشویق به Backup |
| Freeze هنگام serialize | serialize سنگین ترجیحاً در Worker؛ UI با progress «در حال ذخیره…» |
| kill موبایل وسط نوشتن | Write-to-temp-then-swap؛ هرگز overwrite مستقیم `db_main` |
| رشد بی‌رویه price_history | dedupe + امکان پاک‌سازی قدیمی در آینده |

### مسیر ارتقا (نه v1)
OPFS / SQLite WASM با نوشتن افزایشی — فقط به‌عنوان مسیر شناخته‌شده؛ بازطراحی از صفر لازم نباشد.

---

## Worker Strategy

| کار | Thread |
|-----|--------|
| UI / React | Main |
| sql.js queries سبک (CRUD تک‌تراکنش) | Main یا Worker — در v1 Main مجاز اگر < ~50ms |
| serialize کامل DB برای persist | **Worker ترجیحی**؛ اگر Worker نبود، Main با UI blocking کوتاه + indicator |
| گزارش‌ها / P&L / Portfolio روی حجم بالا | **اجباری Worker** (یا حداقل chunked async با yield به UI) |
| Adapter شبکه قیمت | async روی Main قابل‌قبول؛ CPU parse سنگین → Worker |

قوانین:
1. هیچ گزارش سنگینی نباید Main Thread را بیش از یک فریم طولانی منجمد کند.
2. API لایه Domain می‌تواند `runInWorker: true` برای queryهای تحلیلی داشته باشد.
3. Service Worker ≠ SQL Worker: SW فقط App Shell + WASM cache؛ محاسبات SQL در Dedicated Worker جدا.

---

## قرارداد Migration

مستندات به‌تنهایی migration را enforce نمی‌کند. در implementation این‌ها الزامی‌اند:

### جدول `schema_version`
- تک‌ردیفی یا key-value: `version INTEGER NOT NULL`, `appliedAt`
- هر تغییر schema = یک فایل migration شماره‌دار در `db/migrations/`

### جریان Startup
```text
open DB from IndexedDB
→ read schema_version
→ if version < app.expectedVersion → run migrations in order inside SQLite TRANSACTION
→ each migration idempotent یا با ثبت version فقط بعد از موفقیت
→ persist (temp-then-swap)
→ app ready
```

### قوانین
1. بدون `schema_version` معتبر، اپ نباید بنویسد (یا نسخه ۰ فرض و migration از ابتدا).
2. Migration شکست → اپ در حالت safe mode؛ overwrite روی DB اصلی نکند.
3. Backup باید `schemaVersion` را در متادیتا نگه دارد.
4. تا قبل از implementation واقعی `migrations.ts`، این بخش «قرارداد لازم‌الاجرا» است نه «انجام‌شده».

---

## قرارداد Backup / Restore

### Export (Backup)
فایل backup حداقل شامل:
- بایت‌های SQLite (یا archive)
- متادیتا JSON: `schemaVersion`, `appVersion`, `exportedAt`, `checksum` (مثلاً SHA-256 از بایت DB), `tableCounts` اختیاری

### Restore — Data Integrity Contract (قبل از پذیرش)
ترتیب اجباری؛ هر شکست → **abort بدون دست زدن به DB فعلی**:

```text
1. خواندن فایل + متادیتا
2. checksum match
3. schemaVersion خوانده/قابل‌فهم بودن (≤ app version یا migration-path موجود)
4. load در DB موقت (حافظه / کلید IndexedDB جدا: db_restore_temp)
5. PRAGMA integrity_check = ok
6. PRAGMA foreign_key_check خالی
7. وجود جداول ضروری (لیست سفید از schema)
8. اجرای migration روی temp تا رسیدن به version فعلی اپ (اگر لازم)
9. فقط پس از موفقیت همه مراحل → atomic swap: db_restore_temp جایگزین db_main
10. دور انداختن temp؛ UI موفقیت
```

### Atomic Restore
- DB قبلی تا لحظه swap نهایی دست‌نخورده می‌ماند.
- اگر هر مرحله از ۱–۸ شکست بخورد، کاربر همان داده قبلی را دارد.
- Restore نصفه هرگز `db_main` را overwrite نمی‌کند.

---

## قرارداد عملیات مالی اتمیک

هر عملیات مالی چندمرحله‌ای (خرید کریپتو، فروش، تبدیل، پرداخت قسط، خرید سهام، ابطال صندوق، انتقال، reversal، …) باید از این قالب پیروی کند:

```text
BEGIN;
 validate inputs + balances + business rules;
 insert/update domain rows (holdings, loans, …);
 update snapshots (balances, averages, cashBalance, …);
 insert acc_transactions (+ لینک relatedFeature/relatedId);
 — هیچ COMMIT جزئی مجاز نیست —
COMMIT;
→ await persistToIndexedDB (Write-to-temp-then-swap);
→ UI success / emit domain events;
```

قوانین:
1. Feature حق ندارد فقط یکی از جداول را بدون بقیه بنویسد.
2. Reversal = تراکنش معکوس جدید، نه حذف خام تاریخچه (طبق قوانین موجود void).
3. اگر persist بعد از COMMIT حافظه شکست بخورد، طبق رفتار خطا — نه «ثبت شد» کاذب.
4. پیاده‌سازی‌ها در Featureهای مختلف باید از یک helper مشترک `runAtomicFinancialOperation(fn)` در `db/` یا `core` استفاده کنند تا رفتار یکسان بماند.
5. هر فراخوانی یک `operationId` تولید و روی تمام ردیف‌های همان COMMIT می‌نویسد.
6. در فروش/سود مشمول مالیات، tax metadata در همان COMMIT پر می‌شود.


- نوشتن دیتابیس در IndexedDB همیشه با الگوی Write-to-temp-then-swap و Debounce انجام شود (بخش «سازگاری با PWA و اجرای آفلاین روی موبایل»).
- در اولین اجرا، `navigator.storage.persist` باید درخواست شود.


---

## قرارداد Reconciliation مرکزی

Snapshotها (موجودی حساب، units، quantityMg، cashBalance، …) ممکن است به‌خاطر خطای Domain از Ledger فاصله بگیرند. یک مکانیزم **مرکزی فقط‌خواندنی** برای تشخیص ناهماهنگی الزامی است.

### APIهای مشترک (لایه Domain / `core` یا `db/reconciliation.ts`)

| API | مقایسه |
|-----|--------|
| `reconcileAccount(accountId)` | `acc_accounts.currentBalance` ↔ Σ اثر `acc_transactions` غیرvoid روی همان حساب (با ترتیب تاریخ + `balanceAfterTransaction` در صورت وجود) |
| `reconcileCryptoHolding(holdingId)` | `quantity` / `totalInvested` ↔ Σ `inv_crypto_transactions` |
| `reconcileBrokerage(brokerageId)` | `cashBalance` ↔ Σ تراکنش‌های نقدی کارگزاری + لینک‌های `acc_transactions` |
| `reconcileStockHolding(holdingId)` | `quantity` / `totalInvested` / `averageBuyPrice` ↔ Σ `inv_stocks_iran_transactions` (buy/sell) — محاسبه با Weighted Average از صفر |
| `reconcileFund(holdingId)` | `units` / `totalInvested` ↔ Σ `inv_fif_transactions` (buy/sell/reinvest) |
| `reconcileMetalsHolding(holdingId)` | `quantityMg` / `totalInvested` ↔ Σ `inv_metals_transactions` |
| `reconcileMetalsPlatformCash(platformId)` | `inv_metals_platforms.cashBalance` ↔ Σ دو منبع: (۱) `inv_metals_platform_transactions` (deposit اضافه، withdraw کم) + (۲) `inv_metals_transactions` (buy کم، sell اضافه، deliveryFee کم) |
| `reconcileLoan(loanId)` | مانده وام ↔ جدول اقساط / `ln_transactions` |
| `reconcileCheque(chequeId)` | سازگاری `status` / `accountTransactionId` / `reversalTransactionId` در `chk_cheques` ↔ وجود/جهت/وضعیت تراکنش‌های مرتبط در `acc_transactions` — بر اساس ماتریس state machine (جدول زیر) |
| `reconcilePortfolio` | جمع ارزش‌ها و اسنپ‌شات‌های کلیدی در برابر مجموع reconciles جزئی |
| `reconcileAll` | اجرای همه موارد بالا (شامل `reconcileStockHolding` برای همه Holdingها، `reconcileCheque` برای همه چک‌های غیر-cancelled، و `reconcileMetalsPlatformCash` برای همه پلتفرم‌های فلزات)؛ خروجی گزارش یکپارچه |

**ماتریس انتظار `reconcileCheque` — یک چک سالم باید:**

| status | accountTransactionId | reversalTransactionId |
|--------|---------------------|----------------------|
| `pending` | `null` | `null` |
| `cleared` | UUID معتبر + `isVoided=false` در `acc_transactions` | `null` |
| `bounced` (مستقیم از pending) | `null` | `null` |
| `bounced` (از cleared) | UUID معتبر + `isVoided=true` در `acc_transactions` | UUID معتبر + `isVoided=false` در `acc_transactions` |
| `cancelled` | `null` | `null` |

هر انحراف از این ماتریس به‌عنوان Mismatch گزارش می‌شود.

### خروجی استاندارد هر reconcile

```typescript
interface ReconcileResult {
 target: string; // e.g. 'account:uuid'
 ok: boolean;
 expected: string; // decimal string از ledger
 actual: string; // decimal string از snapshot
 delta: string; // actual - expected
 details?: string;
}
```

### قوانین
1. Reconciliation **هرگز خودکار snapshot را عوض نمی‌کند** مگر با عملیات صریح Repair (نسخه ۱: فقط گزارش؛ Repair = Should Have با تأیید کاربر).
2. بعد از هر `runAtomicFinancialOperation` موفق، فراخوانی reconcile همان aggregate در dev/test توصیه‌شده است.
3. Dashboard/Settings می‌تواند «سلامت داده» را از `reconcileAll` نشان دهد (اختیاری v1).
4. معیار مقایسه همیشه decimal.js؛ آستانه صفر مطلق برای پول (یا epsilon بسیار کوچک فقط برای نرخ‌های اعشاری اگر مستند شود).

---

## قرارداد CHECK Constraints در SQLite

قوانین Domain لازم‌اند ولی کافی نیستند. Schema باید تا حد ممکن همان invariants را enforce کند تا خطای Domain نتواند `quantity = -1` را commit کند.

### حداقل CHECKهای الزامی (نمونه — در `schema.sql` پیاده‌سازی)

```sql
-- مبالغ و موجودی‌ها
CHECK (amount > 0) -- در جدول‌های تراکنش مبلغ مطلق، در صورت signed بودن: قوانین صریح per type
CHECK (feeAmount IS NULL OR feeAmount >= 0)
CHECK (quantity >= 0) -- holdings
CHECK (quantityMg >= 0)
CHECK (units >= 0)
CHECK (currentBalance IS NOT NULL) -- علامت می‌تواند منفی نباشد مگر overdraft صریح مجاز باشد
CHECK (price > 0) -- price_history
CHECK (averageBuyPrice >= 0)
CHECK (purityRatio > 0 AND purityRatio <= 1)
CHECK (exchangeRateToBase IS NULL OR exchangeRateToBase > 0)
```

### قوانین
1. هر فیلد کمّی مالی که در Domain «نباید منفی/صفر باشد» باید در صورت امکان CHECK داشته باشد.
2. اگر قانون پیچیده است (مثلاً amount علامت‌دار بر اساس type)، از CHECK ترکیبی `(type IN (...) AND amount > 0) OR ...` استفاده شود.
3. Domain همچنان validate می‌کند (پیام خطای کاربرپسند)؛ DB آخرین خط دفاع است.
4. `PRAGMA foreign_keys = ON` در هر اتصال sql.js **اجباری** است.

---

## سیاست Foreign Key کامل

برای سیستم مالی تقریباً immutable، حذف parent نباید تاریخچه child را پاک کند مگر استثنای صریح.

### پیش‌فرض پروژه

| رابطه نوعی | ON DELETE | دلیل |
|------------|-----------|------|
| `acc_transactions.accountId` → accounts | **RESTRICT** | حذف حساب دارای تاریخچه ممنوع |
| تراکنش‌های سرمایه‌گذاری → holding/fund/platform | **RESTRICT** | تاریخچه معاملات حفظ شود |
| `*_transactions.accountTransactionId` → acc_transactions | **RESTRICT** یا SET NULL فقط اگر لینک اختیاری مستند شده | |
| `price_history.sourceId` → price_sources | **SET NULL** | تاریخچه قیمت بعد از حذف منبع منطقی بماند |
| `price_sync_settings` → sources/symbols | **CASCADE** قابل‌قبول برای تنظیمات غیرمالی | |
| لاگ‌ها / reminders وابسته به رکورد عملیاتی | **CASCADE** یا RESTRICT طبق حساسیت | |
| اسناد `docs_links` | **CASCADE** از document؛ **RESTRICT** از entity مالی اگر لازم | |

### قوانین
1. **هیچ FK به جدول تراکنش مالی نباید CASCADE از parent کسب‌وکاری داشته باشد** مگر سند صریح خلاف بگوید.
2. حذف منطقی (archive / isActive=false / isVoided) بر حذف فیزیکی ترجیح داده می‌شود.
3. هر FK در `schema.sql` باید صریحاً `ON DELETE` / `ON UPDATE` داشته باشد؛ پیش‌فرض خام SQLite (NO ACTION) بدون مستندسازی ممنوع است.
4. فهرست کامل FKها هنگام implementation در `schema.sql` + این جدول سیاست نگهداری می‌شود.

---

## Polymorphic FK: `relatedFeature` + `relatedId`

SQLite نمی‌تواند enforce کند که `relatedId` به جدول درست اشاره می‌کند.

### mitigations الزامی

1. **Enum بسته** `RelatedFeature` فقط از `core/types` (از قبل موجود).
2. **Validate در Domain** داخل `runAtomicFinancialOperation`: وجود ردیف هدف قبل از INSERT در `acc_transactions`.
3. **جدول اختیاری `acc_transaction_links` (Should Have / آماده‌سازی)**: 
 `(transactionId, relatedFeature, relatedId)` با ایندکس یکتا — برای گزارش و reconcile، نه جایگزین enum.
4. **Reconcile**: برای هر `acc_transactions` با related غیرnull، بررسی وجود هدف؛ orphan = گزارش خطا.
5. **ممنوع**: نوشتن `relatedFeature`/`relatedId` از UI بدون عبور از API فیچر مالک.

> محدودیت intrinsic polymorphic FK پذیرفته شده است؛ correctness با Domain + Reconcile + تست integration جبران می‌شود.

---

## قرارداد تاریخ و زمان

### ذخیره
- همه timestampهای مطلق به‌صورت **ISO 8601 UTC** (`Timestamp` در types).
- نمایش: timezone/تقویم کاربر (Jalali یا Gregorian) فقط در Presentation با dayjs.

### تفکیک معنایی فیلدها (اجباری در مدل‌ها وقتی مصداق دارد)

| مفهوم | معنی | مثال استفاده |
|--------|------|----------------|
| `eventAt` / `createdAt` | لحظه وقوع/ثبت در سیستم (UTC) | زمان کلیک ثبت، زمان دریافت قیمت |
| `businessDate` | تاریخ کسب‌وکار بدون ساعت (تقویم محلی بازار) | روز معامله بورس ایران، روز تعلق سود صندوق |
| `settlementDate` | تاریخ تسویه | T+n سهام |
| `marketDate` | تاریخی که قیمت/NAV به آن روز اشاره دارد | NAV پایان روز، قیمت پایانی |
| `dueDate` / `paymentDate` | سررسید و تاریخ پرداخت واقعی | اقساط، مالیات، چک |
| `fetchedAt` | زمان دریافت قیمت | price_history |

### قوانین
1. برای بورس ایران، سود صندوق، قسط، مالیات: **`businessDate` (یا معادل نام‌گذاری‌شده)** جدا از `createdAt` ذخیره شود؛ نباید فقط UTC timestamp مبهم استفاده شود.
2. `businessDate` به‌صورت `YYYY-MM-DD` (تقویم میلادی مبنا در DB) ذخیره می‌شود؛ تبدیل به جلالی فقط در UI.
3. مقایسه «همان روز بازار» با `businessDate` انجام شود نه با تبدیل خام timezone روی `createdAt`.
4. Price snapshot: `fetchedAt` (UTC) + در صورت نیاز `marketDate` برای NAV روزانه.
5. هیچ محاسبه سود/جریمه دیرکرد صرفاً روی timezone محلی مرورگر بدون ذخیره businessDate انجام نشود.
6. تراکنش‌های Stock/FIF: `businessDate` (روز معامله کاربر) جدا از `marketDate` قیمت/NAV در صورت تفاوت؛ فیلد مبهم تنها به نام `date` بدون تفکیک **ممنوع** در API جدید.

---

## قرارداد Audit Trail مالی

Immutable transaction کافی نیست؛ برای عملیات حساس باید ردپای عملیاتی مشخص باشد (آینده multi-user / license).

### فیلدهای مشترک Audit (روی جداول تراکنش مالی و عملیات حساس)

| فیلد | الزام v1 | توضیح |
|------|----------|--------|
| `createdAt` | بله | از قبل |
| `createdBy` | بله (nullable در single-user) | شناسه کاربر منطقی؛ در v1 می‌تواند `'local'` یا null |
| `operationId` | بله | UUID یکسان برای همه ردیف‌های یک `runAtomicFinancialOperation` |
| `reversalOf` / `relatedTransactionId` | بله وقتی reversal | لینک به عملیات/تراکنش اصلی |
| `source` | بله | `ui` \| `import` \| `system` \| `migration` \| `api` |
| `reason` | برای void/reversal/repair | متن کوتاه دلیل |

### جدول `fin_audit_log` (**Must Have**)

```text
id, operationId, action, entityTable, entityId,
actorId, source, reason, payloadSummary, createdAt
```

- برای تغییر وضعیت‌های حساس (void، restore، repair reconcile، تغییر تنظیمات امنیتی)
- payload کامل اسرار (API key) هرگز در audit ذخیره نشود

### قوانین
1. هر atomic financial op یک `operationId` مشترک روی تمام ردیف‌های نوشته‌شده در همان COMMIT دارد.
2. Reversal باید `reversalOf` / `relatedTransactionId` پر کند.
3. Import انبوه `source='import'` می‌گیرد.
4. حذف فیزیکی ردیف audit ممنوع.

---

## تقویت Integrity لینک Polymorphic

FK واقعی SQLite ممکن نیست؛ mitigations **لایه‌ای**:

1. **Validate همزمان با INSERT** (داخل همان BEGIN atomic): وجود ردیف هدف؛ وگرنه COMMIT نشود.
2. **جدول `ref_integrity_queue` (Must Have)**: مسیر یکپارچگی اجباری — نه قابلیت جانبی.
3. **Reconcile اجباری در مسیرهای حساس**: قبل از Backup و بعد از Restore، `reconcileOrphanLinks` برای `acc_transactions` و سایر polymorphic tables.
4. **ممنوع DELETE فیزیکی** parent تا وقتی child link دارد (هم‌راستا با ON DELETE RESTRICT روی FKهای واقعی).
5. تست integration: حذف/void والد نباید child را بی‌سرپرست رها کند بدون گزارش.

این همچنان Weak Integrity نسبت به FK واقعی است، ولی mitigations **الزامی در runtime**اند:
1. CHECK `relatedFeature` ∈ enum بسته (لیست در types) در صورت امکان + validate Domain.
2. قبل از COMMIT: SELECT وجود `relatedId` در جدول map[relatedFeature].
3. `reconcileOrphanLinks` در Backup/Restore و دوره‌ای در Settings «سلامت داده».
4. UI هرگز relatedId را بدون انتخاب entity از API فیچر مالک نمی‌نویسد.
5. مسیر آینده Should Have: جدول link اختصاصی per pair برای روابط پرتکرار (کاهش polymorphic surface).

---

## قرارداد Snapshot در برابر Ledger

| لایه | نقش | mutable؟ |
|------|-----|----------|
| Ledger (`*_transactions`, `acc_transactions`) | منبع حقیقت رویدادها | append-only / void+reversal |
| Snapshot (holding quantity, cashBalance, currentBalance, totalInvested, averages, remaining loan, …) | کش مشتق برای سرعت | mutable ولی **فقط** از مسیر atomic رسمی |

### قوانین
1. **Ledger authoritative است**؛ Snapshot هرگز منبع حقیقت برای Repair نیست (هم‌راستا با ).
2. هر Feature که Snapshot دارد باید `rebuildXFromLedger(id)` داشته باشد (یا از helper مشترک).
3. `runAtomicFinancialOperation` باید در یک COMMIT هم ledger و هم snapshot را بنویسد؛ به‌روزرسانی snapshot بیرون از آن مسیر ممنوع است.
4. بعد از کشف اختلاف reconcile: فقط **Repair صریح** (`rebuild*FromLedger` با تأیید کاربر) snapshot را اصلاح می‌کند — نه نوشتن معکوس از snapshot روی ledger.
5. لیست حداقل rebuildها: Account balance، Crypto/Stock/FIF/Metals holdings، Brokerage/Platform cash، Loan remaining.

```text
Ledger correct + Snapshot wrong → rebuild snapshot from ledger
Ledger wrong → reversal/corrective transactions (never silent snapshot edit as truth)
```

### الگوی عمومی اصلاح تراکنش دولایه (Two-Layer Atomic Correction)

هر فیچری که جدول اختصاصی تراکنش دارد (`inc_transactions`، `exp_transactions`، `chk_cheques`، ...) **و** این تراکنش‌ها در `acc_transactions` هم ثبت می‌شوند، باید برای اصلاح/حذف از این الگو پیروی کند — نه فقط از یک لایه:

```
BEGIN TRANSACTION;

── لایه ۱: جدول اختصاصی فیچر ──────────────────────────────────────
 feature_table[id].isVoided = true -- علامت‌گذاری رکورد قدیمی
 INSERT new_feature_row (data_corrected, reversedId=id, ...) -- رکورد جدید

── لایه ۲: acc_transactions ────────────────────────────────────────
 acc_transactions[accountTransactionId].isVoided = true -- void تراکنش اصلی
 INSERT reversal_acc_tx (type=reversal, amount=-original) -- معکوس موجودی
 INSERT new_acc_tx (type=original_type, amount=corrected) -- تراکنش صحیح جدید

COMMIT;
```

> **قانون فیلتر گزارش‌گیری**: هر API که از جدول اختصاصی فیچر جمع می‌زند (`getTotalIncome`، `getTotalExpense`، ...) **باید** `WHERE isVoided = false` داشته باشد. در غیر این صورت رکورد void‌شده و رکورد جدید هر دو در جمع می‌آیند و نتیجه غلط می‌شود.
>
> **فیلد `isVoided`**: باید در جدول اختصاصی هر فیچر (نه فقط `acc_transactions`) وجود داشته باشد — این الزامی است، نه اختیاری.

---

## Multi-Tab Concurrency

sql.js در هر Tab یک کپی در RAM دارد. بدون هماهنگی، Last-Write-Wins می‌تواند تراکنش Tab دیگر را در IndexedDB overwrite کند.

### قرارداد نسخه ۱
1. **Single-Writer lock** با `navigator.locks` (در صورت پشتیبانی) روی نام `personal-fi-db-writer`.
2. قبل از persist: خواندن `db_meta.version` از IndexedDB؛ اگر با version حافظه یکی نبود → **Conflict** — UI: «داده از Tab دیگر تازه‌تر است؛ Reload».
3. بعد از swap موفق: `version++` در meta.
4. اگر `navigator.locks` نبود: هشدار در UI وقتی چند Tab تشخیص داده شد (`BroadcastChannel('personal-fi')` heartbeat) + توصیه به یک Tab.
5. عملیات مالی در Tab غیر-holder قفل: صف یا reject با پیام واضح — نه silent LWW.

v1 عمداً multi-active-writer کامل نیست؛ هدف جلوگیری از از دست رفتن commit بدون اطلاع کاربر است.

---

## دفتر روزنامه یکپارچه — `fin_journal_entries`

### مشکل
جدول‌های `inc_*`, `exp_*`, `ln_*`, `inv_*`, `pa_*` و `acc_transactions` لاگ‌های دامنه‌ای جدا هستند. `acc_transactions` فقط **Cash/Bank ledger** است، نه Journal عمومی. گزارش‌ها و Reconciliation اگر فقط یکی را ببینند ناقص می‌مانند.

### قرارداد
هر `runAtomicFinancialOperation` **اجباری** است حداقل یک (معمولاً چند) ردیف در `fin_journal_entries` بنویسد — علاوه بر جداول دامنه فیچر.

| فیلد | نوع | نقش |
|------|-----|------|
| `id` | UUID | PK |
| `operationId` | UUID | همان atomic op |
| `entryKind` | enum | `cash` \| `income` \| `expense` \| `transfer` \| `investment` \| `loan` \| `fee` \| `tax` \| `adjustment` \| `other` |
| `direction` | enum | `debit` \| `credit` (از دید حساب/پرتفوی طبق قرارداد فیچر) یا `+`/`-` amountInBase |
| `amount` | decimal string | مبلغ به ارز رویداد |
| `currency` | string | |
| `exchangeRateToBase` | decimal string | |
| `amountInBase` | decimal string | `amount × rate` — برای گزارش یکپارچه |
| `accountId` | UUID nullable | اگر رویداد روی حساب بانکی اثر دارد |
| `relatedFeature` | RelatedFeature | |
| `relatedId` | UUID | PK جدول دامنه (مثلاً inv_crypto_transactions.id) |
| `businessDate` | date | |
| `memo` | string nullable | |
| `isVoided` | boolean | |
| `createdAt` | timestamp UTC | |

### قوانین لایه‌ها (ضد Double-Counting)

| لایه | چیست | Source of Truth برای چه |
|------|------|-------------------------|
| **Domain Ledger** | `inv_*_transactions`, `ln_transactions`, `inc_*`, `exp_*`, … | quantity، units، cost basis، loan portions، P&L دامنه همان asset |
| **Cash Ledger** | `acc_transactions` (+ cash brokerage/platform tables) | فقط جابه‌جایی پول بانکی/نقدی حساب |
| **Accounting Journal** | `fin_journal_entries` | گزارش میان‌فیچری، جریان وجوه یکپارچه، audit دو طرفه |
| **Snapshot** | `currentBalance`, holding qty، `cashBalance`، … | **فقط Projection** — مشتق از Domain/Cash ledger؛ هرگز SoT گزارش |

**قانون طلایی گزارش:** هر رویداد اقتصادی **یک‌بار** از Journal (یا از Domain برای متریک تخصصی) شمرده می‌شود — نه Journal+Domain+acc با هم در یک مجموع.

### طبقه‌بندی حساب (Double-Entry سبک)

هر atomic op حداقل **دو** ردیف journal با `accountClass` و `direction` متوازن از نظر `amountInBase` می‌نویسد:

| فیلد اضافه | نقش |
|------------|-----|
| `accountClass` | `cash` \| `crypto_asset` \| `stock_asset` \| `fund_unit` \| `metal_asset` \| `loan_liability` \| `loan_receivable` \| `income` \| `expense` \| `trading_fee` \| `equity` \| `other` |
| `direction` | `debit` \| `credit` |
| `amountInBase` | برای balance check: Σ debit = Σ credit در همان `operationId` |

مثال BUY BTC با USDT + fee USDT:
```text
Dr crypto_asset     amountInBase = cost of BTC
Cr cash             amountInBase = USDT spent (quote)
Dr trading_fee      amountInBase = fee
Cr cash             amountInBase = fee
```
(اگر cash داخلی صرافی است نه بانک، `accountId` null و `accountClass=cash` با memo exchange؛ `acc_transactions` نوشته **نمی‌شود**.)

### قوانین
1. جداول فیچر = جزئیات دامنه (units، NAV، portions، …).
2. `fin_journal_entries` = SoT گزارش میان‌فیچری و Net movement یکپارچه.
3. `acc_transactions` = Cash/Bank ledger؛ فقط وقتی پول **حساب بانکی** جابه‌جا می‌شود.
4. Snapshot = Projection؛ rebuild از Domain/Cash ledger.
5. بدون journal متوازن، atomic op fail.
6. گزارش Expense بانکی از `acc`/`exp` یا journal `accountClass=expense` — **نه** جمع همزمان هر دو.

```text
Domain row(s)
 + fin_journal_entries (متوازن، الزامی)
 + acc_transactions (فقط bank cash)
 + snapshots (projection)
→ COMMIT → persist
```

### ماتریس SoT محاسبات

| متریک | Source of Truth |
|--------|-----------------|
| Cash balance حساب بانکی | `acc_transactions` (rebuild) |
| Brokerage/platform cash | ledger نقدی همان فیچر |
| Holding qty / cost basis / avg | Domain `inv_*_transactions` (+ CA) |
| Realized P&L دارایی | Domain ledger همان asset |
| Net Worth | Portfolio API: assets از holdings×price + bank cash − loans؛ **نه** جمع خام journal+domain |
| Expense/Income کاربر | `exp_*` / `inc_*` (isVoided=false) |
| Tax paid | `tax_*` + acc tax types |
| Cross-feature cashflow report | `fin_journal_entries` با فیلتر accountClass |

---

## مکانیزم واقعی Reconciliation

APIهای `reconcile*` / `rebuild*` فقط مشخصات نیستند؛ در implementation باید **قابل اثبات** کنند `snapshot == ledger`.

### قرارداد اجرایی
1. **ماژول** `core/reconciliation/` (یا `db/reconciliation.ts`):
 - `reconcileX(id): Promise<ReconcileResult>`
 - `rebuildXFromLedger(id): Promise<void>` فقط پس از تأیید کاربر
2. **الگوریتم مشترک**:
```text
expected = pure function over non-voided ledger rows (decimal.js)
actual = current snapshot column(s)
delta = actual - expected
ok = delta.isZero
```
3. **اثبات در تست**: unit/integration با fixture — بعد از atomic op، `reconcileX` → `ok:true`؛ بعد از فساد عمدی snapshot → `ok:false` و rebuild جبران می‌کند.
4. **Runtime**:
 - Dev/Test: بعد از هر `runAtomicFinancialOperation` روی aggregate همان op
 - Production v1: `reconcileAll` از Settings «سلامت داده» + قبل از Backup + بعد از Restore
5. **خروجی پایدار** در جدول اختیاری `fin_reconcile_runs` (Should Have): `{ ranAt, scope, ok, deltaSummary }` برای audit.
6. تا وقتی کد و تست fixture وجود ندارد، checklist پیاده‌سازی این قابلیت **باز** است — مستند به‌تنهایی «اجرایی‌شده در runtime» نیست.

### منبع حقیقت مقایسه
- همیشه **ledger rows** (و در صورت نیاز `fin_journal_entries` برای cross-feature)
- هرگز `balanceAfterTransaction` یا سایر snapshotها به‌عنوان expected

---

## راهنمای پیاده‌سازی bootstrap

1. init sql.js → load blob از IndexedDB (یا schema خالی)
2. `PRAGMA foreign_keys=ON`; `PRAGMA journal_mode` مطابق تنظیمات
3. اگر schemaVersion قدیمی → migration chain
4. `navigator.storage.persist()` یک‌بار؛ نتیجه را در settings نشان بده
5. هر write: mutate memory DB → enqueue persist (temp key → swap)
6. قبل از unload: تلاش برای flush queue (موبایل تضمین نیست — موفقیت فقط بعد از persist صریح)

---

### Fixtureهای تست Reconciliation (حداقل)

| Fixture | Arrange | Assert |
|---------|---------|--------|
| `account_ok` | deposit 100 + expense 40 | `reconcileAccount` ok؛ balance=60 |
| `account_corrupt_snapshot` | ledger صحیح؛ snapshot دستی غلط | ok=false؛ rebuild → ok |
| `crypto_buy_sell` | buy 1 + sell 0.4 | holding qty/cost match rebuild |
| `crypto_transfer_fee` | transfer 1 fee 0.001 | Σ qty کاهش 0.001؛ reconcile ok |
| `cheque_cleared` | pending→cleared | ماتریس status/tx ids |
| `cheque_bounce_after_clear` | cleared→bounced | original void + reversal id |
| `loan_two_installments` | create + 2 pays | remainingBalance = rebuild |
| `fif_nav_vs_buy` | buy at subscription ≠ NAV | units/totalInvested از trades نه NAV |
| `metals_purity` | 1000mg 18k | fineWeight calc؛ holding key type+purity |

همه assertها با decimal string و `delta === '0'`.
Repair فقط API صریح با flag کاربر؛ تست‌ها Repair را جدا از reconcile بخوانند.

### Reversal و Journal
هر reverse دامنه باید در همان BEGIN/COMMIT یا journalهای `operationId` اصلی را void کند یا entryهای معکوس با `reversesOperationId` بنویسد. Snapshot rebuild بعد از هر دو.

### قرارداد Must-Have Audit
حداقل رویدادهای اجباری در `fin_audit_log`:
- void / reversal هر تراکنش مالی
- repair snapshot / rebuild
- import و restore backup
- تغییر تنظیمات امنیتی و `baseCurrency`
- create/void journal operation

فیلدهای حداقل: `id, at, action, actor (local user/device), operationId, entityType, entityId, beforeSummary, afterSummary, calculationVersion?`  
بدون payload حاوی API key. حذف فیزیکی audit ممنوع.

---

## Integrity Pipeline (Must Have)

```text
detect (reconcile / FK validate / orphan scan)
  → quarantine (flag entity: integrityStatus=suspect؛ جلوگیری از archive/delete خام)
  → reconcile (گزارش expected/actual/delta)
  → repair (صریح کاربر؛ transactional)
  → audit (fin_audit_log)
```

`ref_integrity_queue` ردیف‌ها: `{ id, entityType, entityId, issueCode, detectedAt, status: open|quarantined|repaired|dismissed, operationId? }`.

Archive والد فقط اگر صف open برای children خالی باشد یا RESTRICT.

---

## Reconciliation Engine مرکزی

ماژول `core/reconciliation/` — فیچرها فقط adapter می‌نویسند، نه engine جدا.

```typescript
interface ReconcileContext {
  scope: ReconcileScope;
  targetId: string;
  operationId?: string;
}

interface ReconcileResult {
  target: string;
  ok: boolean;
  expected: string; // decimal or structured JSON string
  actual: string;
  delta: string;
  source: 'domain_ledger' | 'cash_ledger' | 'journal' | 'mixed';
  repairStrategy: 'none' | 'rebuild_snapshot_from_ledger' | 'manual';
  severity: 'info' | 'warning' | 'critical';
  details?: string;
  calculationVersion?: string;
}

interface ReconcileAdapter {
  scope: ReconcileScope;
  computeExpected(id: string): Promise<string>;
  readActual(id: string): Promise<string>;
  repair?(id: string, ctx: ReconcileContext): Promise<void>; // فقط از engine
}
```

`reconcileAll` = اجرای همه adapterهای ثبت‌شده.

### Repair Transactional + Audited
```text
BEGIN
  validate target + pre-reconcile snapshot
  rebuild from ledger (Domain SoT)
  post-verify reconcile ok
  INSERT fin_audit_log (action=repair, before/after, calculationVersion)
  clear/update ref_integrity_queue
COMMIT
→ persist
→ سپس post-commit events
```
ممنوع: UPDATE snapshot بدون verify و audit.

---

## Backup Package و Restore Migration-Aware

### فایل Backup (نه فقط raw SQLite)
```text
{
  format: 'personal-fi-backup',
  schemaVersion: number,
  appVersion: string,
  databaseId: string,
  createdAt: ISO,
  checksum: string,  // of sqliteBlob
  sqliteBlob: ...    // or separate file + sidecar JSON
}
```
بدون schemaVersion + checksum → در v1 به‌عنوان backup کامل **رد** می‌شود.

### Restore pipeline (اجباری)
```text
1. parse package + checksum match
2. load into TEMP sql.js instance (نه db_main)
3. PRAGMA integrity_check / quick_check
4. verify required tables + foreign_keys
5. if backup.schemaVersion < app.schemaVersion → run migration chain on TEMP
6. re-verify integrity + schemaVersion == app
7. serialize TEMP → persist slots (backup current main first) → swap
8. fin_audit_log restore event
```
اگر migration fail → TEMP دور انداخته می‌شود؛ `db_main` قبلی سالم می‌ماند.

`beforeunload` هرگز مسیر اصلی save نیست و جایگزین pipeline بالا نمی‌شود.

---

## سیاست کاهش Polymorphic Link

`relatedFeature` + `relatedId` **فقط** جایی که رابطه واقعاً چندجدول است (مثلاً `acc_transactions` به چند منبع رویداد).

### ترجیح FK واقعی
| رابطه | به‌جای polymorphic |
|--------|---------------------|
| crypto tx → holding | `holdingId` FK |
| stock tx → brokerage | `brokerageId` FK |
| loan payment → loan | `loanId` FK |
| cheque → account | `accountId` FK |
| document → یک entity مشخص پرتکرار | جدول link اختصاصی یا FK مستقیم |

### Polymorphic مجاز
- `acc_transactions.related*` (ورود به cash از منابع مختلف)
- `docs_links` / notifications به چند نوع entity
- `fin_journal_entries.related*` برای audit میان‌فیچری

هر polymorphic: validate قبل از COMMIT + reconcile orphan + ترجیحاً `acc_transaction_links` برای روابط پرتکرار.

هدف: سطح Accounting-critical با FK واقعی؛ polymorphic حداقل و کنترل‌شده.

---

## Backward Compatibility Contract (حفظ داده)

1. **ممنوع** در migration تولیدی: `DROP COLUMN` روی داده مالی بدون دوره deprecate + export اجباری.
2. **ممنوع**: تغییر معنای semantic یک ستون موجود (مثلاً `amount` از gross به net) بدون ستون جدید و backfill.
3. افزودن ستون: nullable یا default امن؛ داده قدیمی معتبر می‌ماند.
4. Rename: ستون جدید + کپی + خواندن dual-write در یک نسخه؛ حذف قدیمی فقط در major بعدی پس از migrate همه backupها.
5. اصل محصول: **هیچ فیلد تاریخی از بین نرود** — legacy fee بدون breakdown حفظ می‌شود (الگوی سهام).

---

## Instrument Registry مرکزی

جدول `ref_instruments` (Core):

| فیلد | نقش |
|------|-----|
| `id` | UUID = **instrumentId** سراسری |
| `assetCategory` | crypto \| stock \| fif \| metal \| other |
| `displaySymbol` | label قابل‌تغییر |
| `name` | |
| `externalRef` | JSON: assetKey / ISIN / fundId / metalType+purity |

Holdingها و `price_history` فقط به `ref_instruments.id` (یا کلید معادل پایدار category-scoped که در registry ثبت شده) اشاره می‌کنند.

| دسته | هویت در registry |
|------|------------------|
| crypto | assetKey ثبت‌شده → instrument id |
| stock | ISIN/UUID پایدار — **نه symbol** |
| fif | fundId |
| metal | metalType + purity |

**Invariant:** `symbol` / `displaySymbol` هرگز UNIQUE identity holding نیست.

---

## مرز مستند در برابر Runtime

مستندات **قرارداد** هستند، نه اثبات اجرای صحیح در production.

تا وقتی برای مسیرهای زیر **تست/fixture اجرایی** وجود نداشته باشد، صحت محاسبات تضمین runtime ندارد:

BUY/SELL، C2C، Transfer+fee، Loan installment، Fund NAV vs redemption، Stock CA، reconcile/repair.

Checklist پیاده‌سازی + تست در `core/reconciliation` fixtures و unit تست Domain اجباری قبل از ادعای «آماده استفاده مالی» است.

### Numerical Fixtures اجباری (Must Have قبل از release مالی)

مسیر پیشنهادی: `tests/fixtures/financial/*.json` + runner که Domain/Engine را صدا می‌زند — **نه** فقط mock UI.

هر fixture: `{ name, inputs, steps[], expected: { state, realizedPL?, journalBalance? } }` با decimal string.

| ID | سناریو | assert کلیدی |
|----|--------|----------------|
| `crypto_buy_fee_quote` | BUY 1 BTC fee 10 USDT | qty=1, cost includes feeIn |
| `crypto_buy_fee_base` | BUY gross 1 fee 0.001 BTC | netQty=0.999 |
| `crypto_sell` | SELL partial | realizedPL, avg unchanged on remainder |
| `crypto_c2c` | ETH→BTC | cost moved, dual leg |
| `crypto_transfer_fee` | transfer 1 fee 0.001 | Σ qty −0.001 |
| `multi_currency_fee` | feeCurrency ≠ trade currency | feeInTradeCurrency |
| `stock_split` | 1000 → 1:2 | qty=2000, totalInvested same |
| `stock_bonus` | bonus 1:10 | qty up, invested same |
| `stock_rights` | issue+exercise | cost + cash |
| `fif_nav_ne_subscription` | buy @ 1010 NAV 1000 | avg from 1010 not NAV |
| `fif_reinvest` | dual leg income+buy | units+invested+journal |
| `loan_flat` | flat 18% 18m | totalInterest formula |
| `loan_declining` | monthly r=getPeriodRate | portions |
| `loan_grace` | interest-only then amort | |
| `loan_penalty` | cap scope lifetime vs per installment | |

**قانون:** تا این fixtureها در CI سبز نباشند، مسیر مالی «تأییدشده» اعلام نشود. مستند به‌تنهایی bug runtime را close نمی‌کند.

### Invariant: Transfer Accounting-neutral

هر `entryKind = transfer` (جابه‌جایی بین حساب‌های خود کاربر یا معادل asset-location):
- نباید در totals درآمد/هزینه ظاهر شود
- نباید `accountClass` برابر `income` یا `expense` برای اصل مبلغ باشد
- Journal Engine / validate قبل از COMMIT این را enforce می‌کند

---

## سلسله‌مراتب قطعی نوشتن (ضد drift)

در **یک** `runAtomicFinancialOperation`:

```text
1. Domain feature rows (SoT جزئیات: qty, loan portion, …)
2. fin_journal_entries متوازن (SoT میان‌فیچری)
3. acc_transactions فقط اگر bank cash جابه‌جا شود (SoT cash بانکی)
4. Snapshots = تابع خالص از (1) یا (3) — همان عدد محاسبه‌شده یک‌بار
```

| سؤال | جواب |
|------|------|
| qty holding از کجا؟ | Domain ledger → snapshot کپی نتیجه rebuild/apply |
| موجودی بانک؟ | Σ acc_transactions → currentBalance |
| گزارش Expense؟ | exp_* یا journal expense — نه هر دو |
| Net Worth؟ | Portfolio از live inputs |

**ممنوع:** سه منبع را «authoritative موازی» خواندن در یک گزارش.

### Snapshot derivation
```text
newBalance = f(previousCanonical, txEffect)
balanceAfterTransaction = newBalance  // همان مقدار
currentBalance = newBalance           // همان مقدار
```
نه دو فرمول جدا برای `balanceAfter` و `currentBalance`.

### Fee روی acc_transactions

| فیلد | معنی |
|------|------|
| `amount` | **اصل حرکت** بدون fee (مثلاً برداشت ۱۰۰؛ amount=100) |
| `feeAmount` | کارمزد جدا (مثلاً ۵) |
| اثر روی موجودی | برای withdrawal: `−amount − feeAmount` (اگر fee از همین حساب) |

Journal:
```text
Cr cash  amount
Cr cash  feeAmount   (یا یک خط مجموع با split در journal lines)
Dr expense/fee  feeAmount
```

**Invariant:** `amount` هرگز «شامل fee» و همزمان `feeAmount` پر نیست — در آن صورت double deduction. Validate: اگر fee از حساب کم می‌شود، `cashDelta = −(amount+fee)` یک‌بار.

### Transfer — دروازه اجرا
قانون accounting-neutral در مستند است؛ **تا fixture `bank_transfer_neutral` در CI سبز نشود**، feature transfer «تأییدشده» اعلام نمی‌شود (همان مرز docs vs runtime).
