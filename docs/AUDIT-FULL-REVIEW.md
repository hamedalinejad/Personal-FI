# بررسی کامل پروژه Personal-FI — باگ‌ها، ابهامات، ارتقاها و نواقص

> **این سند به‌صورت زنده و خط‌به‌خط در حین بررسی تکمیل می‌شود.** هر مورد بلافاصله بعد از کشف اضافه می‌شود، نه در پایان.
> **تاریخ شروع بررسی:** ۱۴۰۴ (Session جدید)
> **دامنه:** تمام فایل‌های `docs/` — Blueprint، Technical Architecture، Product Map، Pages-IA، تمام core (db, types, services, hooks, utils, lib, stores, styles, rounding)، و تمام ۲۰ فیچر محصول (شامل Price Fetching با ۴ زیرفیچر).

## ساختار هر مورد

هر مورد شامل سه بخش الزامی است:
1. **باگ / ایراد / ابهام / نیاز به ارتقا / نقص** — دقیقاً چه مشکلی است
2. **محل** — فایل، بخش، و تمام فایل‌های وابسته/متأثر دیگر
3. **راه‌حل** — چطور باید رفع شود

## وضعیت پیشرفت بررسی

- [x] Project-Blueprint.md
- [x] Technical-Architecture.md
- [x] Product-Map-FA.md / Product-Map-EN.md
- [x] Pages-IA.md
- [x] core/db/db.md
- [x] core/types/types.md
- [x] core/services/services.md
- [x] core/hooks/hooks.md
- [x] core/utils/utils.md
- [x] core/rounding/Rounding-Policy.md
- [x] lib/lib.md
- [x] stores/stores.md
- [x] styles/styles.md
- [x] 00-Accounts-Banking
- [x] 01-Income
- [x] 02-Expense
- [x] 03-Cheque-Management
- [x] 04-Debt-Loan-Management
- [x] 05-01-Investment-Crypto
- [x] 05-02-Investment-Stocks-Iran
- [x] 05-03-Fixed-Income-Funds
- [x] 05-04-Metals
- [x] 06-Physical-Assets
- [x] 07-Budget-Management
- [x] 08-Financial-Goals
- [x] 09-Bills-Recurring-Transactions
- [x] 10-Notification-Reminder-System
- [ ] 11-Reports-Analytics
- [ ] 12-Dashboard
- [ ] 13-Portfolio-Wealth-Overview
- [ ] 14-Tax-Management
- [ ] 15-Document-Management
- [ ] 16-Settings-Tools
- [ ] 17-Currency-CrossRate
- [ ] 18-Security-Privacy
- [ ] 19-Price-Fetching (+ ۴ زیرفیچر)
- [ ] 99-Common-Categories
- [ ] بررسی نهایی روابط بین فیچرها (Cross-Feature Consistency)

---

## فهرست موارد

### مورد ۱ — ساختار پوشه مستندات در Blueprint با ساختار واقعی ریپازیتوری مطابقت ندارد

**۱. باگ/ابهام:** بخش ۱۶ (`Documentation Structure`) در `Project-Blueprint.md` ساختار زیر را به‌عنوان مرجع رسمی مستندات تعریف کرده:
```
docs/
  00-Product/
  01-Business/
  02-Design/
  03-Technical/
  04-Project/
  99-Future-Ideas/
```
اما ساختار واقعی فعلی ریپازیتوری این‌طور است:
```
docs/
  00-Product/     (فقط همین یکی از ۶ پوشه واقعاً ساخته شده)
  core/
  features/
  lib/
  stores/
  styles/
```
پوشه‌های `01-Business`, `02-Design`, `03-Technical`, `04-Project`, `99-Future-Ideas` هرگز ساخته نشده‌اند و در عوض پوشه‌های `core/`, `features/`, `lib/`, `stores/`, `styles/` (که در Blueprint اصلاً ذکر نشده‌اند) استفاده شده. این یعنی سند بنیادین پروژه (که قرار است مرجع تمام تصمیمات ساختاری باشد) دیگر با واقعیت پروژه هم‌خوان نیست.

**۲. محل:**
- `docs/Project-Blueprint.md` — بخش ۱۶ (Documentation Structure)
- وابسته: کل ساختار فعلی `docs/` (تمام پوشه‌های `core/`, `features/`, `lib/`, `stores/`, `styles/`, `00-Product/`)

**۳. راه‌حل:** بخش ۱۶ باید با ساختار واقعی به‌روزرسانی شود تا Blueprint دوباره مرجع درست باشد. پیشنهاد:
```
docs/
  00-Product/        # نقشه صفحات، محصول
  core/              # db, types, services, hooks, utils, lib, stores, styles, rounding
  features/          # هر فیچر با شماره پیشوند (00 تا 19+)
  BUGS-REPORT.md      # (یا هر نام یکپارچه‌ای که برای گزارش‌های ممیزی انتخاب می‌شود)
```
یا اگر ساختار پیشنهادی اصلی (Business/Design/Technical/Project) هنوز مدنظر است، باید یک ADR رسمی برای این تغییر معماری مستندات ثبت شود (طبق بند ۱۸ خود Blueprint که می‌گوید «هیچ تصمیم مهمی نباید فقط در کد اعمال شود») و بعد فایل‌های فعلی به آن ساختار منتقل شوند.

---

### مورد ۲ — عدم وجود فایل‌های README.md الزامی طبق بند ۱۴ Blueprint

**۱. باگ/ابهام:** بند ۱۴ (`Documentation Standards`) صراحتاً می‌گوید: «هر پوشه دارای README.md باشد» — این یک قاعده الزامی (نه پیشنهادی) است. اما در عمل هیچ‌کدام از پوشه‌های `docs/features/*`, `docs/core/*`, `docs/00-Product/`, `docs/lib/`, `docs/stores/`, `docs/styles/` دارای `README.md` نیستند (بررسی می‌شود، ولی از روی فهرست فایل‌ها که فقط یک فایل `.md` توصیفی در هرکدام هست، نه `README.md` جداگانه).

**۲. محل:** تمام پوشه‌های `docs/features/*/`, `docs/core/*/` و غیره — وابسته به بند ۱۴ در `Project-Blueprint.md`

**۳. راه‌حل:** یا این بند از Blueprint حذف/نرم‌تر شود (چون در عمل هر فیچر همین‌الان یک فایل توصیفی هم‌نام دارد که همان نقش README را بازی می‌کند — کافی است این الگو رسماً به‌جای README.md به‌عنوان قاعده مستند شود)، یا واقعاً یک README.md مختصر (چند خط، فقط برای ناوبری) به هر پوشه اضافه شود. با توجه به هدف «سادگی» که خودتان تأکید کردید، پیشنهاد اول (نرم‌کردن قاعده در خود Blueprint) منطقی‌تر است تا فایل‌های تکراری اضافه نشوند.

---

### مورد ۳ — پوشه‌بندی کد در Technical-Architecture با پوشه‌بندی مستندات هماهنگ نیست

**۱. باگ/ابهام:** بخش ۳ (`ساختار پوشه‌بندی پروژه`) در `Technical-Architecture.md` ساختار `src/api/` را به‌عنوان «تنها دروازه cross-feature» تعریف کرده (طبق باگ ۴۹ که در همین فایل ارجاع داده شده). اما در توضیح لایه‌ها (بخش ۹ Blueprint و قرارداد دسترسی بین لایه‌ها در همین فایل) صراحتاً گفته شده «Feature A از API عمومی Feature B صدا بزند» — یعنی خودِ فیچر یک Public API دارد، نه اینکه یک پوشه جداگانه `api/` در سطح `src/` وسط همه فیچرها بنشیند. این دو مدل (API داخل خود فیچر در برابر یک لایه `api/` مجزا در ریشه `src/`) در متن به‌جای هم استفاده شده‌اند بدون این‌که مشخص شود کدام واقعی است:
```
src/
  features/accounts/   ← این فیچر باید public-api خودش را داشته باشد؟
  api/                 ← یا این پوشه مرکزی مسئول است؟
```
اگر منظور این است که `api/` صرفاً aggregator/re-export از `features/*/public-api` هاست، باید صریحاً گفته شود؛ در غیر این صورت پیاده‌ساز نمی‌داند منطق واقعی API کجا نوشته می‌شود.

**۲. محل:**
- `docs/Technical-Architecture.md` — بخش ۳ (Folder Structure) و بخش «قرارداد دسترسی بین لایه‌ها (باگ ۴۹)» و «Enforce مرز Feature (BUG-040)»
- وابسته: تمام فایل‌های `docs/features/*/` که بخش «APIهای داخلی» دارند (چون این APIها باید مشخص شود دقیقاً در کدام لایه فیزیکی کد قرار می‌گیرند)

**۳. راه‌حل:** یک جمله صریح اضافه شود: مثلاً «هر فیچر یک فایل `features/<name>/public-api.ts` دارد که تمام APIهای مستندشده در `docs/features/<name>/*.md` بخش «APIهای داخلی» را export می‌کند؛ پوشه ریشه `src/api/` فقط یک Re-export/Facade اختیاری برای راحتی import در UI است و منطقی در آن نوشته نمی‌شود.» این رفع ابهام باعث می‌شود بند ۴۰ (Enforce مرز Feature) با ESLint واقعاً قابل پیاده‌سازی باشد.

---

### مورد ۴ — سیاست شبکه (Network Access Policy) استثنای «بررسی نسخه» و «لایسنس» را دارد ولی به Update خودِ اپ (PWA Service Worker) اشاره نکرده

**۱. باگ/ابهام:** بخش «سیاست دسترسی به شبکه» می‌گوید فقط دو استثنا برای درخواست شبکه خودکار مجاز است: (۱) Version Check و (۲) License Validation (در آینده). اما خودِ Service Worker برای به‌روزرسانی App Shell/کد اپ (که در بخش ۲ همین فایل الزامی شده: «Service Worker برای Cache کردن App Shell و WASM sql.js الزامی است») ذاتاً باید هر از گاهی چک کند نسخه جدید کد در دسترس هست یا نه (رفتار استاندارد Service Worker با `updatefound` / `navigator.serviceWorker.register`). این یک درخواست شبکه خودکار جداگانه از «Version Check» توضیح داده‌شده است (که ظاهراً برای نمایش شماره نسخه به کاربر است، نه برای بارگذاری فایل‌های جدید اپ) — و این تناقض با قانون کلی «هیچ درخواست شبکه‌ای... بدون رضایت قبلی/آگاهانه کاربر اجرا نمی‌شود» مشخص نشده.

**۲. محل:** `docs/Technical-Architecture.md` — بخش «سیاست دسترسی به شبکه» در تقابل با بخش ۲ (سازگاری PWA و موبایل آفلاین) همان فایل، خط «Service Worker ... الزامی است»

**۳. راه‌حل:** یک استثنای سوم صریح اضافه شود: «به‌روزرسانی خودکار Service Worker (چک نسخه جدید App Shell طبق رفتار استاندارد مرورگر) از این قانون مستثناست، چون بخشی از چرخه عمر عادی PWA است نه یک ویژگی محصول؛ هیچ داده کاربر رد و بدل نمی‌شود و کاملاً استاندارد W3C است» — تا این ابهام از بین برود و با بند «فقط همین دو مورد؛ هر مورد جدید باید صریحاً به همین لیست اضافه شود» سازگار شود.



### مورد ۵ — توضیح فیچر ۲۰ (Price Fetching) در Product-Map با پیاده‌سازی واقعی فیچر منسوخ شده

**۱. باگ/ابهام:** توضیح فیچر ۲۰ در `Product-Map-FA.md` و `Product-Map-EN.md` می‌گوید: «دریافت **دستی** قیمت لحظه‌ای دارایی‌ها (**رمزارز در نسخه ۱**؛ سهام، مسکن و فلزات در آینده)». اما طبق خودِ سند `Price-Fetching.md` (خط ۳۸): «هر **چهار زیرفیچر** Must Have (کریپتو، سهام ایران، NAV صندوق، فلزات) در نسخه ۱» پیاده می‌شوند — یعنی سهام و صندوق و فلزات دیگر «در آینده» نیستند، همین الان در scope نسخه ۱ هستند. همچنین کلمه «دستی» گمراه‌کننده است چون سیستم علاوه بر ثبت دستی، قابلیت **Auto-Sync اختیاری** هم دارد (طبق «مسیر ۱» و «مسیر ۲» در همان سند). این عدم‌هم‌خوانی یعنی هر کسی که فقط Product-Map را بخواند، تصور اشتباهی از دامنه واقعی فیچر ۲۰ پیدا می‌کند.

