> **اصل UX:** 20 Feature ≠ 20 آیتم ناوبار — جزئیات `Pages-IA.md`.

> **SoT Scope محصول:** این نقشه لیست Featureهای **محصول کامل** است.
> **SoT ترتیب پیاده‌سازی:** بخش «فازبندی پیاده‌سازی» زیر — تا از over-engineering v1 جلوگیری شود.


نسخه فارسی - نقشه محصول
نقشه محصول
سیستم حسابداری شخصی و مدیریت سرمایه‌گذاری
نوع سند: Product Architecture
نسخه: 1.9.0
تاریخ: ۱۴۰۵/۰۴/۲۳
وضعیت: نهایی
مقدمه
این سند نقشه کامل محصول را توصیف می‌کند. هر فیچر به صورت کاملاً مستقل طراحی شده است.

---

## فازبندی پیاده‌سازی (ضد over-engineering)

قرارداد معماری (Journal، Operation، decimal، offline) از ابتدا برای کل محصول نوشته می‌شود؛ **کد و UI** فازبندی می‌شود.

### Foundation (قفل قبل از Featureهای دامنه)

Accounting Core · fin_accounts · Journal · Money/Decimal · Currency · Financial Operation · Reversal · Audit · Reconciliation · Opening Balance · Instrument Registry · Data Dictionary · Migration/Preservation · Iran Core · Party · Document Link

**Document Future ≠ Implement Future** — قرارداد می‌تواند از الان باشد؛ کد Feature بعد از Foundation.

### MVP — v1.0 (اولین release قابل استفاده مالی)
| حوزه | محتوا |
|------|--------|
| Accounts | حساب، موجودی، انتقال (accounting-neutral) |
| Income / Expense | ثبت + recurring ساده |
| Loans | Methodهای v1: `declining_balance`, `flat_rate`, `bullet`, `qarz_al_hasaneh` — فرمول در **Schedule Engine** + Day Count؛ نه دفن در loanType |
| Crypto | buy/sell/transfer داخلی پایه + cost weighted average |
| Dashboard + Reports | خلاصه موجودی، درآمد/هزینه، وام |
| Settings | backup/restore، ارز پایه، امنیت پایه |
| Core | fin_operations، journal، persist، single-writer |

**خارج از v1.0 کد:** Stocks، FIF، Metals، Cheque، Bills، Budget، Goals، Tax کامل، Price Auto-Sync، FIFO، bullet/variable پیشرفته، balloon/step_up.

### v1.1
Stocks Iran (+ شروع Import CSV ساده در صورت ظرفیت)

Stocks Iran (با settlement/CA پایه)، FIF، Metals، Cheque، Bills & Recurring

### v1.2
Tax، Budget، Goals، Notifications غنی، Price Fetching Auto-Sync، Physical Assets

### v2.0
Loan bullet/variable پیشرفته، balloon/step_up، FIFO cost basis، Cloud/multi-user/license server

مستندات Feature خارج از فاز فعلی **قرارداد آینده**اند نه الزام پیاده‌سازی همزمان.

---
فیچرهای اصلی
۱. حساب‌های بانکی (Accounts & Banking)
مدیریت حساب‌های بانکی، موجودی حساب‌ها و انتقال وجه بین حساب‌های بانکی.
۲. ارز و چندارزی (Currency & Multi-Currency)
مدیریت انواع ارز، نرخ تبدیل لحظه‌ای، کش آفلاین و تبدیل دارایی‌ها.
۳. درآمد (Income)
ثبت، ویرایش و مدیریت همه انواع درآمد، درآمدهای تکرارشونده.
۴. هزینه (Expense)
ثبت، ویرایش و مدیریت همه انواع هزینه، هزینه‌های تکرارشونده و اقساطی.
۵. مدیریت چک (Cheque Management)
ثبت چک‌های پرداختی و دریافتی، پیگیری سررسید، وصول و برگشت چک.
۶. مدیریت بدهی، طلب و وام (Debt & Loan Management)
مدیریت بدهی‌ها، مطالبات، وام‌ها، اقساط، سود و جریمه دیرکرد.
۷. مدیریت سرمایه‌گذاری (Investment Management)
شامل رمزارز، سهام ایران، صندوق‌های درآمد ثابت، فلزات (طلا/نقره و …)، پیگیری پرتفوی و کارمزد.
۸. دارایی‌های فیزیکی (Physical Assets)
مدیریت خودرو، املاک و سایر دارایی‌های فیزیکی غیرمالی‌بازار (فلزات سرمایه‌گذاری در بخش Investment — Metals).
۹. مدیریت بودجه (Budget Management)
تعریف بودجه ماهانه و سالانه به سبک Envelope با کنترل و هشدار.
۱۰. اهداف مالی (Financial Goals)
تعریف اهداف مالی، پیگیری پیشرفت و گزارش تحقق.
۱۱. قبوض و تراکنش‌های تکرارشونده (Bills & Recurring Transactions)
مدیریت قبوض، پرداخت‌ها و درآمدهای دوره‌ای با یادآوری.
۱۲. سیستم اعلان و یادآوری (Notification & Reminder System)
اعلان‌های سررسید، بودجه، اهداف و تراکنش‌ها.
۱۳. گزارش‌ها و تحلیل‌ها (Reports & Analytics)
گزارش‌های جامع و تحلیلی از تمام بخش‌های سیستم.
۱۴. داشبورد (Dashboard)
صفحه اصلی با خلاصه وضعیت مالی و نمودارهای کلیدی (شامل روند ارزش خالص دارایی).
۱۵. بررسی پرتفولیو و ثروت (Portfolio & Wealth Overview)
نمای کلی پرتفولیو و ارزش خالص دارایی‌ها با تحلیل روند.
۱۶. مدیریت مالیات (Tax Management)
محاسبه و گزارش‌دهی مالیات‌ها و عوارض.
۱۷. مدیریت اسناد (Document Management)
آپلود و مدیریت فاکتورها، قراردادها، تصاویر چک و اسناد مالی.
۱۸. تنظیمات و ابزارها (Settings & Tools)
تنظیمات عمومی، تم، زبان، پشتیبان‌گیری و ابزارهای کمکی.
۱۹. امنیت و حریم خصوصی (Security & Privacy)
رمزنگاری داده‌ها، احراز هویت، PIN، بیومتریک و لاگ تغییرات.
۲۰. دریافت قیمت‌ها (Price Fetching)
دریافت قیمت لحظه‌ای دارایی‌های سرمایه‌گذاری کاربر (رمزارز، سهام ایران، NAV صندوق‌های درآمد ثابت، فلزات) — هم با ثبت دستی و هم با Auto-Sync اختیاری از منابع بیرونی، با کش کامل آفلاین در price_history. صفحه مستقل ندارد و از داخل صفحه سرمایه‌گذاری/تنظیمات استفاده می‌شود.

