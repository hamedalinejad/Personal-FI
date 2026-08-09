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
* Persistent Storage (`navigator.storage.persist()`) برای جلوگیری از حذف داده روی موبایل
* الگوی نوشتن Write-to-temp-then-swap برای جلوگیری از خرابی فایل دیتابیس حین اجرای PWA روی موبایل

---

# 11. Financial Principles

این بخش غیرقابل مذاکره است.

## Decimal Only

تمام محاسبات مالی فقط با decimal.js انجام می‌شوند.

استفاده از Number یا Float برای محاسبات مالی ممنوع است.

---

## Minor Unit Storage

تمام مبالغ در دیتابیس به کوچک‌ترین واحد پول ذخیره می‌شوند.

مثال:

* ریال → مقدار صحیح
* دلار → سنت (Cent)
* یورو → سنت
* سایر ارزها → کوچک‌ترین واحد تعریف‌شده

نمایش مبلغ فقط در لایه Presentation انجام می‌شود.

---

## Immutable Transactions

تراکنش‌های مالی اصل تاریخچه سیستم هستند.

در صورت نیاز به اصلاح، ترجیح بر ایجاد تراکنش اصلاحی یا ثبت تاریخچه تغییرات است و از حذف یا بازنویسی مستقیم اطلاعات مالی باید تا حد امکان اجتناب شود.

---

## UTC Storage

تمام تاریخ‌ها و زمان‌ها به صورت UTC ذخیره می‌شوند.

نمایش تاریخ بر اساس منطقه زمانی و تنظیمات کاربر انجام خواهد شد.

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

* هر پوشه دارای README.md باشد.
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

ساختار مستندات پروژه به صورت زیر خواهد بود.

```text
docs/

00-Product/
01-Business/
02-Design/
03-Technical/
04-Project/
99-Future-Ideas/
```

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