**۲. محل:**
- `docs/Product-Map-FA.md` — فیچر ۲۰
- `docs/Product-Map-EN.md` — فیچر ۲۰
- منبع صحت: `docs/features/19-Price-Fetching/Price-Fetching.md` (خط ۳۸ و بخش «دو مسیر دریافت قیمت»)
- وابسته: چهار زیرفیچر `19-01` تا `19-04`

**۳. راه‌حل:** متن فیچر ۲۰ در هر دو Product-Map به‌روزرسانی شود، مثلاً:
> «دریافت قیمت لحظه‌ای دارایی‌های سرمایه‌گذاری کاربر (رمزارز، سهام ایران، NAV صندوق‌های درآمد ثابت، فلزات) — هم با ثبت دستی و هم با Auto-Sync اختیاری از منابع بیرونی، با کش کامل آفلاین در `price_history`. صفحه مستقل ندارد و از داخل صفحه سرمایه‌گذاری/تنظیمات استفاده می‌شود.»

---

### مورد ۶ — عدم ذکر Currency & Multi-Currency و Common Categories در تناظر با شماره‌گذاری پوشه‌های `docs/features/`

**۱. باگ/ابهام:** Product-Map فیچرها را از ۱ تا ۲۰ شماره‌گذاری کرده و فیچر ۲ را «ارز و چندارزی» گذاشته، اما پوشه واقعی آن `docs/features/17-Currency-CrossRate/` است — یعنی شماره‌گذاری Product-Map (بر اساس اهمیت/ترتیب منطقی محصول) هیچ ارتباط عددی با شماره پوشه واقعی ندارد (۲ در برابر ۱۷). این به‌تنهایی باگ نیست (دو سیستم شماره‌گذاری مستقل‌اند، همان‌طور که می‌تواند عمدی باشد) اما **هیچ‌جا این نگاشت مستند نشده** — یعنی وقتی کسی می‌خواهد از «فیچر ۲» در Product-Map به پوشه واقعی کد برسد، باید حدس بزند. همچنین فیچر «۹۹-Common-Categories» (که در `docs/features/99-Common-Categories/Categories.md` وجود دارد و یک فیچر واقعی/جدول مشترک دسته‌بندی‌هاست) اصلاً در هیچ‌کدام از دو Product-Map ذکر نشده — نه به‌عنوان فیچر ۲۱، نه در جای دیگر.

**۲. محل:**
- `docs/Product-Map-FA.md` و `docs/Product-Map-EN.md` — کل فهرست فیچرها
- `docs/features/99-Common-Categories/Categories.md` — فیچر گم‌شده از نقشه
- وابسته: تمام ۲۰ پوشه فیچر زیر `docs/features/`

**۳. راه‌حل:**
- یک جدول Mapping کوچک به انتهای هر دو Product-Map اضافه شود: `شماره Product-Map ↔ نام پوشه docs/features/`
- فیچر `99-Common-Categories` به‌عنوان یک ردیف («۲۱. دسته‌بندی‌های مشترک») یا حداقل یک یادداشت («جدول‌های دسته‌بندی مشترک بین همه فیچرها، بدون صفحه مستقل») به Product-Map اضافه شود تا نقشه واقعاً «کامل» باشد همان‌طور که مقدمه ادعا می‌کند («این سند نقشه کامل محصول را توصیف می‌کند»).

---

### مورد ۷ — تب صندوق‌ها (`/investments/fif`) فاقد دکمه «دریافت قیمت» برخلاف سه تب دیگر سرمایه‌گذاری

**۱. باگ/ابهام:** در بخش «Sub-routes کامل → صفحه ۴ — سرمایه‌گذاری» سه تب کریپتو، سهام و فلزات هرکدام صراحتاً دارای «+ دکمه «دریافت قیمت»» هستند، اما تب صندوق‌ها (`── تب صندوق‌ها ──`) این خط را ندارد؛ فقط یک Sub-route `/investments/fif/:fundId/nav` برای «فرم ثبت **دستی** NAV» دارد. این با خودِ سند `19-03-Fund-NAV/Fund-NAV.md` که API `fetchFundNAV(fundId)` (دریافت خودکار NAV از منبع per-fund) و Auto-Sync per-fund را تعریف کرده در تناقض است — یعنی طبق مستندات فیچر ۱۹، کاربر باید بتواند برای صندوقی که Source مشخص‌شده دارد، NAV را با یک کلیک Fetch کند؛ اما در نقشه صفحات، تنها راه صریح، ثبت دستی نشان داده شده است.

**۲. محل:**
- `docs/00-Product/Pages-IA.md` — بخش «تب صندوق‌ها» زیر «صفحه ۴ — سرمایه‌گذاری»
- منبع صحت: `docs/features/19-Price-Fetching/19-03-Fund-NAV/Fund-NAV.md` (API `fetchFundNAV`, `setFundAutoSyncSettings`)

**۳. راه‌حل:** به Sub-route تب صندوق‌ها یک خط اضافه شود: «+ دکمه «دریافت NAV» (فقط برای صندوق‌هایی که `price_sources` اختصاصی دارند) + سوییچ Auto-Sync per-fund»، هماهنگ با الگوی سه تب دیگر.

---

### مورد ۸ — مسیر Reversal/اصلاح تراکنش‌های Immutable هیچ Sub-route یا UI مشخصی در نقشه صفحات ندارد

**۱. باگ/ابهام:** طبق اصل «Immutable Transactions» در Blueprint و طبق Business Rules تکرارشده در تقریباً همه فیچرهای مالی (Income، Expense، FIF، و غیره)، اصلاح یک تراکنش هرگز با UPDATE مستقیم نیست، بلکه با ایجاد یک تراکنش اصلاحی/Reversal انجام می‌شود. اما در `Pages-IA.md`، هیچ‌کدام از Sub-routeهای فهرست‌شده (نه در `/transactions/:id`، نه در `/investments/.../:id`، نه در `/loans/:id`) یک مسیر یا دکمه صریح برای «اصلاح/Reversal» ندارند — فقط فرم‌های `/new` (ثبت جدید) دیده می‌شوند. کاربری که می‌خواهد یک تراکنش ثبت‌شده را اصلاح کند، در نقشه فعلی صفحات هیچ مسیر مشخصی برای این کار پیدا نمی‌کند.

**۲. محل:**
- `docs/00-Product/Pages-IA.md` — تمام بخش‌های `/:id` (جزئیات تراکنش/وام/سرمایه‌گذاری)
- وابسته: `docs/Project-Blueprint.md` بند «Immutable Transactions»، و تمام فیچرهایی که «تراکنش‌های ... پس از ثبت غیرقابل ویرایش هستند» را در Business Rules خود دارند (Income, Expense, FIF, و مشابه)

**۳. راه‌حل:** یک الگوی UI عمومی مستند شود، مثلاً: در صفحه جزئیات هر تراکنش (`/transactions/:id`)، به‌جای دکمه «ویرایش» یک دکمه «اصلاح» وجود دارد که کاربر را به یک Sheet می‌برد که در پس‌زمینه یک تراکنش Reversal + یک تراکنش جدید اصلاح‌شده می‌سازد؛ این الگو در Sub-routes مشابه (`/loans/:id`, `/investments/.../:transactionId`) هم تکرار شود. این جزئیات UI باید قبل از پیاده‌سازی صفحات جزئیات مستند شود تا هر فیچر الگوی متفاوتی اختراع نکند.

---

### مورد ۹ — سه جدول اختیاری (`fin_audit_log`, `acc_transaction_links`, `ref_integrity_queue`) در فهرست مرکزی جداول ثبت نشده‌اند

**۱. باگ/ابهام:** خودِ `db.md` صراحتاً می‌گوید بخش «لیست مرکزی همه‌ی جدول‌ها» نقش «فهرست مرکزی همه‌ی جدول‌ها» را دارد و «همه جداول تمام فیچرها در اینجا لیست شده‌اند» — این دقیقاً همان قاعده‌ای است که خودِ این سند قبلاً برای رفع یک باگ مشابه به کار برده («جدول `ln_rate_history` در فهرست مرکزی جداول ثبت نشده بود»، طبق یادداشت باقی‌مانده در بخش «فهرست موارد» بالای همین فایل بررسی من). اما همین الگو در سه جای دیگر `db.md` تکرار شده: جداول `acc_transaction_links` (بخش Polymorphic FK)، `fin_audit_log` (بخش Audit Trail)، و `ref_integrity_queue` (بخش تقویت Integrity) — هرکدام با ساختار فیلد کامل توضیح داده شده‌اند اما در جدول اصلی «لیست مرکزی» هیچ ردیفی برای آن‌ها نیست. حتی اگر این سه جدول با برچسب «اختیاری/Should Have» باشند، طبق فلسفه خودِ سند («فهرست مرکزی») باید حداقل با وضعیت مشخص (`Optional`/`Should Have`) در جدول اصلی دیده شوند — وگرنه در Migration به‌راحتی فراموش می‌شوند، دقیقاً همان ریسکی که باعث ثبت `ln_rate_history` شده بود.

**۲. محل:**
- `docs/core/db/db.md` — بخش «لیست مرکزی همه‌ی جدول‌ها» (جای خالی) در برابر بخش‌های «Polymorphic FK» (خط ۶۱۳)، «قرارداد Audit Trail مالی» (خط ۶۶۳)، «تقویت Integrity لینک Polymorphic» (خط ۶۸۶) در همان فایل

**۳. راه‌حل:** سه ردیف زیر به جدول «لیست مرکزی همه‌ی جدول‌ها» اضافه شود (با ذکر صریح وضعیت اختیاری بودن در ستون توضیح، مثلاً):
```
| `acc_transaction_links` | Accounts & Banking (مشترک) | لینک صریح polymorphic برای گزارش/reconcile — Should Have |
| `fin_audit_log`         | Core (مشترک همه فیچرها)     | ردپای عملیاتی برای void/reversal/repair — Should Have |
| `ref_integrity_queue`   | Core (مشترک همه فیچرها)     | صف بررسی یکپارچگی قبل از archive والد — Should Have |
```

---

### مورد ۱۰ — پیشوند جدول برای سه جدول Core-Level مشترک (`fin_`, `ref_`) در «قوانین نام‌گذاری جداول» تعریف نشده

**۱. باگ/ابهام:** جدول «قوانین نام‌گذاری جداول» در `db.md` ۲۱ پیشوند را دقیقاً متناظر با ۲۱ فیچر لیست کرده (`acc_`, `inc_`, ...، `price_`). اما جدول `fin_audit_log` (که خودِ سند «مشترک بین همه فیچرها» توصیف کرده، نه مختص یک فیچر خاص) از پیشوند `fin_` استفاده می‌کند و جدول `ref_integrity_queue` از پیشوند `ref_` — هیچ‌کدام از این دو پیشوند در جدول قوانین نام‌گذاری تعریف نشده‌اند. این با قاعده کلی «همه جداول باید از snake_case با پیشوند کوتاه فیچر استفاده کنند» مغایرت جزئی دارد چون این دو جدول اصلاً «فیچر» نیستند، بلکه سرویس‌های Core مشترک‌اند — پس نیاز به یک دسته جدید در قوانین نام‌گذاری («پیشوندهای Core مشترک») دارند، نه فقط «پیشوند فیچر».

**۲. محل:** `docs/core/db/db.md` — بخش «قوانین نام‌گذاری جداول» در برابر تعریف `fin_audit_log` و `ref_integrity_queue` در همان فایل

**۳. راه‌حل:** یک ردیف/دسته جدید به جدول قوانین نام‌گذاری اضافه شود، مثلاً: «`fin_` / `ref_` → Core مشترک (نه مختص یک فیچر) — برای جداول زیرساختی مثل Audit Trail و Integrity Queue که به همه فیچرها خدمت می‌کنند».

---

### مورد ۱۱ — فقدان `reconcileStockHolding` برای دارایی سهام؛ `ReconcileScope` سهام را پوشش نمی‌دهد

**۱. باگ/ابهام:** جدول APIهای Reconciliation در `db.md` برای هر نوع دارایی سرمایه‌گذاری یک تابع اختصاصی دارد: `reconcileCryptoHolding`، `reconcileFund`، `reconcileMetalsHolding` — که هرکدام `quantity`/`units`/`totalInvested` را با مجموع تراکنش‌های همان Holding می‌سنجند. اما برای سهام ایران فقط `reconcileBrokerage` تعریف شده که طبق توضیح خودش فقط `cashBalance` (موجودی نقدی کارگزاری) را در برابر تراکنش‌های نقدی می‌سنجد — هیچ تابعی برای مقایسه `quantity`/`averageBuyPrice` خودِ `inv_stocks_iran_holdings` با مجموع تراکنش‌های خرید/فروش سهام وجود ندارد. همچنین `ReconcileScope` (union type در `types.md`) مقدار `'crypto_holding'`, `'fund'`, `'metals_holding'` دارد اما معادل سهام (`'stock_holding'`) در این Union نیست.

