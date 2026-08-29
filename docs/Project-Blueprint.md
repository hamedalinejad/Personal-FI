# Project Blueprint

## Personal Finance & Investment Management System

> **Document Type:** Foundation Document (Project Constitution)
> **Version:** 1.0.0
> **Status:** Approved
> **Last Updated:** 2026-07-09

---

# 1. Purpose

این سند، پایه و مرجع رسمی پروژه است.

تمام تصمیمات معماری، طراحی، توسعه، مستندسازی و پیاده‌سازی باید مطابق اصول و قوانین تعریف‌شده در این سند انجام شوند.

این سند فقط شامل تصمیمات بنیادین پروژه است و وارد جزئیات پیاده‌سازی نمی‌شود.

---

# 2. Vision

هدف پروژه، توسعه یک نرم‌افزار حرفه‌ای برای مدیریت مالی شخصی و سرمایه‌گذاری است که بتواند طی سال‌ها توسعه پیدا کند، بدون اینکه نیاز به بازطراحی اساسی معماری داشته باشد.

این نرم‌افزار باید:

* ساده برای استفاده روزمره باشد.
* از نظر فنی کاملاً مقیاس‌پذیر باشد.
* کاملاً آفلاین کار کند.
* مالکیت کامل اطلاعات را در اختیار کاربر قرار دهد.
* قابلیت توسعه به نسخه‌های موبایل، دسکتاپ و ابری را داشته باشد.

---

# 3. Mission

ایجاد بستری امن، سریع و قابل اعتماد برای مدیریت:

* حسابداری شخصی
* مدیریت سرمایه‌گذاری
* تحلیل دارایی‌ها
* گزارش‌های مالی
* برنامه‌ریزی مالی

بدون وابستگی به اینترنت یا سرویس‌های شخص ثالث.

---

# 4. Product Scope

## نسخه اول (Version 1)

پروژه شامل دو ماژول اصلی خواهد بود:

### Personal Accounting

* مدیریت حساب‌ها
* درآمد
* هزینه
* انتقال بین حساب‌ها
* بودجه
* دسته‌بندی‌ها
* گزارش‌های مالی

### Investment Management

* مدیریت دارایی‌ها
* ثبت معاملات سرمایه‌گذاری
* مدیریت پرتفولیو
* تحلیل عملکرد
* گزارش سرمایه‌گذاری

---


## Source of Truth محدوده نسخه ۱

| سند | نقش |
|-----|-----|
| **`Product-Map-FA.md` — لیست Feature** | چشم‌انداز محصول کامل |
| **`Product-Map-FA.md` — فازبندی پیاده‌سازی** | **SoT ترتیب کد/UI** (MVP v1.0 → v1.1 → v1.2 → v2) |
| **`Project-Blueprint.md`** | اصول معماری، داده، Offline |
| Feature docs | قرارداد دامنه؛ پیاده‌سازی طبق فاز |

پیاده‌سازی همزمان هر ۲۰ فیچر در یک release **ممنوع** است. تعارض «Product-Map کامل» با ظرفیت تیم با **فازبندی** حل می‌شود نه حذف مستند آینده.

# 5. Out of Scope

موارد زیر در نسخه اول پروژه پیاده‌سازی نخواهند شد:

* ERP
* حسابداری شرکتی
* چندکاربره
* انبارداری
* حقوق و دستمزد
* CRM
* فروشگاه
* حسابداری سازمانی

این قابلیت‌ها در صورت نیاز در نسخه‌های آینده بررسی خواهند شد.

---

# 6. Product Principles

پروژه بر اساس اصول زیر توسعه داده می‌شود.

## Offline First

تمام قابلیت‌های اصلی نرم‌افزار بدون اینترنت قابل استفاده خواهند بود.

---

## Privacy First

تمام اطلاعات متعلق به کاربر است.

هیچ داده‌ای بدون رضایت کاربر ارسال نخواهد شد.

---

## Local First

تمام اطلاعات ابتدا روی دستگاه ذخیره می‌شوند.

در آینده امکان همگام‌سازی با سرور اضافه خواهد شد.

---

## Single User (Version 1)

> **License**: لایسنس بیرون از مدل داده مالی می‌ماند؛ هر کاربر یک SQLite مستقل؛ جزئیات مرز در Technical-Architecture.

نسخه اول برای یک کاربر طراحی می‌شود.

معماری پروژه باید قابلیت توسعه به حالت چندکاربره را داشته باشد.

---

## Modular Design

تمام ماژول‌ها مستقل طراحی می‌شوند.

افزودن یا حذف یک ماژول نباید سایر بخش‌ها را تحت تأثیر قرار دهد.

---

## Long-Term Maintainability

تمام تصمیمات فنی با هدف توسعه بلندمدت پروژه گرفته می‌شوند.