---

## دسته‌بندی‌های مشترک (Common Categories)

جدول‌های دسته‌بندی مشترک بین همه فیچرها (**canonical:** `cat_categories` — نه common_categories) — بدون صفحه مستقل. این جداول زیرساخت مشترک درآمد، هزینه، بودجه و اهداف هستند و از داخل تنظیمات مدیریت می‌شوند. مستندات: `docs/features/99-Common-Categories/Categories.md`.

---

## نگاشت شماره فیچر به پوشه مستندات

شماره‌گذاری این سند بر اساس ترتیب منطقی/محصولی است و با شماره پوشه‌های `docs/features/` یکسان نیست.

| شماره Product-Map | نام فیچر | پوشه `docs/features/` |
|---|---|---|
| ۱ | حساب‌های بانکی | `00-Accounts-Banking/` |
| ۲ | ارز و چندارزی | `17-Currency-CrossRate/` |
| ۳ | درآمد | `01-Income/` |
| ۴ | هزینه | `02-Expense/` |
| ۵ | مدیریت چک | `03-Cheque-Management/` |
| ۶ | مدیریت بدهی، طلب و وام | `04-Debt-Loan-Management/` |
| ۷ | مدیریت سرمایه‌گذاری | `05-Investment/` (شامل ۴ زیرفیچر) |
| ۸ | دارایی‌های فیزیکی | `06-Physical-Assets/` |
| ۹ | مدیریت بودجه | `07-Budget-Management/` |
| ۱۰ | اهداف مالی | `08-Financial-Goals/` |
| ۱۱ | قبوض و تراکنش‌های تکرارشونده | `09-Bills-Recurring-Transactions/` |
| ۱۲ | سیستم اعلان و یادآوری | `10-Notification-Reminder-System/` |
| ۱۳ | گزارش‌ها و تحلیل‌ها | `11-Reports-Analytics/` |
| ۱۴ | داشبورد | `12-Dashboard/` |
| ۱۵ | بررسی پرتفولیو و ثروت | `13-Portfolio-Wealth-Overview/` |
| ۱۶ | مدیریت مالیات | `14-Tax-Management/` |
| ۱۷ | مدیریت اسناد | `15-Document-Management/` |
| ۱۸ | تنظیمات و ابزارها | `16-Settings-Tools/` |
| ۱۹ | امنیت و حریم خصوصی | `18-Security-Privacy/` |
| ۲۰ | دریافت قیمت‌ها | `19-Price-Fetching/` (شامل ۴ زیرفیچر) |
| — | دسته‌بندی‌های مشترک | `99-Common-Categories/` |

> **ساده‌سازی v1:** Tax = جدول `tax_events` + taxable metadata روی trades؛ قوانین پیچیده ۱۴۰۴ را کامل پیاده نکن. FX = جدول `fx_rates` ساده در UX/schema + **engine داخلی path/graph** وقتی نرخ مستقیم نباشد (Core، نه UI). Cheque و Loan فیچر جدا می‌مانند اما هر دو بدهی‌اند و از Accounting Core مشترک استفاده می‌کنند.

> **Standalone UI ≠ Standalone Ledger.** Feature می‌تواند تنها UI فعال باشد؛ journal همیشه از Core می‌آید. Navigation فقط ۹ صفحه.