**۲. محل:**
- `docs/core/types/types.md` — بخش `reconciliation.ts`، تعریف `ReconcileScope`
- `docs/core/db/db.md` — بخش «قرارداد Reconciliation مرکزی»، جدول APIهای مشترک
- وابسته: `docs/features/05-Investment/05-02-Investment-Stocks-Iran/Investment-Stocks-Iran.md`

**۳. راه‌حل:**
- افزودن مقدار `'stock_holding'` به `ReconcileScope` در `types.md`
- افزودن ردیف `reconcileStockHolding(holdingId)` به جدول APIهای Reconciliation در `db.md`، با همان الگوی سایر Holdingها: `quantity` / `totalInvested` ↔ Σ `inv_stocks_iran_transactions` (buy/sell)
- به‌روزرسانی `reconcileAll()` تا این تابع جدید را هم شامل شود




### مورد ۱۲ — جدول رویدادهای Event Bus در `services.md` فقط ۶ از ۱۶ رویداد واقعیِ تعریف‌شده در `AppEvent` را پوشش می‌دهد

**۱. باگ/ابهام:** بخش «Event Bus» در `services.md` یک جدول با ۶ ردیف ارائه می‌دهد (`TransactionCreated`, `AccountBalanceUpdated`, `BudgetExceeded`, `LoanPaymentDue`, `PriceFetchCompleted`, `VersionUpdateAvailable`) و آن را به‌عنوان «رویدادهای تعریف‌شده» معرفی می‌کند. اما نوع واقعی `AppEvent` در `types.md` (بخش `events.ts`) شامل ۱۶ رویداد است؛ ۱۰ رویداد دیگر اصلاً در جدول `services.md` نیامده‌اند: `BudgetUpdated`، `InvestmentValueUpdated`، `PortfolioSnapshotCreated`، `LoanPaymentMade`، `ChequeDue`، `ChequeStatusChanged`، `MetalsDeliveryStatusChanged`، `TaxDue`، `TaxPaid`، `PriceFetchStarted`. از آنجا که `services.md` تنها سند توصیفیِ لایه Event Bus است (نه صرفاً تعریف نوع)، این عدم‌هم‌خوانی باعث می‌شود توسعه‌دهنده‌ای که فقط `services.md` را می‌خواند تصور کند فقط ۶ رویداد در سیستم وجود دارد، درحالی‌که فیچرهایی مثل چک، فلزات، مالیات، سرمایه‌گذاری و بودجه هرکدام رویداد اختصاصی خودشان را منتشر می‌کنند.

**۲. محل:**
- `docs/core/services/services.md` — بخش «Event Bus» (جدول رویدادها)
- منبع صحت: `docs/core/types/types.md` — بخش `events.ts`، تعریف `AppEvent` (۱۶ عضو Union)

**۳. راه‌حل:** جدول Event Bus در `services.md` با تمام ۱۶ رویداد `AppEvent` همگام شود (یا حداقل یک یادداشت اضافه شود: «فهرست کامل و به‌روز رویدادها همیشه در `types.md → events.ts` است؛ این جدول فقط نمونه‌ای از دسته‌های اصلی است»)، تا از drift مستندات در آینده (با اضافه‌شدن رویداد جدید به `AppEvent` بدون به‌روزرسانی این جدول) جلوگیری شود.

---

### مورد ۱۳ — سرویس Event Bus فاقد قرارداد/امضای متد (Interface) مشخص است؛ فقط نوع Payload (`AppEvent`) تعریف شده، نه خودِ سرویس

**۱. باگ/ابهام:** هم `services.md` و هم `types.md` فقط *محتوای* رویدادها (`AppEvent` Union) و *هدف* Event Bus را توضیح می‌دهند، اما هیچ‌جا امضای واقعی متدهای خودِ سرویس (`emit`/`publish`، `on`/`subscribe`، `off`/`unsubscribe`) تعریف نشده — نه به‌صورت TypeScript interface در `types.md`، نه به‌صورت جدول API در `services.md` (برخلاف الگوی سایر سرویس‌ها/جداول مرکزی که همیشه امضای دقیق API را می‌آورند، مثل جدول APIهای Reconciliation در `db.md`). بدون این قرارداد، هر فیچری که بخواهد `PriceFetchCompleted` یا `TransactionCreated` را subscribe کند، امضای دقیق فراخوانی (sync/async بودن `emit`، نوع بازگشتی `subscribe` برای unsubscribe کردن، رفتار در صورت throw شدن خطا در یک listener) را نمی‌داند.

**۲. محل:**
- `docs/core/services/services.md` — بخش «Event Bus» (نیازمند جدول/بلوک API)
- `docs/core/types/types.md` — بخش `events.ts` (نیازمند تعریف Interface سرویس، نه فقط نوع Payload)

**۳. راه‌حل:** یک بلوک کد TypeScript به یکی از این دو فایل (ترجیحاً `types.md` کنار تعریف `AppEvent`) اضافه شود، مثلاً:
```typescript
interface EventBus {
  emit<T extends AppEvent['type']>(type: T, payload: Extract<AppEvent, { type: T }>['payload']): void;
  subscribe<T extends AppEvent['type']>(type: T, handler: (payload: Extract<AppEvent, { type: T }>['payload']) => void): () => void; // برمی‌گرداند: تابع unsubscribe
}
```
و در `services.md` رفتار خطا (isolate کردن exception هر listener تا listenerهای دیگر متوقف نشوند) و sync/async بودن `emit` صراحتاً مستند شود.

### مورد ۱۴ — `lib.md` به «IndexedDB Service» به‌عنوان یک سرویس هنوز موجود اشاره می‌کند، درحالی‌که `services.md` صراحتاً حذف آن را مستند کرده

**۱. باگ/ابهام:** در `lib/lib.md`، بخش «چرا `storage.ts` در این پوشه نیست؟» می‌گوید لایه LocalStorage «در کنار سایر سرویس‌های زیرساختی مثل **IndexedDB Service** باشد» — یعنی به وجود یک `indexedDbService` در `core/services/` اشاره می‌کند. اما `core/services/services.md` (بخشی که در همین بررسی قبلاً چک شد) دقیقاً برعکس این را می‌گوید: یک یادداشت مجزا با عنوان «چرا `indexedDbService.ts` از پروژه حذف شد؟» توضیح می‌دهد که این سرویس عمداً حذف شده و منطق نوشتن/خواندن IndexedDB مستقیماً در `core/db/db.ts` (با الگوی Write-to-temp-then-swap) پیاده می‌شود. این دو سند مستقیماً با هم در تناقض‌اند — یکی فرض می‌کند IndexedDB Service وجود دارد، دیگری صراحتاً می‌گوید وجود ندارد.

**۲. محل:**
- `docs/lib/lib.md` — بخش «چرا `storage.ts` در این پوشه نیست؟»
- منبع صحت: `docs/core/services/services.md` — بخش «چرا `indexedDbService.ts` از پروژه حذف شد؟»

**۳. راه‌حل:** عبارت «سایر سرویس‌های زیرساختی مثل IndexedDB Service» در `lib.md` حذف یا اصلاح شود، مثلاً: «... در کنار سایر سرویس‌های زیرساختی مشابه (مثل `sessionStorageService`) باشد؛ توجه: `indexedDbService` عمداً در پروژه وجود ندارد، چون نوشتن/خواندن IndexedDB مستقیماً در `core/db/db.ts` انجام می‌شود (به `services.md` مراجعه کنید).»

---

### مورد ۱۵ — نام نوع بازگشتی `usePriceSyncStore.lastFetchResult` (`FetchResult`) با نام واقعی نوع در `types.md` (`PriceFetchResult`) یکی نیست

**۱. باگ/ابهام:** جدول `usePriceSyncStore` در `stores.md` فیلد `lastFetchResult` را با نوع `FetchResult | null` تعریف کرده. اما نوع واقعی که در `types.md` (بخش `events.ts`، درون `PriceFetchCompleted`) تعریف و استفاده شده `PriceFetchResult` است، نه `FetchResult`. این یا یک typo در نام‌گذاری است یا اشاره به یک نوع کاملاً متفاوت که هیچ‌جای دیگری تعریف نشده — در هر دو حالت، پیاده‌سازی واقعی گیج‌کننده می‌شود چون معلوم نیست باید از همان `PriceFetchResult` مشترک استفاده شود یا یک نوع جدید و مجزا برای Store ساخته شود.

**۲. محل:**
- `docs/stores/stores.md` — جدول `usePriceSyncStore`، فیلد `lastFetchResult`
- منبع صحت: `docs/core/types/types.md` — بخش `events.ts`، نوع `PriceFetchResult`

**۳. راه‌حل:** نام نوع در `stores.md` به `PriceFetchResult | null` اصلاح شود تا با `types.md` یکسان باشد (یا اگر واقعاً قرار است شکل متفاوتی داشته باشد، آن نوع به‌صراحت در `types.md` تعریف و نام‌گذاری شود).

---

### مورد ۱۶ — مسیر فایل `round.ts` بین ساختار پوشه و توضیح متنی در `utils.md` و `Rounding-Policy.md` ناسازگار است (`number/round.ts` در برابر `money/round.ts`)

**۱. باگ/ابهام:** در بخش «ساختار پوشه» در `core/utils/utils.md`، فایل `round.ts` زیر پوشه‌ی **`number/`** لیست شده (`number/round.ts — گرد کردن اعشار`). اما بلافاصله بعد از همان بلوک کد، یک یادداشت صریح می‌گوید: «فایل **`money/round.ts`** تنها نقطه رسمی برای round کردن مبالغ مالی در کل پروژه است». همین مسیر اشتباه (`money/round.ts`) دوباره در `docs/core/rounding/Rounding-Policy.md` (هم در عنوان بخش «لایه پیاده‌سازی» و هم در جدول تناظر با `utils.md`) تکرار شده. یعنی سه اشاره از چهار اشاره به این فایل، مسیر `money/round.ts` را به کار برده‌اند و فقط ساختار پوشه آن را زیر `number/` گذاشته — یک ناسازگاری مسیر فایل بین خودِ سند و اسنادی که به آن ارجاع می‌دهند.

**۲. محل:**
- `docs/core/utils/utils.md` — ساختار پوشه (`number/round.ts`) در برابر یادداشت زیر آن (`money/round.ts`)
- `docs/core/rounding/Rounding-Policy.md` — بخش «لایه پیاده‌سازی: `utils/money/round.ts`» و جدول تناظر با `utils.md`

**۳. راه‌حل:** یکی از دو مسیر به‌عنوان مسیر رسمی انتخاب و در هر سه محل یکسان شود. با توجه به این‌که round کردن اساساً یک عملیات مالی حساس است (نه یک ابزار عمومی عدد)، پیشنهاد می‌شود فایل واقعاً به `money/round.ts` منتقل شود (هماهنگ با اکثریت ارجاعات) و ساختار پوشه در `utils.md` اصلاح شود تا `round.ts` زیر `money/` نمایش داده شود، نه `number/`.

### مورد ۱۷ — لیست `RelatedFeature` در توضیح فیلد `relatedFeature` در `Accounts-Banking.md` قدیمی است (۱۲ از ۱۶ مقدار واقعی)؛ مقدار `'accounts'` هم هیچ‌جا در همین فیچر استفاده نشده

**۱. باگ/ابهام:** در `Accounts-Banking.md`، توضیح فیلد `relatedFeature` روی `acc_transactions` می‌گوید مقادیر معتبر عبارت‌اند از: «income, expense, cheque, loan, crypto_exchange, stocks_iran, fif, metals, physical_assets, budget, tax, goals» (۱۲ مقدار). اما نوع مرجع `RelatedFeature` در `core/types/types.md` صراحتاً ۱۶ مقدار دارد و ۴ مقدار دیگر را هم شامل می‌شود: `'bills'`, `'documents'`, `'price'`, `'accounts'`. ازآنجا‌که `Accounts-Banking.md` خودش می‌گوید این نوع «تعریف مرکزی و تنها enum معتبر در core/types/types.md» است، کپی ناقص آن در همین فایل باعث می‌شود خواننده تصور کند فقط ۱۲ مقدار وجود دارد. به‌طور خاص، مقدار `'accounts'` که طبق کامنت خودِ `types.md` برای «انتقال/تعدیل مستقیم حساب» تعریف شده، دقیقاً باید در همین فیچر (Accounts & Banking، در تابع `transferBetweenAccounts`) استفاده شود، اما هیچ‌جای `Accounts-Banking.md` مشخص نمی‌کند دو تراکنش ساخته‌شده توسط `transferBetweenAccounts` چه `relatedFeature`ای می‌گیرند (`'accounts'` یا مقدار دیگر) — این خودش یک نقص جداگانه در مشخصات API است.