---

# 7. Technical Principles

پروژه بر اساس اصول زیر توسعه خواهد یافت.

* Clean Architecture
* Domain-Driven Design (Lightweight)
* Feature-Based Development
* SOLID Principles
* DRY
* Separation of Concerns
* Type Safety
* Reusability
* Testability
* Scalability

---

# 8. Technology Decisions

## Frontend

* React
* TypeScript
* Vite
* PWA
* Service Worker (Cache App Shell + WASM برای اجرای آفلاین کامل روی موبایل)
* Web App Manifest (نصب‌پذیری روی موبایل — `display: standalone`)

## UI

* Tailwind CSS
* shadcn/ui
* Radix UI

## State Management

* Zustand

## Forms

* React Hook Form
* Zod

## Charts

* Recharts

## Date & Time

* dayjs

## Internationalization

* i18next

## Financial Precision

* decimal.js

## Future Platforms

* Capacitor
* Electron یا Tauri (در آینده و پس از ارزیابی نیازها)

---

# 9. System Architecture

معماری پروژه بر اساس لایه‌های زیر خواهد بود.

```text
Presentation

↓

Features

↓

Application

↓

Domain

↓

Infrastructure

↓

Storage
```

هیچ لایه‌ای نباید وابستگی معکوس به لایه‌های پایین‌تر ایجاد کند.

Business Logic کاملاً مستقل از UI و Database خواهد بود.

---

# 10. Database Principles

نسخه اول پروژه به صورت کامل آفلاین اجرا می‌شود.

ساختار ذخیره‌سازی:

```text
SQLite (WASM)

↓

sql.js

↓

IndexedDB
```

اصول اصلی دیتابیس:

* SQL استاندارد
* Foreign Keys
* Transactions
* Views
* Indexes
* Migration Support
* Backup / Restore
* Import / Export
* آماده برای Cloud Sync
* Persistent Storage (`navigator.storage.persist`) برای جلوگیری از حذف داده روی موبایل
* الگوی نوشتن Write-to-temp-then-swap برای جلوگیری از خرابی فایل دیتابیس حین اجرای PWA روی موبایل

---

# 11. Financial Principles

این بخش غیرقابل مذاکره است.

## Decimal Only

تمام محاسبات مالی فقط با decimal.js انجام می‌شوند.

استفاده از Number یا Float برای محاسبات مالی ممنوع است.

---

## Amount Storage (v1 — decimal string)

**SoT:** تمام مبالغ مالی، نرخ‌ها و quantityها در DB به‌صورت **TEXT decimal string** با محاسبات `decimal.js` ذخیره می‌شوند — **نه** INTEGER minor-unit به‌عنوان مدل اصلی، **نه** float/number.

Minor unit فقط در مرز UI/import/export بانکی از طریق `toMinorUnit` / `fromMinorUnit` (اختیاری). جزئیات: بخش «قرارداد قطعی Amount Storage (v1)» پایین همین سند و `core/db/db.md`.

---

## Immutable Transactions

تراکنش‌های مالی اصل تاریخچه سیستم هستند.

در صورت نیاز به اصلاح، ترجیح بر ایجاد تراکنش اصلاحی یا ثبت تاریخچه تغییرات است و از حذف یا بازنویسی مستقیم اطلاعات مالی باید تا حد امکان اجتناب شود.

---

## UTC Storage

تمام timestampهای مطلق به صورت UTC (ISO 8601) ذخیره می‌شوند.

نمایش بر اساس منطقه زمانی و تقویم کاربر (جلالی/میلادی) در لایه Presentation است.

برای رویدادهای وابسته به بازار/سررسید ایران، فیلدهای معنایی جدا (`businessDate`, `settlementDate`, `marketDate`, `dueDate`, …) طبق قرارداد در `core/db/db.md` الزامی‌اند — فقط یک UTC timestamp کافی نیست.

---

## Pure Calculations

تمام محاسبات مالی باید:

* قابل تست باشند.
* مستقل از UI باشند.
* مستقل از Database باشند.
* بدون Side Effect باشند.

---

# 12. Security Principles

پروژه باید از اصول زیر پیروی کند.

* Privacy First
* Secure Local Storage
* Secure Backup
* Data Encryption (Future)
* No Telemetry by Default
* No Tracking
* No Third-party Data Collection

---

# 13. Scalability Principles

معماری پروژه باید امکان توسعه به موارد زیر را فراهم کند.

* Cloud Sync
* REST API
* Desktop Application
* Android Application
* iOS Application
* Multi Device
* Multi Language
* Multi Currency
* Multi User (Future)

---

# 14. Documentation Standards

تمام مستندات پروژه با فرمت Markdown نوشته می‌شوند.

