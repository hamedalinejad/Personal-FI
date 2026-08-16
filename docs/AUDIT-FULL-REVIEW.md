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
- [ ] Product-Map-FA.md / Product-Map-EN.md
- [ ] Pages-IA.md
- [ ] core/db/db.md
- [ ] core/types/types.md
- [ ] core/services/services.md
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