**۲. محل:**
- `docs/features/00-Accounts-Banking/Accounts-Banking.md` — توضیح فیلد `relatedFeature` روی `Transaction`، و تابع `transferBetweenAccounts`
- منبع صحت: `docs/core/types/types.md` — بخش `transaction.ts`، تعریف `RelatedFeature`

**۳. راه‌حل:**
- لیست مقادیر در کامنت `relatedFeature` در `Accounts-Banking.md` با تمام ۱۶ مقدار `types.md` هماهنگ شود (یا بهتر: صرفاً بنویسد «به `types.md → RelatedFeature` مراجعه کنید» تا از drift آینده جلوگیری شود، طبق همان الگوی پیشنهادی مورد ۱۲)
- مشخص شود تراکنش‌های حاصل از `transferBetweenAccounts` چه مقدار `relatedFeature` می‌گیرند — پیشنهاد: `'accounts'`، چون این دقیقاً همان مورد استفاده‌ای است که برای این مقدار در `types.md` تعریف شده

---

### مورد ۱۸ — رفتار `getCurrentBalance(accountId)` (کش/Snapshot در برابر بازمحاسبه از Ledger) در `Accounts-Banking.md` مشخص نشده، برخلاف تأکید صریح `db.md` روی این تمایز (BUG-025)

**۱. باگ/ابهام:** `db.md` در بخش «قرارداد Snapshot در برابر Ledger (BUG-025)» تأکید می‌کند که `currentBalance` روی `acc_accounts` یک **Snapshot مشتق‌شده** (کش برای سرعت) است، نه Ledger authoritative، و برای رفع اختلاف باید از `rebuildAccountFromLedger` استفاده شود، نه خواندن مستقیم snapshot به‌عنوان حقیقت مطلق در همه شرایط. اما `Accounts-Banking.md` تابع `getCurrentBalance(accountId)` را بدون هیچ توضیحی دراین‌باره لیست کرده — معلوم نیست این تابع مقدار کش‌شده (`acc_accounts.currentBalance`، سریع ولی بالقوه ناهماهنگ) را برمی‌گرداند یا همیشه از Ledger بازمحاسبه می‌کند (کند ولی همیشه دقیق). با توجه به این‌که خودِ `db.md` این تمایز را «حیاتی» توصیف کرده (چون قبلاً منشأ یک باگ Critical در تاریخچه پروژه بوده)، سکوت `Accounts-Banking.md` در این مورد خطرناک است.

**۲. محل:**
- `docs/features/00-Accounts-Banking/Accounts-Banking.md` — بخش «APIهای داخلی → Account → `getCurrentBalance(accountId)`»
- منبع صحت: `docs/core/db/db.md` — بخش «قرارداد Snapshot در برابر Ledger (BUG-025)»

**۳. راه‌حل:** امضای `getCurrentBalance` در `Accounts-Banking.md` صریح شود، مثلاً: «`getCurrentBalance(accountId, mode: 'cached' | 'ledger' = 'cached')` — حالت `cached` مقدار `acc_accounts.currentBalance` (Snapshot سریع) را برمی‌گرداند؛ حالت `ledger` با فراخوانی معادل `rebuildAccountFromLedger` مقدار واقعی را از مجموع `acc_transactions` بازمحاسبه می‌کند (برای صفحاتی که نیاز به دقت کامل دارند، نه فقط نمایش سریع UI)».

### مورد ۱۹ — مشخص نیست وقتی `correctIncome()` صدا زده می‌شود، خودِ رکورد `inc_transactions` (نه فقط `acc_transactions`) چطور اصلاح/Reversal می‌شود؛ ریسک ناهماهنگی `getTotalIncome()`

**۱. باگ/ابهام:** Business Rule «ویرایش/حذف درآمد» در `Income.md` رفتار Reversal را فقط در سطح `acc_transactions` توضیح می‌دهد: «تراکنش اصل ذخیره می‌ماند (`isVoided = true` در `acc_transactions`)، یک تراکنش معکوس ثبت می‌شود». اما `inc_transactions` (که جدول اختصاصیِ فیچر Income با فیلدهای `amount`, `date`, `category` است و مرجع واقعیِ `getTotalIncome()` محسوب می‌شود، نه `acc_transactions`) اصلاً در این توضیح ذکر نشده. API `correctIncome(id, data)` می‌گوید «یک تراکنش Reversal برای رکورد قبلی + یک تراکنش جدید با داده‌های اصلاح‌شده می‌سازد» اما مشخص نیست:
- آیا رکورد `inc_transactions` قدیمی نگه داشته می‌شود و یک ردیف جدید در `inc_transactions` هم ساخته می‌شود (موازی با Reversal در `acc_transactions`)؟
- یا `inc_transactions` مستقیماً UPDATE می‌شود (که با اصل Immutable Transactions کل پروژه در تناقض است)؟
- اگر رکورد قدیمی `inc_transactions` دست‌نخورده بماند بدون نشانه Void، آنگاه `getTotalIncome(startDate, endDate)` که مستقیماً از `inc_transactions` جمع می‌زند (نه از `acc_transactions`)، مبلغ درآمد اصلاح‌شده (نادرست) را هم به همراه مبلغ جدید صحیح جمع می‌زند و مجموع نهایی غلط می‌شود — این دقیقاً همان کلاس باگ Snapshot/Ledush است که در `db.md` (BUG-025) به‌عنوان خطر Critical توصیف شده، ولی اینجا در سطح یک فیچر تکرار شده بدون راه‌حل مشخص.

**۲. محل:**
- `docs/features/01-Income/Income.md` — Business Rule «ویرایش/حذف درآمد» و API `correctIncome(id, data)`
- وابسته: `docs/core/db/db.md` — بخش «قرارداد Snapshot در برابر Ledger (BUG-025)» و «Polymorphic FK»
- **تأیید شد در `docs/features/02-Expense/Expense.md`**: همان الگوی دقیق («تراکنش اصل ذخیره می‌ماند... یک تراکنش معکوس ثبت می‌شود» فقط در سطح `acc_transactions`) و همان API مبهم (`correctExpense(id, data)`) عیناً تکرار شده — یعنی همان خطر برای `exp_transactions` و `getTotalExpense()` هم صادق است
- وابسته احتمالی: سایر فیچرهای مشابه با الگوی Reversal دوسطحی (Cheque، Loan، Investment‌ها) که هنوز بررسی نشده‌اند و باید هنگام بررسی چک شوند

**۳. راه‌حل:** Business Rule صریح شود که رفتار در هر دو لایه هم‌زمان و atomic انجام می‌شود:
1. ردیف قدیمی `inc_transactions` یک فیلد `isVoided`/`status` بگیرد (هم‌راستا با الگوی `acc_transactions`)
2. یک ردیف **جدید** در `inc_transactions` برای داده اصلاح‌شده ساخته شود، با `accountTransactionId` اشاره به تراکنش جدید در `acc_transactions`
3. `getTotalIncome()` و APIهای مشابه گزارش‌گیری صراحتاً مستند شود که فقط ردیف‌های `isVoided = false` را جمع می‌زنند
این الگو باید یک‌بار به‌صورت عمومی در `db.md` (کنار BUG-025) مستند شود تا هر فیچر دوباره از صفر آن را تعریف نکند (نگاه کنید به مورد ۸ در همین سند که پیشنهاد مشابهی برای UI داده بود).

---

### مورد ۲۰ — استثنای «مگر از طریق درآمد تکرارشونده» برای قانون «درآمد نمی‌تواند در آینده ثبت شود» بلااستفاده/گمراه‌کننده به نظر می‌رسد

**۱. باگ/ابهام:** Business Rule می‌گوید: «درآمد نمی‌تواند در آینده ثبت شود مگر اینکه از طریق درآمد تکرارشونده تولید شده باشد.» اما طبق API `generateRecurringIncomes() → تولید تراکنش‌های درآمد از روی قالب‌های فعال (Job روزانه)`، این Job **روزانه** اجرا می‌شود و فقط زمانی تراکنش تولید می‌کند که `nextOccurrence` رسیده باشد — یعنی طبیعتاً هرگز یک تاریخ آینده تولید نمی‌کند (تراکنش تولیدشده تاریخش «امروز» یا کمی گذشته است، نه آینده). پس این استثنا یا برای سناریویی است که مستند نشده (مثلاً پیش‌ثبت دستی چند ماه آینده)، یا صرفاً یک جمله اضافی/گمراه‌کننده است که فرض غلطی درباره رفتار Job روزانه ایجاد می‌کند.

**۲. محل:** `docs/features/01-Income/Income.md` — Business Rules، و API `generateRecurringIncomes()`. **همان جمله دقیق (فقط با «هزینه» به‌جای «درآمد») در `docs/features/02-Expense/Expense.md` هم تکرار شده** — همان ابهام درباره `generateRecurringExpenses()` صادق است.

**۳. راه‌حل:** یا این استثنا از هر دو فایل حذف شود (چون طبق رفتار واقعی Job روزانه، تراکنش تکرارشونده هم هرگز در آینده ثبت نمی‌شود)، یا اگر منظور سناریوی دیگری است (مثلاً امکان مشاهده/پیش‌نمایش تراکنش‌های آتی بدون ثبت واقعی)، آن سناریو صریحاً و یکسان در هر دو فایل توضیح داده شود.

### مورد ۲۱ — تصمیم «قفل/رزرو موجودی برای چک‌های پرداختی صادرشده» به‌صراحت در خودِ سند به‌عنوان تصمیم‌نگرفته باقی مانده

**۱. باگ/ابهام:** در بخش «نکات طراحی» آمده: «برای چک‌های پرداختی، موجودی حساب در زمان صدور چک قفل یا رزرو نمی‌شود (**مگر تصمیم دیگری گرفته شود**)». این جمله به‌وضوح یک تصمیم محصولی حل‌نشده را در سند باقی گذاشته، نه یک مشخصات قطعی. این تصمیم اثر مستقیم روی UX دارد: اگر کاربر ۵ میلیون تومان موجودی داشته باشد و ۳ چک پرداختی هرکدام ۲ میلیون تومان صادر کرده باشد (که هنوز `pending`اند)، `getCurrentBalance` مقدار ۵ میلیون را نشان می‌دهد درحالی‌که عملاً کاربر تعهد ۶ میلیونی دارد — بدون مفهوم «موجودی در دسترس» (Available Balance) در برابر «موجودی واقعی» (Actual Balance)، کاربر ممکن است هزینه/چک جدیدی ثبت کند که باعث Overdraft واقعی هنگام وصول چک‌های قبلی شود. ازآنجا‌که Business Rule دیگری هم می‌گوید «موجودی حساب نمی‌تواند منفی شود»، این ابهام مستقیماً با آن قانون در تعارض بالقوه است: اگر رزرو نشود، هیچ‌چیز جلوی صدور چک بیش از موجودی واقعی را نمی‌گیرد.

**۲. محل:**
- `docs/features/03-Cheque-Management/Cheque-Management.md` — بخش «نکات طراحی»
- وابسته: `docs/features/00-Accounts-Banking/Accounts-Banking.md` — Business Rule «موجودی حساب نمی‌تواند منفی شود»، تابع `getCurrentBalance`
- وابسته: `docs/features/12-Dashboard/Dashboard.md` و `docs/features/13-Portfolio-Wealth-Overview/Portfolio-Wealth-Overview.md` (در صورت نمایش موجودی — باید مشخص شود کدام مفهوم موجودی نمایش داده می‌شود)

**۳. راه‌حل:** این تصمیم قطعی شود و از حالت «مگر تصمیم دیگری گرفته شود» خارج شود. برای نسخه ۱ پیشنهاد می‌شود: **بدون رزرو واقعی موجودی** (چون رزرو نیازمند منطق پیچیده‌تری است) ولی با افزودن یک تابع صرفاً محاسباتی و فقط‌خواندنی مثل `getAvailableBalance(accountId)` که `currentBalance - Σ(مبلغ چک‌های pending پرداختی روی این حساب)` را برمی‌گرداند و در UI به‌عنوان هشدار (نه قید سخت) نمایش داده شود — تا کاربر از تعهدات آتی خود آگاه باشد بدون این‌که سیستم مانع ثبت تراکنش شود.

---

### مورد ۲۲ — هیچ تابع Reconciliation مرکزی برای هماهنگی `chk_cheques.status`/`reversalTransactionId` با وضعیت واقعی `acc_transactions` تعریف نشده