اصول مستندسازی:

* هر تصمیم معماری به صورت ADR ثبت شود.
* قوانین کسب‌وکار فقط در بخش Business Rules نگهداری شوند.
* فرمول‌های مالی فقط در بخش Calculations مستند شوند.
* تغییرات نسخه‌ها در Changelog ثبت شوند.
* ایده‌های آینده فقط در Future Ideas ثبت شوند.

---

# 15. Development Standards

در کل پروژه رعایت موارد زیر الزامی است.

* TypeScript Only
* ESLint
* Prettier
* Strict Type Checking
* Code Review
* Unit Testing
* Integration Testing
* Documentation First
* Small Pull Requests
* Semantic Versioning

---

# 16. Documentation Structure

ساختار واقعی مستندات پروژه (پس از اعمال ADR-001 — تاریخ: ۱۴۰۴/۰۵/۲۵):

```text
docs/
 00-Product/ # نقشه محصول، IA صفحات
 core/ # معماری هسته مشترک
 db/ # اسکیمای پایگاه داده و الگوهای نوشتن
 hooks/ # React Hooks مشترک
 rounding/ # سیاست گرد کردن اعداد مالی
 services/ # سرویس‌های دامین مشترک
 types/ # تعریف مرکزی تمام نوع‌ها و enum ها (منبع حقیقت)
 utils/ # توابع کمکی مشترک
 features/ # یک پوشه به ازای هر فیچر، با پیشوند عددی
 00-Accounts-Banking/
 01-Income/
 02-Expense/
 03-Cheque-Management/
 04-Debt-Loan-Management/
 05-Investment/ # شامل ۴ زیرفیچر (Crypto, Stocks-Iran, FIF, Metals)
 06-Physical-Assets/
 07-Budget-Management/
 08-Financial-Goals/
 09-Bills-Recurring-Transactions/
 10-Notification-Reminder-System/
 11-Reports-Analytics/
 12-Dashboard/
 13-Portfolio-Wealth-Overview/
 14-Tax-Management/
 15-Document-Management/
 16-Settings-Tools/
 17-Currency-CrossRate/
 18-Security-Privacy/
 19-Price-Fetching/ # شامل ۴ زیرفیچر (Crypto, Stock, FIF, Metals Prices)
 99-Common-Categories/
 lib/ # وابستگی‌های خارجی و wrapper ها
 stores/ # مدیریت وضعیت (State Management)
 styles/ # تعریف‌های سبک و تم
 Product-Map-FA.md # نقشه محصول (فارسی)
 Product-Map-EN.md # نقشه محصول (انگلیسی)
 Project-Blueprint.md # همین سند — مرجع رسمی معماری
 Technical-Architecture.md # معماری فنی کامل
 AUDIT-FULL-REVIEW.md # گزارش ممیزی مستمر مستندات
```

> **تغییر از ساختار اولیه:** ساختار اولیه پیشنهادی (`01-Business/`, `02-Design/`, `03-Technical/`, `04-Project/`, `99-Future-Ideas/`) در عمل جایگزین شد با ساختار فوق که بین لایه‌های فنی (`core/`, `lib/`, `stores/`, `styles/`) و فیچرهای محصولی (`features/`) تفکیک می‌کند. این تصمیم به‌عنوان ADR-001 ثبت شده است (بخش ۱۸).

جزئیات هر بخش در فایل‌های اختصاصی همان پوشه تعریف می‌شود.

---

# 17. Roadmap Overview

پروژه در چند فاز توسعه خواهد یافت.

## Version 1

* حسابداری شخصی
* مدیریت سرمایه‌گذاری
* گزارش‌ها
* بودجه
* PWA

## Version 2

* Cloud Sync
* API
* اعلان‌ها
* قابلیت‌های پیشرفته گزارش‌گیری

## Version 3

* Android
* iOS
* Desktop
* قابلیت‌های هوشمند و توسعه‌های آینده

---

# 18. Architecture Decision Records (ADR)

تمام تصمیمات مهم معماری باید به صورت ADR ثبت شوند.

نمونه تصمیمات:

* انتخاب معماری
* انتخاب دیتابیس
* انتخاب کتابخانه‌ها
* تغییرات ساختاری
* تغییرات مهم قوانین سیستم

هیچ تصمیم مهمی نباید فقط در کد اعمال شود.

---

## ADR-001 — تغییر ساختار پوشه‌بندی مستندات

| فیلد | مقدار |
|---|---|
| **شناسه** | ADR-001 |
| **تاریخ** | ۱۴۰۴/۰۵/۲۵ |
| **وضعیت** | Accepted |
| **تصمیم‌گیرنده** | hamedalinejad |

### زمینه

