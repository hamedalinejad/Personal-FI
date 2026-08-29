# 00 overview

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

## قوانین

- تمام تراکنش‌های مالی در SQLite ذخیره می‌شوند.
- LocalStorage فقط برای تنظیمات UI و داده‌های غیرحساس استفاده شود.
- داده‌های حساس (مثلاً API keys) هرگز ذخیره نشوند.
- تمام مبالغ باید به‌صورت **decimal string** ذخیره شوند (Amount Storage v1 — Project-Blueprint و این سند).


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

## سیاست حجم price_history

| کنترل | قانون |
|--------|--------|
| Dedupe | الزامی: همان instrumentId+source+quoteMarket+price+marketDate/fetchedAt bucket روزانه → یک ردیف |
| Archive/purge | Settings: حذف/آرشیو قیمت‌های قدیمی‌تر از N سال (پیش‌فرض پیشنهادی ۵؛ قابل تنظیم) با تأیید کاربر + audit |
| آستانه | اگر تخمین ردیف‌ها یا حجم serialize از آستانه Settings گذشت → هشدار Dashboard/Settings |
| Auto-Sync | فقط instrumentهای دارای holding فعال؛ نه کل جهان دارایی‌ها |

---