**۱. باگ/ابهام:** طبق الگوی «قرارداد Reconciliation مرکزی» در `db.md`، هر Snapshot مشتق‌شده (موجودی حساب، holding سرمایه‌گذاری، مانده وام) باید یک تابع Reconciliation اختصاصی داشته باشد که بتواند ناهماهنگی بین Ledger (`acc_transactions`) و Snapshot را کشف کند (`reconcileAccount`, `reconcileBrokerage`, `reconcileCryptoHolding`, `reconcileFund`, `reconcileMetalsHolding`). اما `chk_cheques` هم دقیقاً یک همین نوع Snapshot دارد: فیلدهای `status`, `accountTransactionId`, `reversalTransactionId` باید همیشه با وجود/عدم‌وجود رکوردهای متناظر و غیرVoid در `acc_transactions` سازگار باشند (مثلاً یک چک با `status='bounced'` باید هم یک تراکنش اصلی `isVoided=true` و هم یک تراکنش reversal معتبر داشته باشد؛ یک چک با `status='cleared'` باید دقیقاً یک تراکنش غیرVoid مرتبط داشته باشد). این تابع (`reconcileCheque` یا مشابه) در جدول APIهای Reconciliation در `db.md` وجود ندارد.

**۲. محل:**
- `docs/core/db/db.md` — بخش «قرارداد Reconciliation مرکزی»، جدول APIهای Reconciliation
- `docs/features/03-Cheque-Management/Cheque-Management.md` — فیلدهای `status`, `accountTransactionId`, `reversalTransactionId`

**۳. راه‌حل:** ردیف `reconcileCheque(chequeId)` به جدول APIهای Reconciliation در `db.md` اضافه شود که سازگاری `status` ↔ وجود/تعداد/جهت تراکنش‌های مرتبط در `acc_transactions` را بررسی می‌کند؛ همچنین به `reconcileAll()` اضافه شود. (نکته: این یافته باید هنگام بررسی `04-Debt-Loan-Management` هم دوباره چک شود، چون وام هم می‌تواند همین کلاس ابهام را داشته باشد.)

### مورد ۲۳ — جدول `ln_loan_fee_tiers` در فهرست مرکزی جداول `db.md` ثبت نشده (تکرار الگوی مورد ۹)

**۱. باگ/ابهام:** در `Debt-Loan-Management.md`، برای پیاده‌سازی کارمزد پلکانی (`feeType = 'tiered'`) صراحتاً گفته شده: «برای کارمزد پلکانی: ردیف‌های جدول `ln_loan_fee_tiers` (BUG-030)» — یعنی این جدول یک جدول واقعی و لازم برای نسخه ۱ است (نه صرفاً پیشنهاد آینده)، چون فیلد قدیمی‌تر `tiers` (JSON) در `ln_loan_fees` صراحتاً «deprecated برای داده جدید؛ فقط مهاجرت» اعلام شده — یعنی `ln_loan_fee_tiers` جایگزین رسمی و فعلی است. با این حال این جدول اصلاً در فهرست مرکزی جداول `db.md` (که مدعی است «همه جداول تمام فیچرها در اینجا لیست شده‌اند») وجود ندارد — دقیقاً همان کلاس مشکلی که در مورد ۹ همین سند (برای `acc_transaction_links`, `fin_audit_log`, `ref_integrity_queue`) قبلاً ثبت شده بود.

**۲. محل:**
- `docs/core/db/db.md` — بخش «لیست مرکزی همه‌ی جدول‌ها» (جای خالی برای `ln_loan_fee_tiers`)
- منبع صحت: `docs/features/04-Debt-Loan-Management/Debt-Loan-Management.md` — بخش «Loan Fees»، فیلد `tiers` (deprecated) و ارجاع BUG-030

**۳. راه‌حل:** ردیف `ln_loan_fee_tiers | Debt & Loan | ردیف‌های پلکانی کارمزد وام (جایگزین فیلد deprecated شده `tiers`)` به جدول «لیست مرکزی همه‌ی جدول‌ها» در `db.md` اضافه شود. همچنین ساختار فیلدهای این جدول (که در `Debt-Loan-Management.md` هم فقط با یک اشاره کوتاه ذکر شده، بدون تعریف کامل ستون‌ها) باید حداقل یک‌بار به‌صورت کامل (مثلاً `loanFeeId`, `thresholdFrom`, `thresholdTo`, `rate` یا `amount`) در یکی از این دو سند مستند شود.

---

### مورد ۲۴ — `cancelLoan(id)` هیچ محدودیتی درباره وجود پرداخت‌های قبلی ندارد، برخلاف `updateLoan` که صریحاً «فقط قبل از اولین پرداخت» است

**۱. باگ/ابهام:** Business Rule صریح می‌گوید: «ویرایش اطلاعات اصلی وام فقط قبل از ثبت اولین پرداخت مجاز است» و API `updateLoan(id, data)` هم همین محدودیت را در توضیح خودش تکرار می‌کند. اما `cancelLoan(id)` هیچ محدودیت مشابهی ندارد و توضیحش فقط یک خط («لغو وام») است. این باعث ابهام جدی می‌شود: اگر وامی ۵ قسط از ۲۴ قسط را پرداخت کرده باشد (یعنی `remainingBalance` کمتر از `principalAmount` و چندین رکورد در `ln_transactions` و `acc_transactions` وجود دارد) و کاربر `cancelLoan` را صدا بزند، چه اتفاقی می‌افتد؟
- آیا پرداخت‌های قبلی reversal می‌شوند (یعنی موجودی حساب به حالت قبل از وام برمی‌گردد)؟
- یا وام فقط `status = 'cancelled'` می‌شود درحالی‌که پرداخت‌های واقعی و `remainingBalance` دست‌نخورده باقی می‌مانند (که باعث می‌شود یک وام «لغوشده» همچنان مانده بدهی داشته باشد — از نظر مفهومی متناقض)؟
این تفاوت رفتاری حیاتی است چون مستقیماً موجودی حساب‌های بانکی واقعی و تاریخچه مالی کاربر را تحت تأثیر قرار می‌دهد.

**۲. محل:**
- `docs/features/04-Debt-Loan-Management/Debt-Loan-Management.md` — بخش «Loan APIs»، تابع `cancelLoan(id)`
- وابسته: Business Rule «ویرایش اطلاعات اصلی وام فقط قبل از ثبت اولین پرداخت مجاز است»، جدول `ln_transactions`

**۳. راه‌حل:** رفتار `cancelLoan` صریح شود، مثلاً با یکی از این دو مسیر مستند:
- **گزینه ۱ (محدود)**: `cancelLoan` فقط روی وام‌هایی مجاز باشد که هنوز هیچ پرداختی (`installment_payment`) ثبت نکرده‌اند — مشابه دقیق محدودیت `updateLoan` — و اگر پرداختی وجود دارد، خطا برگرداند و کاربر را به `voidTransaction`/Reversal دستی راهنمایی کند
- **گزینه ۲ (کامل)**: `cancelLoan` به‌صورت خودکار تمام تراکنش‌های مرتبط (`disbursement` + همه پرداخت‌ها) را در `acc_transactions` reversal کند تا موجودی حساب کاملاً به حالت قبل از وام برگردد، سپس `status = 'cancelled'` شود
با توجه به الگوی «Immutable Transactions» پروژه، گزینه ۱ ساده‌تر و کم‌ریسک‌تر است و پیشنهاد می‌شود.

### مورد ۲۵ — تعریف فیلد `network` در Domain Entities (بخش‌های ۴ و ۵) با تصمیمات BUG-005 و BUG-006 در همان فایل هماهنگ نشده (تناقض درون‌فایلی)

**۱. باگ/ابهام:** در انتهای `Investment-Crypto.md`، دو بخش اصلاحی صریح وجود دارد:
- **BUG-006** («networkId روی Transaction»): می‌گوید صراحتاً «**ممنوع**: فیلد متنی آزاد `network` با مقادیر `TRC20`/`TRON`/`tron`» و باید از `networkId` (FK به `inv_crypto_wallet_networks`) استفاده شود.
- **BUG-005** («تفکیک Cash Movement و On-chain Transfer»): می‌گوید «فیلدهای `network`/`txHash` روی جدول exchange cash **deprecate** می‌شوند اگر هنوز در متن باشند».

اما تعریف واقعی Domain Entities در بالای همان فایل (که این دو بخش اصلاحی قرار است روی آن اعمال شوند) هنوز اصلاح نشده:
- بخش «۴. Crypto Transaction (`inv_crypto_transactions`)» هنوز `network → string (nullable...)` را به‌عنوان نوع فیلد لیست کرده — نه `networkId` (UUID، FK)، دقیقاً همان چیزی که BUG-006 «ممنوع» اعلام کرده.
- بخش «۵. Crypto Exchange Transaction (`inv_crypto_exchange_transactions`)» هم هنوز `network → string (nullable...)` را دارد — دقیقاً همان فیلدی که BUG-005 گفته «deprecate می‌شود اگر هنوز در متن باشد» (که هست).

این یعنی هرکسی که فقط بخش «Domain Entities» را بخواند (بدون رسیدن به بخش‌های BUG در انتهای فایل)، فیلد اشتباه (`network: string`) را پیاده‌سازی می‌کند.

**۲. محل:**
- `docs/features/05-Investment/05-01-Investment-Crypto/Investment-Crypto.md` — بخش «۴. Crypto Transaction» (فیلد `network`) و بخش «۵. Crypto Exchange Transaction» (فیلد `network`)
- در برابر: همان فایل — بخش‌های «networkId روی Transaction (BUG-006)» و «تفکیک Cash Movement و On-chain Transfer (BUG-005)»
- وابسته: `docs/core/db/db.md` — در صورتی‌که ساختار جدول آنجا هم تکرار شده باشد

**۳. راه‌حل:**
- در بخش «۴»، فیلد `network → string` به `networkId → UUID (nullable — FK به inv_crypto_wallet_networks؛ الزامی برای type=transfer_in/transfer_out بین والت‌ها)` تغییر کند و متن قدیمی حذف شود.
- در بخش «۵»، طبق تصمیم صریح BUG-005 که این فیلد را برای جدول cash-movement اساساً نامربوط می‌داند، فیلد `network` (و به همراه آن `txHash`, `blockNumber`, `confirmations` که همگی طبق جدول BUG-005 فقط باید در `inv_crypto_transactions` باشند نه در جدول cash) کاملاً از تعریف `inv_crypto_exchange_transactions` حذف شوند.
- به‌طور کلی، وقتی یک بخش BUG در انتهای فایل، فیلدی در Domain Entities را اصلاح/ممنوع می‌کند، تعریف اصلی همان لحظه به‌روزرسانی شود، نه این‌که هر دو نسخه (قدیمی در بالا، تصمیم جدید در پایین) هم‌زمان در فایل باقی بمانند.

### مورد ۲۶ — فیلد `totalFeesPaidUSDT` در `Investment-Stocks-Iran.md` بدون توضیح تعریف شده، برخلاف سه فایل خواهر دیگر (Crypto/FIF/Metals)

**۱. باگ/ابهام:** فیلد `totalFeesPaidUSDT` یک تصمیم طراحی هماهنگ و عمدی در تمام زیرفیچرهای سرمایه‌گذاری است (تأیید شده در `Currency-CrossRate.md`: «Investment (همه زیر‌فیچرها): ... محاسبه `totalFeesPaidUSDT`») تا کارمزدها در یک واحد مشترک (USDT) برای مقایسه بین دارایی‌های مختلف قابل‌جمع باشند — پس خودِ وجود این فیلد باگ نیست. اما در سه فایل `Investment-Crypto.md`، `Fixed-Income-Funds.md`، و `Metals.md`، این فیلد همیشه با یک توضیح پرانتزی کامل تعریف شده («مجموع تجمیعی تمام کارمزدهای پرداخت‌شده، پس از تبدیل هر کارمزد به USDT با `exchangeRateToBase` همان تراکنش»)، درحالی‌که در `Investment-Stocks-Iran.md` (خط ۶۹) فقط `totalFeesPaidUSDT → decimal` بدون هیچ توضیحی نوشته شده است. این عدم‌یکنواختی مستندسازی باعث می‌شود این فایل به‌تنهایی روشن نکند که آیا دقیقاً همان فرمول (تبدیل با `exchangeRateToBase` تراکنش) اینجا هم صدق می‌کند یا نه — با توجه به این‌که کارمزدهای سهام ایران در `Investment-Stocks-Iran.md` به ۴ جزء (`feeBrokerCommission`, `feeExchange`, `feeTax`, `feeOther`) تفکیک شده‌اند، ممکن است خواننده مطمئن نباشد `totalFeesPaidUSDT` مجموع کدام یک از این اجزا را منعکس می‌کند (فقط `feeBrokerCommission` یا کل `feeAmount`).

**۲. محل:**
- `docs/features/05-Investment/05-02-Investment-Stocks-Iran/Investment-Stocks-Iran.md` — تعریف فیلد `totalFeesPaidUSDT` در `inv_stocks_iran_holdings`
- منبع صحت/الگو: `docs/features/05-Investment/05-01-Investment-Crypto/Investment-Crypto.md`, `05-03-Fixed-Income-Funds/Fixed-Income-Funds.md`, `05-04-Metals/Metals.md` (هر سه با توضیح کامل)

