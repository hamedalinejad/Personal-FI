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
- [ ] core/hooks/hooks.md
- [ ] core/utils/utils.md
- [ ] core/rounding/Rounding-Policy.md
- [ ] lib/lib.md
- [ ] stores/stores.md
- [ ] styles/styles.md
- [ ] 00-Accounts-Banking
- [ ] 01-Income
- [ ] 02-Expense
- [ ] 03-Cheque-Management
- [ ] 04-Debt-Loan-Management
- [ ] 05-01-Investment-Crypto
- [ ] 05-02-Investment-Stocks-Iran
- [ ] 05-03-Fixed-Income-Funds
- [ ] 05-04-Metals
- [ ] 06-Physical-Assets
- [ ] 07-Budget-Management
- [ ] 08-Financial-Goals
- [ ] 09-Bills-Recurring-Transactions
- [ ] 10-Notification-Reminder-System
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