ساختار اولیه پیشنهادی در بخش ۱۶ این سند (`01-Business/`, `02-Design/`, `03-Technical/`, `04-Project/`, `99-Future-Ideas/`) بر اساس تفکیک نوع مخاطب (بیزنس، طراحی، فنی، پروژه) طراحی شده بود. در عمل، مستندات پروژه حول دو محور اصلی رشد کردند:
- لایه‌های فنی مشترک (پایگاه داده، نوع‌ها، سرویس‌ها، State)
- فیچرهای محصولی که هر کدام منطق، اسکیما، و APIهای مستقل خود را دارند

### تصمیم

ساختار پوشه‌بندی مستندات از ساختار مخاطب‌محور به ساختار لایه‌محور تغییر یافت:

**قبل:**
```text
docs/
 00-Product/
 01-Business/
 02-Design/
 03-Technical/
 04-Project/
 99-Future-Ideas/
```

**بعد:**
```text
docs/
 00-Product/
 core/
 features/
 lib/
 stores/
 styles/
```

### دلایل

1. **یکپارچگی فیچر**: همه مستندات یک فیچر (اسکیما، Business Rules، API، روابط) در یک پوشه است — نه پراکنده بین `02-Design/` و `03-Technical/`.
2. **منبع حقیقت واحد برای هر لایه**: `core/types/` منبع مرکزی همه enum ها و نوع‌هاست؛ `core/db/` منبع مرکزی اسکیماست — بدون تکرار در پوشه‌های مجزا.
3. **مقیاس‌پذیری**: اضافه کردن فیچر جدید = اضافه کردن یک پوشه زیر `features/` بدون تغییر ساختار کلی.

### پیامدها

- پوشه‌های `01-Business/`, `02-Design/`, `03-Technical/`, `04-Project/`, `99-Future-Ideas/` هرگز ساخته نخواهند شد.
- مستندات طراحی (UX/UI)، بیزنس، و فنی هر فیچر در پوشه همان فیچر زیر `features/` نگهداری می‌شوند.
- بخش ۱۶ این سند به‌روزرسانی شد تا ساختار واقعی را منعکس کند.

---

# 19. Definition of Done

یک قابلیت زمانی کامل محسوب می‌شود که:

* تحلیل شده باشد.
* مستندات آن تکمیل شده باشد.
* قوانین کسب‌وکار آن مشخص شده باشد.
* پیاده‌سازی شده باشد.
* تست شده باشد.
* بازبینی شده باشد.
* در Changelog ثبت شده باشد.

---

# 20. Success Criteria

پروژه زمانی موفق تلقی می‌شود که:

* به صورت کامل Offline قابل استفاده باشد.
* تمام منطق مالی دقیق و قابل اعتماد باشد.
* ساختار پروژه توسعه‌پذیر باقی بماند.
* مستندات همیشه همگام با کد باشند.
* کیفیت کد در طول زمان حفظ شود.
* افزودن قابلیت‌های جدید بدون بازطراحی هسته امکان‌پذیر باشد.

---

# 21. Governance

این سند، مرجع رسمی تصمیمات بنیادین پروژه است.

هر تغییری که یکی از اصول این سند را نقض کند، باید ابتدا به عنوان یک **Architecture Decision Record (ADR)** ثبت، بررسی و تأیید شود.

تمام اسناد، طراحی‌ها و پیاده‌سازی‌های آینده باید با این سند سازگار باشند.

## قرارداد قطعی Amount Storage (v1)

**مدل رسمی ذخیره‌سازی در Domain و DB متنی:** decimal string با `decimal.js` (نه float).

| نوع | ذخیره |
|-----|--------|
| MoneyAmount | TEXT decimal string؛ precision از CurrencyRecord |
| AssetQuantity | TEXT decimal string |
| Rate / Price | TEXT decimal string |

**Minor Unit:** لایه اختیاری برای **نمایش/ادغام با API بانکی** یا export — تابع `toMinorUnit` / `fromMinorUnit` در مرز UI یا import.  
ستون‌های اصلی مالی v1 **INTEGER minor نیستند** مگر جدول مشخصاً اعلام کند (مثلاً `quantityMg` به‌عنوان واحد فیزیکی شمارشی).

بخش قدیمی Blueprint با عنوان «همه چیز Minor Unit integer» با این قرارداد **جایگزین** می‌شود.

## Financial Invariants

فهرست ممنوعیت‌های مالی (float، نرخ تاریخی، fee، journal، migration، validation، multi-tab):
`docs/core/Financial-Invariants.md`.

## لایه‌های حساب و License

- تفکیک Financial / Accounting / Party: `docs/core/Account-Layers.md`
- License offline: `docs/core/License-Offline.md`
- Backup `.personalfi`: `docs/core/db/06-migration-backup-audit.md`