**۳. راه‌حل:** همان توضیح پرانتزی استاندارد به `Investment-Stocks-Iran.md` اضافه شود، با تصریح این‌که مبنای تبدیل، **`feeAmount` کل** (مجموع هر ۴ جزء کارمزد طبق Invariant تعریف‌شده در همین فایل) است، نه فقط یکی از اجزا — مثلاً: «مجموع تجمیعی `feeAmount` کل (شامل هر ۴ جزء کارمزد) تمام تراکنش‌ها، پس از تبدیل به USDT با `exchangeRateToBase` همان تراکنش».

### مورد ۲۷ — مشخص نیست فیلد `actualProfit` روی `inv_fif_transactions` توسط چه فرایندی و در چه لحظه‌ای پر می‌شود

**۱. باگ/ابهام:** فیلد `actualProfit → decimal (nullable — فقط در nav_update و dividend)` به‌عنوان یک ستون ذخیره‌شده در `inv_fif_transactions` تعریف شده، در کنار `predictedProfit` که طبیعتاً توسط کاربر هنگام ثبت تراکنش وارد می‌شود. اما برخلاف `predictedProfit`، هیچ‌جای سند مشخص نمی‌کند «سود واقعی» از کجا محاسبه و در این فیلد نوشته می‌شود — نه در APIهای داخلی (`createTransaction`, `updateNAV`) نامی از پرکردن `actualProfit` نیست، و نه فرمولی برای آن در بخش «منطق محاسبه سود/زیان» آمده. تنها API مرتبط، `getProfitComparison(fundId, period) → مقایسه سود پیش‌بینی‌شده و واقعی (بر اساس تراکنش‌ها)` است که توضیحش («بر اساس تراکنش‌ها») نشان می‌دهد سود واقعی را احتمالاً در لحظه محاسبه می‌کند (Derived، نه Stored) — که در این صورت وجود ستون `actualProfit` در خودِ جدول Transaction (که قرار است فقط لاگ باشد، طبق «این جدول فقط لاگ تراکنش‌های واقعی است» در فایل‌های مشابه) اضافی و گمراه‌کننده است.

**۲. محل:**
- `docs/features/05-Investment/05-03-Fixed-Income-Funds/Fixed-Income-Funds.md` — تعریف فیلد `actualProfit` در `inv_fif_transactions`، و API `getProfitComparison`

**۳. راه‌حل:** یکی از دو مسیر صریح شود:
- **اگر Derived است**: فیلد `actualProfit` از تعریف جدول `inv_fif_transactions` حذف شود و `getProfitComparison()` توضیح دهد که چطور «سود واقعی» را از تفاضل NAVها/تراکنش‌های `dividend` در بازه محاسبه می‌کند.
- **اگر Stored است**: مشخص شود چه فرایندی (مثلاً یک Job دوره‌ای که پس از هر `nav_update` سود واقعی بازه قبلی را محاسبه و در رکورد `nav_update` مربوطه ذخیره می‌کند) این فیلد را پر می‌کند، و این فرایند به بخش APIهای داخلی اضافه شود.

### مورد ۲۸ — enum مقدار `type` در `Metals Platform Cash Transaction` بین تعریف Domain Entity و توضیح API ناسازگار است

**۱. باگ/ابهام:** در بخش «Domain Entities» — «۴. Metals Platform Cash Transaction» — فیلد `type` به‌صراحت `string (deposit, withdraw)` تعریف شده. اما در بخش «APIهای داخلی» همان مقادیر متفاوت نوشته شده‌اند: `createPlatformCashTransaction(data) → واریز (type='deposit-investment') / برداشت (type='withdrawal-investment')`. این دو مجموعه مقدار (`deposit`/`withdraw` در برابر `deposit-investment`/`withdrawal-investment`) دقیقاً مثل هم نیستند — پیاده‌سازی بر اساس تعریف جدول باید `deposit`/`withdraw` ذخیره کند، درحالی‌که API صراحتاً مقدار دیگری را نام می‌برد. این نوع تناقض enum دقیقاً همان کلاس مشکلی است که پیش‌تر برای فیلد `network` در `Investment-Crypto.md` (مورد ۲۵) ثبت شد.

**۲. محل:**
- `docs/features/05-Investment/05-04-Metals/Metals.md` — Domain Entity «۴. Metals Platform Cash Transaction» (فیلد `type`)
- همان فایل — بخش «APIهای داخلی» → `createPlatformCashTransaction(data)`

**۳. راه‌حل:** یکی از دو مقدار به‌عنوان مرجع رسمی انتخاب و در هر دو محل یکسان شود. با توجه به این‌که سایر فیچرهای سرمایه‌گذاری (مثلاً واریز/برداشت صرافی) معمولاً از الگوی ساده `deposit`/`withdraw` استفاده می‌کنند و `-investment` صرفاً برای تمایز از انواع دیگر تراکنش در `acc_transactions` لازم است نه در این جدول داخلی، پیشنهاد می‌شود مقدار جدول `deposit`/`withdraw` باقی بماند و توضیح API اصلاح شود تا از همین دو مقدار استفاده کند (مگر این‌که مقدار `-investment` برای لینک به `relatedFeature`/`relatedId` در `acc_transactions` لازم باشد، که در این صورت باید صراحتاً توضیح داده شود این پسوند فقط روی رکورد `acc_transactions` اعمال می‌شود، نه روی `inv_metals_platform_transactions.type`).

### مورد ۲۹ — فرمول «وزن خالص» در Business Rules از فیلدهای تعریف‌نشده (`karat`, `purityPermille`) استفاده می‌کند که با فیلد واقعی جدول (`purityRatio`) یکی نیست

**۱. باگ/ابهام:** در Business Rules (زیرِ «واحد، عیار و وزن خالص باید همیشه مستقل بمانند — باگ ۳۵») دو فرمول جداگانه برای وزن خالص آمده:
- طلای عیاری: `fineWeightMg = quantityMg × (karat / 24)`
- نقره/مس: `fineWeightMg = quantityMg × (purityPermille / 1000)`

اما در تعریف واقعی جدول `inv_metals_holdings` و `inv_metals_transactions` (Domain Entities) و در جدول «تمایز حیاتی» پایین‌تر در همان فایل، تنها فیلد موجود برای این محاسبه `purityRatio` (decimal بین ۰ و ۱، مثلاً ۱۸ عیار = `0.750`) است و فرمول رسمی آنجا `fineWeightMg = quantityMg × purityRatio` نوشته شده — که با هیچ‌کدام از دو فرمول بالا (`karat/24` یا `purityPermille/1000`) از نظر نام متغیر یکی نیست. نه `karat` (به‌صورت عدد صحیح ۱ تا ۲۴) و نه `purityPermille` هرگز به‌عنوان فیلد مستقل در جدول تعریف نشده‌اند — این یعنی یا این دو فرمول باقی‌مانده از یک طراحی قدیمی‌تر (قبل از یکسان‌سازی روی `purityRatio`) هستند و باید حذف/به‌روزرسانی شوند، یا پیاده‌سازی باید این تبدیل‌ها را به‌صورت جداگانه (و نه از `purityRatio` ذخیره‌شده) انجام دهد که با «وزن خالص محاسبه می‌شود و ذخیره نمی‌شود» تناقض دارد.

**۲. محل:**
- `docs/features/05-Investment/05-04-Metals/Metals.md` — Business Rules (فرمول‌های `karat/24` و `purityPermille/1000`)
- همان فایل — Domain Entity «۲. Metals Holding» و جدول «تمایز حیاتی واحد/عیار/وزن خالص» (فرمول `quantityMg × purityRatio`)
- همان فایل — بخش «منطق محاسبه سود/زیان» (بخش «وزن خالص») که هم فقط `purityRatio` را به‌کار می‌برد

**۳. راه‌حل:** هر دو فرمول در Business Rules با فرمول واحد و رسمی `fineWeightMg = quantityMg × purityRatio` جایگزین شوند (چون `purityRatio` همان مقدار عیار/خلوص به‌صورت نرمال‌شده ۰ تا ۱ است و برای طلای عیاری = `karat/24` و برای خلوص permille = `purityPermille/1000` از پیش محاسبه و در همان فیلد ذخیره می‌شود). ذکر `karat` و `purityPermille` فقط باید به‌صورت توضیحی («یعنی چگونه `purityRatio` از عیار/permille مبدأ محاسبه شده») بماند، نه به‌عنوان فرمول مستقل با نام متغیر متفاوت از فیلد واقعی جدول.

### مورد ۳۰ — برای Snapshot `inv_metals_platforms.cashBalance` هیچ تابع Reconciliation در `db.md` تعریف نشده (تکرار الگوی مورد ۲۲)

**۱. باگ/ابهام:** طبق «قرارداد Reconciliation مرکزی» در `db.md`، هر Snapshot مشتق‌شده باید یک تابع Reconciliation اختصاصی داشته باشد. برای `inv_metals_holdings` این تابع وجود دارد (`reconcileMetalsHolding(holdingId)` → `quantityMg`/`totalInvested` ↔ Σ `inv_metals_transactions`)، اما `inv_metals_platforms.cashBalance` — که خودش دقیقاً یک Snapshot مشتق‌شده دیگر است (طبق «نکته طراحی» در `Metals.md`: با واریز/برداشت/خرید/فروش/تحویل فیزیکی تغییر می‌کند و `inv_metals_platform_transactions` «فقط لاگ» است) — هیچ تابع Reconciliation مستقلی در جدول APIهای Reconciliation در `db.md` ندارد. این دقیقاً همان کلاس مشکلی است که پیش‌تر برای `chk_cheques` (مورد ۲۲) ثبت شد؛ نکته مهم‌تر اینجا این است که `cashBalance` پلتفرم فلزات از **دو منبع** تغذیه می‌شود (هم `inv_metals_platform_transactions` برای واریز/برداشت، هم `inv_metals_transactions` برای خرید/فروش/تحویل)، بنابراین ریسک ناهماهنگی حتی بیشتر از یک Snapshot تک‌منبعی مثل `reconcileBrokerage` است.

**۲. محل:**
- `docs/core/db/db.md` — بخش «قرارداد Reconciliation مرکزی»، جدول APIهای Reconciliation (جای خالی برای پلتفرم فلزات)
- `docs/features/05-Investment/05-04-Metals/Metals.md` — «نکته طراحی» زیر Domain Entity «۱. Metals Platform» (منبع صحت رفتار `cashBalance`)

**۳. راه‌حل:** ردیف `reconcileMetalsPlatformCash(platformId)` به جدول APIهای Reconciliation در `db.md` اضافه شود که `cashBalance` را در برابر مجموع اثر هر دو منبع — Σ `inv_metals_platform_transactions` (deposit/withdraw) + Σ اثر نقدی `inv_metals_transactions` (خرید کسر می‌کند، فروش اضافه می‌کند، `deliveryFee` کسر می‌کند) — بررسی کند؛ همچنین به `reconcileAll()` اضافه شود.

### مورد ۳۱ — Business Rule #5 می‌گوید `averageBuyPrice` هنگام **فروش** با Weighted Average به‌روزرسانی می‌شود؛ برخلاف الگوی رسمی پروژه در Metals/Crypto

**۱. باگ/ابهام:** در Business Rules، بند ۵ («فروش جزئی در برابر فروش کامل») می‌گوید: «`averageBuyPrice` با Weighted Average به‌روزرسانی می‌شود (در فروش کامل بدون تأثیر عملی، چون دارایی بسته می‌شود)». اما Weighted Average طبق تعریف فقط برای **خرید** معنا دارد (میانگین‌گیری بین موجودی قبلی و مقدار تازه خریداری‌شده)؛ در فروش، الگوی رسمی و تکرارشونده در تمام فیچرهای مشابه پروژه (`Metals.md`: «averageBuyPricePerMg بدون تغییر می‌ماند»، `Investment-Crypto.md`: «averageBuyPrice استفاده‌شده = میانگین خرید قبل از این فروش») این است که میانگین خرید هنگام فروش **بدون تغییر** باقی می‌ماند و فقط `quantity`/`totalInvested` کاهش می‌یابند. جمله فعلی در این فایل یا اشتباه تایپی/مفهومی است (باید «بدون تغییر می‌ماند» باشد، نه «به‌روزرسانی می‌شود») یا اگر واقعاً منظور به‌روزرسانی است، با معماری تثبیت‌شده پروژه در تناقض است و باید دلیلش توضیح داده شود.

**۲. محل:**
- `docs/features/06-Physical-Assets/Physical-Assets.md` — Business Rules، بند ۵
- در برابر (منبع صحت الگو): `docs/features/05-Investment/05-04-Metals/Metals.md` بخش «منطق محاسبه سود/زیان» و `docs/features/05-Investment/05-01-Investment-Crypto/Investment-Crypto.md` بخش مشابه

