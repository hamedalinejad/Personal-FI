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

- [ ] Project-Blueprint.md
- [ ] Technical-Architecture.md
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

**۲. محل:** تمام پوشه‌های `docs/features/*/`, `docs/core/*/` و غیره — وابسته به بند ۱۴ در `Project-Blueprint.md`

**۳. راه‌حل:** یا این بند از Blueprint حذف/نرم‌تر شود (چون در عمل هر فیچر همین‌الان یک فایل توصیفی هم‌نام دارد که همان نقش README را بازی می‌کند — کافی است این الگو رسماً به‌جای README.md به‌عنوان قاعده مستند شود)، یا واقعاً یک README.md مختصر (چند خط، فقط برای ناوبری) به هر پوشه اضافه شود. با توجه به هدف «سادگی» که خودتان تأکید کردید، پیشنهاد اول (نرم‌کردن قاعده در خود Blueprint) منطقی‌تر است تا فایل‌های تکراری اضافه نشوند.