**۳. راه‌حل:** عبارت به «`averageBuyPrice` بدون تغییر باقی می‌ماند (فقط `quantity` به اندازه `quantitySold` کاهش می‌یابد؛ در فروش کامل که `quantity` به صفر می‌رسد، مقدار `averageBuyPrice` صرفاً بی‌اثر می‌شود نه این‌که واقعاً محاسبه جدیدی رخ دهد)» اصلاح شود تا با الگوی رسمی سایر فیچرهای سرمایه‌گذاری پروژه یکسان باشد.

### مورد ۳۲ — طبقه‌بندی `electronics` بین «قابل‌تفکیک» و «غیرقابل‌تفکیک» در همین فایل ناسازگار است

**۱. باگ/ابهام:** Business Rule #2 صراحتاً `electronics` را در گروه دسته‌های **غیرقابل‌تفکیک** قرار می‌دهد («برای دسته‌های `vehicle`, `real_estate`, `electronics`, `other` (غیرقابل‌تفکیک): هر خرید یک asset جدید مستقل است» — یعنی هرگز دو خرید روی یک asset ادغام نمی‌شوند، پس هرگز بیش از یک تراکنش خرید برای یک asset از این دسته‌ها وجود ندارد). اما در دو جای دیگر همین فایل، فرض می‌شود `electronics` می‌تواند **چند خرید روی یک asset** داشته باشد و نیازمند Weighted Average است:
- توضیح فیلد `averageBuyPrice`: «فقط برای `gold`, `coin`, `electronics`» (در کنار دسته‌های قابل‌تفکیک، نه در کنار vehicle/real_estate)
- یادداشت زیر جدول Domain Entity: «برای `electronics`: `averageBuyPrice` میانگین قیمت خرید به ازای هر قطعه است (**اگر چند قطعه خریده شود**)»
این دو جمله فرض می‌کنند یک asset از نوع `electronics` می‌تواند چند بار خریداری/افزوده شود (مثلاً چند لپ‌تاپ زیر یک asset)، درحالی‌که Business Rule #2 دقیقاً همین رفتار را برای `electronics` رد کرده و آن را هم‌ردیف `vehicle`/`real_estate` (asset جدید مستقل برای هر خرید) قرار داده است.

**۲. محل:**
- `docs/features/06-Physical-Assets/Physical-Assets.md` — Business Rules بند ۲ (در برابر) Domain Entity «۱. Physical Asset»، فیلد `averageBuyPrice` و یادداشت زیر جدول

**۳. راه‌حل:** یکی از دو رفتار به‌عنوان مرجع انتخاب شود:
- اگر `electronics` واقعاً غیرقابل‌تفکیک است (مطابق Business Rule #2): توضیح فیلد `averageBuyPrice` و یادداشت «اگر چند قطعه خریده شود» حذف/اصلاح شوند تا `electronics` را از لیست دسته‌های Weighted-Average خارج کنند.
- اگر منظور این است که چند *قطعه مشابه* در یک خرید واحد (نه چند خرید جداگانه) خریداری می‌شوند (مثلاً ۳ عدد موبایل مشابه در یک فاکتور): این باید صریحاً به‌عنوان استثنا در Business Rule #2 نوشته شود، نه این‌که در یک بخش نادیده گرفته شود.

### مورد ۳۳ — وضعیت `written_off` هیچ رکورد تراکنش (`pa_transactions`) تولید نمی‌کند؛ زیان تحقق‌یافته بدون ثبت Immutable

**۱. باگ/ابهام:** Business Rule #7 می‌گوید وقتی دارایی به `written_off` تغییر وضعیت می‌دهد، «زیان تحقق‌یافته به اندازه `currentValue` ثبت می‌شود» و `currentValue` صفر می‌شود. اما enum فیلد `type` در جدول `pa_transactions` فقط شامل `purchase`, `sale`, `expense` است — هیچ مقدار `write_off` یا مشابه آن وجود ندارد. API مربوطه هم `changeAssetStatus(id, status)` است که در توضیحش فقط می‌گوید «شامل تغییر به `written_off` با ثبت زیان» بدون مشخص‌کردن این‌که این «ثبت زیان» در کدام جدول و با چه ساختاری رخ می‌دهد. با توجه به الگوی Immutable Transactions پروژه (هر رویداد مالی باید یک رکورد تراکنش داشته باشد که در `calculateProfitLoss()` قابل جمع‌زدن باشد — دقیقاً مثل `type=sell` در Metals/Crypto)، نبود یک نوع تراکنش مشخص برای `write_off` یعنی این زیان یا اصلاً جایی لاگ نمی‌شود (فقط یک فیلد `status` تغییر می‌کند)، یا `calculateProfitLoss()` باید علاوه بر جمع‌زدن تراکنش‌های `type=sale`، جداگانه دارایی‌های `written_off` را هم اسکن کند — که این منطق دوگانه (هم بر مبنای Transaction Log و هم بر مبنای Asset Status) جایی مستند نشده.

**۲. محل:**
- `docs/features/06-Physical-Assets/Physical-Assets.md` — Business Rule #7، Domain Entity «۳. Physical Asset Transaction» (فیلد `type`)، API `changeAssetStatus`، API `calculateProfitLoss`

**۳. راه‌حل:** مقدار `write_off` به enum فیلد `type` در `pa_transactions` اضافه شود (با `amount = -currentValue` یا فیلد مشخص برای زیان) و `changeAssetStatus(id, 'written_off')` صراحتاً موظف شود همزمان یک رکورد `pa_transactions` از نوع `write_off` بسازد؛ سپس `calculateProfitLoss()` توضیح دهد که هم `type=sale` و هم `type=write_off` را در جمع سود/زیان تحقق‌یافته لحاظ می‌کند.

### مورد ۳۴ — بخش Rollover مقدار می‌دهد به `remainingAmount` که طبق «نکته طراحی» همین فایل یک فیلد محاسبه‌ای و ذخیره‌نشدنی است

**۱. باگ/ابهام:** «نکته طراحی» زیر Domain Entity «۲. Budget Envelope» صراحتاً می‌گوید: «`remainingAmount` یک فیلد **محاسبه‌ای** است و در دیتابیس ذخیره نمی‌شود ... ذخیره این فیلد باعث out-of-sync با داده‌های واقعی می‌شود» و فرمولش `assignedAmount + rolloverAmount - spentAmount` است. اما در بخش «Rollover»، مراحل بستن بودجه این‌طور توصیف شده‌اند:
```
- rolloverAmount هر پاکت به مقدار remainingAmount آن به‌روزرسانی می‌شود.
- remainingAmount هر پاکت صفر می‌شود.
```
جمله دوم («remainingAmount هر پاکت صفر می‌شود») یعنی مقداردهی مستقیم به یک فیلد که طبق تعریف رسمی همان فایل اصلاً در دیتابیس وجود ندارد و همیشه از سه فیلد دیگر محاسبه می‌شود — این از نظر فنی ناممکن است، مگر این‌که واقعاً منظور نویسنده تغییر `assignedAmount`/`spentAmount` به‌گونه‌ای باشد که نتیجه محاسبه صفر شود (که هیچ‌جا توضیح داده نشده کدام فیلد و چگونه).

**۲. محل:**
- `docs/features/07-Budget-Management/Budget-Management.md` — بخش «Rollover» در برابر «نکته طراحی» زیر Domain Entity «۲. Budget Envelope»

**۳. راه‌حل:** جمله «`remainingAmount` هر پاکت صفر می‌شود» حذف شود (چون نتیجه‌ی خودکار محاسبه است، نه یک عملیات مجزا) و به‌جای آن صریحاً توضیح داده شود که در دوره جدید یک envelope تازه با `assignedAmount = 0`، `spentAmount = 0` و `rolloverAmount = <مقدار remainingAmount محاسبه‌شده در دوره قبل>` ساخته می‌شود — که خودبه‌خود `remainingAmount` دوره جدید را برابر `rolloverAmount` می‌کند (نه صفر).

### مورد ۳۵ — هیچ API یا مکانیزمی برای انتقال `rolloverAmount` به بودجه/پاکت‌های **دوره بعدی** تعریف نشده (envelope به یک `budgetId` واحد محدود است)

**۱. باگ/ابهام:** `bg_envelopes.budgetId` یک FK ثابت به یک رکورد مشخص در `bg_budgets` است (هر envelope متعلق به دقیقاً یک دوره بودجه). طبق بخش Rollover، هنگام `closeBudget()` مقدار `rolloverAmount` روی envelope‌های همان بودجه (بودجه‌ای که دارد بسته می‌شود) محاسبه می‌شود. اما بودجه دوره بعد (ماه/سال جدید) یک رکورد کاملاً جدید در `bg_budgets` با `id` جدید است (طبق `createBudget(data)`) که باید envelope‌های خودش را داشته باشد. هیچ‌جای این فایل توضیح نمی‌دهد:
- چه چیزی envelope‌های دوره جدید را می‌سازد (کپی نام/دسته‌بندی از دوره قبل؟ یا کاربر باید دستی دوباره بسازد؟)
- چگونه مقدار `rolloverAmount` محاسبه‌شده روی envelope دوره **قبل** (که بسته شده) به envelope **جدید** (با `budgetId` جدید و `id` جدید) منتقل می‌شود
- API `createBudget(data)` هیچ پارامتری برای «کپی از بودجه قبلی + اعمال rollover» ندارد؛ `closeBudget(id)` هم فقط توضیح می‌دهد «بستن بودجه و اعمال Rollover» بدون اشاره به ساخت دوره بعد.
این یک شکاف واقعی در APIهاست، نه فقط ابهام مستندسازی: بدون یک تابع مشخص (مثلاً `createNextPeriodBudget` یا پارامتر `copyFromBudgetId` در `createBudget`)، پیاده‌سازی Rollover عملاً ممکن نیست.

**۲. محل:**
- `docs/features/07-Budget-Management/Budget-Management.md` — بخش «Rollover»، API `createBudget(data)`، API `closeBudget(id)`

**۳. راه‌حل:** یکی از دو مسیر مستند شود:
- `closeBudget(id)` علاوه بر محاسبه Rollover، خودش بودجه دوره بعد را می‌سازد (envelope‌ها را از دوره قبل کپی می‌کند با `assignedAmount=0`, `spentAmount=0`, `rolloverAmount = remainingAmount محاسبه‌شده`) و `id` بودجه جدید را برمی‌گرداند.
- یا `createBudget(data)` پارامتر اختیاری `copyFromBudgetId` می‌گیرد که envelope‌ها و مقادیر `rolloverAmount` را از بودجه مشخص‌شده منتقل می‌کند؛ در این صورت `closeBudget` فقط `status='closed'` می‌کند و ساخت دوره بعد جدا و صریح فراخوانی می‌شود.

### مورد ۳۶ — رفتار `strictMode` هنگام کمبود موجودی پاکت بین «محدود شدن» و «رد شدن» مبهم رها شده

**۱. باگ/ابهام:** Business Rule #4 می‌گوید: «اگر `strictMode = true`، ثبت هزینه محدود می‌شود (**یا** رد می‌شود)». این جمله دو رفتار فنی کاملاً متفاوت را با «یا» کنار هم گذاشته بدون انتخاب قطعی:
- «محدود می‌شود» می‌تواند یعنی سقف در UI اعمال شود ولی ثبت نهایتاً انجام می‌شود (Soft Limit / هشدار سخت‌گیرانه‌تر)
- «رد می‌شود» یعنی `createAssetTransaction`/معادل آن اصلاً خطا برمی‌گرداند و تراکنش هرگز ثبت نمی‌شود (Hard Block)
این تفاوت مستقیماً روی UX و روی این‌که آیا هزینه واقعی کاربر (که مثلاً از حساب بانکی کسر شده) اصلاً قابل ثبت هست یا نه اثر می‌گذارد؛ اگر رد شود، تراکنش در `acc_transactions`/`exp_transactions` هم نباید ثبت شود که یعنی `strictMode` می‌تواند جلوی ثبت واقعی یک تراکنش مالی را بگیرد — این تصمیم باید قطعی باشد، نه یک «یا» باز.

**۲. محل:**
- `docs/features/07-Budget-Management/Budget-Management.md` — Business Rule #4، بخش «نکات طراحی» (تکرار همین ابهام: «اگر `remainingAmount <= 0`، ثبت هزینه محدود می‌شود»)

**۳. راه‌حل:** یکی از دو رفتار به‌عنوان مرجع قطعی انتخاب شود. با توجه به این‌که بودجه صرفاً یک لایه مدیریتی روی هزینه‌های واقعی است (نه یک قید حسابداری مثل «موجودی حساب نمی‌تواند منفی شود»)، پیشنهاد می‌شود: حتی در `strictMode=true`، ثبت هزینه واقعی (`exp_transactions`/`acc_transactions`) هرگز رد نشود؛ فقط `applyTransactionToBudget` یک خطای اعتبارسنجی/هشدار قوی برمی‌گرداند که UI باید تأیید صریح کاربر را قبل از ادامه بگیرد — تا بودجه هرگز مانع ثبت واقعیت مالی نشود.

### مورد ۳۷ — `withdrawFromGoal(goalId, amount, accountId?)` بین برداشت‌های با پول واقعی (`manual`/`transfer`) و برچسب‌گذاری‌های بدون پول واقعی (`budget`/`income`) تمایز قائل نمی‌شود؛ ریسک تولید پول از هیچ

**۱. باگ/ابهام:** طبق قاعده ۱۰ و ۱۰a، وقتی یک کمک (`fg_contributions`) با `source='budget'` یا `source='income'` ثبت می‌شود، **هیچ پول واقعی جابه‌جا نمی‌شود** — فقط یک برچسب داخلی است و `accountTransactionId = null` می‌ماند (پول از قبل در حساب بانکی کاربر هست و فقط از نظر مفهومی به هدف اختصاص یافته). اما API برداشت، `withdrawFromGoal(goalId, amount, accountId?)`، هیچ پارامتر `source` یا هیچ منطقی برای تشخیص این‌که مبلغ در حال برداشت از کدام نوع کمک(ها) تأمین می‌شود ندارد. اگر کاربر مثلاً ۱۰ میلیون ریال با `source='budget'` (بدون تراکنش بانکی واقعی) به یک هدف اختصاص داده باشد و سپس `withdrawFromGoal(goalId, 10_000_000, accountId=X)` را صدا بزند، طبق توضیح API («برداشت از هدف + آپدیت `currentAmount`») این تابع باید یک تراکنش واریز واقعی در `acc_transactions` برای حساب `X` ایجاد کند — یعنی ۱۰ میلیون ریال واقعی به حساب بانکی کاربر اضافه می‌شود درحالی‌که هرگز پول واقعی از جایی کسر نشده بود (چون کمک اولیه فقط برچسب بود). این دقیقاً همان کلاس خطای «دوبار شمارش / تولید پول از هیچ» است که قاعده ۱۰a صریحاً برای سمت *واریز* هشدار داده («ایجاد یک تراکنش بانکی واقعی جداگانه برای این حالت ممنوع است»)، اما برای سمت *برداشت* هیچ قاعده مشابهی نوشته نشده.

**۲. محل:**
- `docs/features/08-Financial-Goals/Financial-Goals.md` — Business Rule ۵، API `withdrawFromGoal(goalId, amount, accountId?)`
- وابسته: قاعده ۱۰ و ۱۰a (منبع صحت رفتار «برچسب‌گذاری بدون پول واقعی»)، Domain Entity «۲. Goal Contribution» (فیلد `source`)

**۳. راه‌حل:** `withdrawFromGoal` باید منطق FIFO یا مشابه روی `fg_contributions` همان هدف اعمال کند تا مشخص شود مبلغ در حال برداشت از کدام کمک‌ها تأمین می‌شود:
- اگر مبلغ برداشتی از کمک‌های `source ∈ {manual, transfer}` تأمین شود: مجاز به ایجاد تراکنش واقعی در `acc_transactions` برای `accountId` است.
- اگر از کمک‌های `source ∈ {budget, income}` تأمین شود: برداشت فقط باید `currentAmount` را کاهش دهد و رکورد `fg_contributions` با `type='withdraw'`, `source` متناظر و `accountTransactionId = null` بسازد — **بدون** ایجاد تراکنش بانکی واقعی، چون پولی که باید برگردد از ابتدا در همان حساب بانکی باقی مانده بود.
همچنین اگر `accountId` در فراخوانی `withdrawFromGoal` پاس داده شود ولی مبلغ (یا بخشی از آن) از کمک‌های بدون پول واقعی تأمین می‌شود، API باید خطای اعتبارسنجی برگرداند یا صراحتاً مستند شود که فقط بخش «واقعی» مبلغ به حساب واریز می‌شود.

### مورد ۳۸ — «نکات طراحی» ادعا می‌کند نرخ تتر در `br_occurrences`/زمان پرداخت ذخیره می‌شود، اما هیچ فیلد `exchangeRateToBase` در Domain Entities این فیچر تعریف نشده

**۱. باگ/ابهام:** در بخش «نکات طراحی» آمده: «نرخ تتر در زمان ایجاد Occurrence یا پرداخت ذخیره می‌شود تا گزارش‌های تاریخی دقیق باشند.» این جمله دقیقاً همان الگوی تثبیت‌شده در تمام فیچرهای دیگر پروژه است (`exchangeRateToBase` روی هر رویداد مالی). اما در تعریف واقعی جداول این فیچر — نه `br_items` و نه `br_occurrences` — هیچ فیلدی به نام `exchangeRateToBase` (یا مشابه) وجود ندارد. بدون این فیلد، جمله «نکات طراحی» عملاً قابل‌اجرا نیست: هیچ‌جایی برای ذخیره نرخ تتر لحظه‌ای Occurrence یا پرداخت پیش‌بینی نشده، و گزارش‌های تاریخی نسبت به دلار/تتر که سایر فیچرها (Metals, Physical Assets, Investment و ...) به‌طور مستمر پشتیبانی می‌کنند، برای قبوض/تکرارشونده‌ها اصلاً ممکن نخواهد بود.

**۲. محل:**
- `docs/features/09-Bills-Recurring-Transactions/Bills-Recurring-Transactions.md` — بخش «نکات طراحی» در برابر Domain Entity «۱. Bill/Recurring Item» و «۲. Bill/Recurring Occurrence»

**۳. راه‌حل:** فیلد `exchangeRateToBase → decimal (نرخ تتر لحظه — ریال به ازای ۱ تتر)` به جدول `br_occurrences` اضافه شود (در لحظه `markAsPaid()` پر می‌شود، مشابه سایر فیچرها) و در API `markAsPaid(brOccurrenceId, amount, date, accountId?)` نیز پارامتر یا رفتار پرکردن این فیلد صراحتاً ذکر شود.

### مورد ۳۹ — رفتار سیستم هنگام رسیدن `nextDueDate` به بعد از `endDate` مشخص نشده

**۱. باگ/ابهام:** فیلد `endDate` روی `br_items` به‌عنوان «در صورت محدود بودن» تعریف شده (یعنی تاریخ پایان تکرار). اما هیچ Business Rule یا توضیح API‌ای مشخص نمی‌کند وقتی `generateUpcomingOccurrences()` (Job دوره‌ای) محاسبه می‌کند که `nextDueDate` بعد از `endDate` قرار می‌گیرد چه اتفاقی باید بیفتد:
- آیا Occurrence جدید اصلاً تولید نمی‌شود؟
- آیا `isActive` به‌صورت خودکار `false` می‌شود؟
- آیا صرفاً یادآوری متوقف می‌شود ولی رکورد فعال باقی می‌ماند؟
بدون این مشخصات، پیاده‌سازی ممکن است بی‌نهایت Occurrence بعد از تاریخ پایان مورد نظر کاربر تولید کند (باگ واقعی، نه فقط ابهام مستندسازی) چون هیچ شرط توقفی در «منطق محاسبه تاریخ سررسید بعدی» یا در `generateUpcomingOccurrences()` ذکر نشده است.

**۲. محل:**
- `docs/features/09-Bills-Recurring-Transactions/Bills-Recurring-Transactions.md` — Domain Entity «۱. Bill/Recurring Item» (فیلد `endDate`)، بخش «منطق محاسبه تاریخ سررسید بعدی»، API `generateUpcomingOccurrences()`

**۳. راه‌حل:** یک قاعده صریح اضافه شود: «اگر `nextDueDate` محاسبه‌شده بعد از `endDate` باشد، Occurrence جدید تولید نمی‌شود و `isActive` این مورد به‌صورت خودکار `false` می‌شود» — و این رفتار هم در Business Rules و هم در توضیح `generateUpcomingOccurrences()` ذکر شود.

### مورد ۴۰ — قاعده «بدون اعلان تکراری برای رویداد یکسان» بدون هیچ مکانیزم Uniqueness یا فیلد کمکی برای تشخیص تکرار مستند نشده

**۱. باگ/ابهام:** Business Rule ۷ و بخش «نکات طراحی» هر دو تأکید می‌کنند: «سیستم نباید اعلان تکراری برای یک رویداد یکسان ایجاد کند». اما `generateDueReminders()` طبق «نکات طراحی» یک **Job دوره‌ای** است که «هر چند ساعت یک‌بار» اجرا می‌شود. هیچ‌جای سند (نه در Domain Entity `notif_notifications`، نه در توضیح API `createNotification`/`generateDueReminders`) مشخص نمی‌کند این Job چگونه تشخیص می‌دهد که برای یک رویداد مشخص (مثلاً همان `relatedFeature`+`relatedId` با همان سررسید) قبلاً اعلان ساخته شده یا نه — نه Unique Constraint‌ای مثل `UNIQUE(relatedFeature, relatedId, category, scheduledAt)` تعریف شده، نه فیلدی مثل `dedupeKey` وجود دارد. بدون این مکانیزم، هر بار اجرای Job (مثلاً هر ۳-۶ ساعت) می‌تواند برای همان قبض/قسط/چک معوق دوباره اعلان جدید بسازد — دقیقاً همان چیزی که قاعده ۷ ممنوع کرده.

**۲. محل:**
- `docs/features/10-Notification-Reminder-System/Notification-Reminder-System.md` — Business Rule ۷، «نکات طراحی»، Domain Entity «۱. Notification»، API `generateDueReminders()`

**۳. راه‌حل:** یک قید یکتایی منطقی تعریف شود، مثلاً: قبل از ایجاد اعلان جدید در `generateDueReminders()`، بررسی شود که آیا اعلان دیگری با همان `(relatedFeature, relatedId, category)` که هنوز مربوط به همان دوره سررسید است (`scheduledAt` در همان بازه، یا هنوز `isRead=false` و برای همان رویداد) از قبل وجود دارد؛ اگر بله، اعلان جدید ساخته نشود (یا فقط `scheduledAt`/محتوای موجود به‌روزرسانی شود). این منطق باید صریحاً در توضیح `generateDueReminders()` نوشته شود.

### مورد ۴۱ — دو منبع مستقل و ناهماهنگ برای «چند روز قبل یادآوری» قبوض وجود دارد: `br_items.reminderDaysBefore` و `notif_settings.daysBefore`

**۱. باگ/ابهام:** در `Bills-Recurring-Transactions.md`، هر `br_items` فیلد مستقل `reminderDaysBefore` دارد (تنظیم به ازای هر قبض/مورد تکرارشونده). اما در `Notification-Reminder-System.md`، جدول `notif_settings` هم یک `daysBefore` **سراسری به‌ازای هر دسته** (`category`, از جمله `category='bill'`) تعریف کرده است. این یعنی برای یک قبض مشخص دو مقدار ممکن است هم‌زمان وجود داشته باشد (مثلاً `br_items.reminderDaysBefore = 3` ولی `notif_settings` برای `category='bill'` می‌گوید ۷ روز) بدون این‌که هیچ‌جا مشخص شود کدام‌یک اولویت دارد، یا آیا `notif_settings.daysBefore` فقط برای مواردی است که `reminderDaysBefore` در سطح آیتم تنظیم نشده (fallback)، یا این‌که این دو اصلاً برای دو منظور متفاوت‌اند و باید هر دو به‌طور هم‌زمان اعمال شوند (که غیرمنطقی است).

**۲. محل:**
- `docs/features/09-Bills-Recurring-Transactions/Bills-Recurring-Transactions.md` — Domain Entity «۱. Bill/Recurring Item»، فیلد `reminderDaysBefore`
- `docs/features/10-Notification-Reminder-System/Notification-Reminder-System.md` — Domain Entity «۲. Notification Setting»، فیلد `daysBefore`

**۳. راه‌حل:** رابطه این دو فیلد صریح شود؛ پیشنهاد: `notif_settings.daysBefore` به‌عنوان **مقدار پیش‌فرض سراسری** هر دسته عمل کند و `br_items.reminderDaysBefore` (در صورت پرشدن، غیر null) آن را override کند — یعنی `generateDueReminders()` ابتدا بررسی می‌کند آیا رکورد سطح‌آیتم مقدار خاصی تنظیم کرده، در غیر این صورت از `notif_settings` دسته مربوطه استفاده می‌کند. این منطق باید در بخش «نکات طراحی» یا توضیح `generateDueReminders()` صریحاً نوشته شود.
