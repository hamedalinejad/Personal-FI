# فیچر: Document Management (مدیریت اسناد و پیوست‌ها)

## توضیح کلی

این فیچر مسئولیت ذخیره، دسته‌بندی و مدیریت تمام **اسناد و پیوست‌های مالی** کاربر را بر عهده دارد. 
هدف آن این است که فاکتورها، رسیدها، قراردادها، تصویر چک‌ها، اسناد وام، مدارک مالیاتی و سایر فایل‌های مهم در یک مکان منظم و قابل جستجو نگهداری شوند.

اسناد می‌توانند به صورت مستقل ذخیره شوند یا به رکوردهای سایر فیچرها (تراکنش، چک، وام، دارایی و ...) متصل گردند.

با توجه به معماری Offline-First، فایل‌ها به صورت محلی ذخیره می‌شوند و در آینده امکان همگام‌سازی ابری نیز قابل اضافه شدن است.

---

## User Stories

### Must Have
- آپلود سند یا تصویر (فاکتور، رسید، قرارداد، چک و ...)
- اتصال سند به تراکنش، چک، وام، دارایی یا مالیات
- دسته‌بندی اسناد
- جستجو و فیلتر اسناد
- مشاهده و دانلود سند
- حذف یا بایگانی سند

### Should Have
- افزودن چند پیوست به یک رکورد
- برچسب‌گذاری (Tags)
- پیش‌نمایش تصویر و PDF
- محدودیت نوع و حجم فایل
- اتصال سند به سال مالی یا دوره خاص

---

## Business Rules

1. هر سند می‌تواند مستقل باشد یا به یک رکورد در فیچر دیگر متصل شود.
2. انواع فایل مجاز باید مشخص و محدود باشند (مثلاً JPG, PNG, PDF, WEBP).
3. حداکثر حجم هر فایل باید محدود شود (مثلاً ۵ یا ۱۰ مگابایت).
4. حذف فیزیکی فایل اختیاری است؛ در حالت پیش‌فرض می‌توان از Soft Delete یا Archive استفاده کرد.
5. اسناد مرتبط با تراکنش‌های مالی نباید بدون آگاهی کاربر حذف شوند.
6. در حالت Offline، آپلود و دسترسی به اسناد باید بدون نیاز به اینترنت کار کند.
7. مسیر ذخیره فایل‌ها باید مدیریت‌شده و امن باشد.

---

## Domain Entities

### ۱. Document (جدول: `docs_documents`)

- `id` → UUID (Primary Key)
- `title` → string (عنوان سند)
- `fileName` → string (نام اصلی فایل)
- `filePath` → string (مسیر ذخیره محلی)
- `fileType` → string (`image/jpeg`, `application/pdf`, ...)
- `fileSize` → number (حجم به بایت)
- `category` → string (`receipt`, `invoice`, `contract`, `cheque`, `loan`, `tax`, `identity`, `other`)
- `tags` → string[] (برچسب‌ها — اختیاری)
- `relatedFeature` → string (نام فیچر مرتبط — nullable)
- `relatedId` → UUID (شناسه رکورد مرتبط — nullable)
- `note` → string
- `documentDate` → datetime (تاریخ سند — اختیاری)
- `isArchived` → boolean
- `createdAt` → datetime
- `updatedAt` → datetime

### ۲. Document Link (جدول: `docs_links`) — برای ارتباط چندبه‌چند

- `id` → UUID (Primary Key)
- `docId` → UUID (لینک به `docs_documents.id`)
- `relatedFeature` → string (نوع `RelatedFeature` — تعریف مرکزی در `core/types/types.md`؛ همان مقادیر مجاز `relatedFeature` در `acc_transactions`)
- `relatedId` → UUID (شناسه رکورد در فیچر مرتبط)
- `note` → string (توضیح اختیاری درباره این ارتباط — nullable)
- `createdAt` → datetime

> **کاربرد**: وقتی یک سند به **چند رکورد** در فیچرهای مختلف متصل باشد از این جدول استفاده می‌شود.
> مثال: یک فاکتور که هم به یک تراکنش هزینه و هم به یک وام مرتبط است.
>
> **مقادیر مجاز `relatedFeature`**: نوع `RelatedFeature` — تعریف مرکزی در `core/types/types.md`؛ مقادیر:
> `income`, `expense`, `cheque`, `loan`, `crypto_exchange`, `stocks_iran`, `fif`, `metals`, `physical_assets`, `budget`, `tax`, `goals`
>
> در حالت ساده‌تر (یک سند به یک رکورد)، می‌توان فقط از فیلدهای `relatedFeature` و `relatedId` در جدول `docs_documents` استفاده کرد و از `docs_links` صرف‌نظر کرد.

---

## دسته‌بندی‌های پیشنهادی اسناد

| دسته | مثال |
|------|------|
| `receipt` | رسید خرید |
| `invoice` | فاکتور رسمی |
| `contract` | قرارداد وام، اجاره، خرید |
| `cheque` | تصویر چک |
| `loan` | مدارک وام و تسهیلات |
| `tax` | فیش مالیاتی، اظهارنامه |
| `identity` | مدارک هویتی مرتبط با حساب‌ها |
| `property` | سند ملک، برگه خودرو |
| `other` | سایر اسناد |

---

## APIهای داخلی

### Document APIs
- `uploadDocument(file, metadata)` → آپلود و ثبت سند
- `updateDocument(docId, data)` → ویرایش عنوان، دسته، برچسب و ...
- `getAllDocuments(filters)` → فیلتر بر اساس دسته، فیچر، تاریخ و ...
- `getDocumentById(docId)`
- `getDocumentsByRelated(feature, relatedId)` → اسناد متصل به یک رکورد؛ **الزامی: هر دو منبع را UNION کند** — هم `docs_documents` که مستقیماً `relatedFeature=feature AND relatedId=relatedId` دارند، هم اسنادی که از طریق `docs_links` به همین رکورد متصل شده‌اند. نادیده‌گرفتن هر یک از دو مسیر باعث گم‌شدن اسناد می‌شود.
- `archiveDocument(docId)`
- `deleteDocument(docId)` → حذف (با احتیاط)
- `downloadDocument(docId)` → دریافت فایل

### Link APIs
- `linkDocument(docId, feature, relatedId)` → اتصال سند به رکورد
- `unlinkDocument(docId, feature, relatedId)`

---

## روابط با سایر فیچرها

- **Income / Expense**: پیوست فاکتور و رسید به تراکنش‌ها
- **Cheque Management**: تصویر چک
- **Debt & Loan**: قرارداد و مدارک وام
- **Physical Assets**: سند ملک، برگه خودرو، فاکتور خرید
- **Tax Management**: فیش و مدارک مالیاتی
- **Investment**: رسید خرید و فروش (در صورت نیاز)
- **Reports**: امکان مشاهده اسناد مرتبط در گزارش‌ها

---

## نکات ذخیره‌سازی فایل

- فایل‌ها بهتر است در پوشه‌بندی منظم محلی ذخیره شوند، مثلاً:
 ```bash
 /documents
 /receipts
 /invoices
 /cheques
 /loans
 /tax
 /other

نام فایل ذخیره‌شده می‌تواند شامل UUID باشد تا تداخل نام رخ ندهد.
در PWA، استفاده از IndexedDB یا File System Access API (در صورت پشتیبانی) برای مدیریت فایل‌ها مناسب است.
در نسخه‌های Capacitor/Tauri می‌توان از ذخیره‌سازی فایل سیستم دستگاه استفاده کرد.


نکات طراحی

آپلود باید ساده و سریع باشد (به‌خصوص از موبایل و دوربین).
پیش‌نمایش تصاویر و PDF تجربه کاربری را بهتر می‌کند.
جستجو بر اساس عنوان، دسته، برچسب و نام فایل ضروری است.
اسناد قدیمی و کم‌استفاده بهتر است قابل Archive باشند تا لیست اصلی شلوغ نشود.
امنیت و حریم خصوصی مهم است؛ فایل‌ها باید فقط در فضای محلی کاربر بمانند (مگر همگام‌سازی ابری فعال شود).
در آینده می‌توان OCR ساده برای خواندن مبلغ از روی رسید اضافه کرد (اختیاری و پیشرفته).

---

## راهنمای پیاده‌سازی
- ذخیره فایل: IndexedDB / OPFS محلی؛ مسیر در `docs_documents.storagePath`
- لینک‌ها در `docs_links` با `relatedFeature` + `relatedId` از enum مرکزی
- حذف سند: soft archive؛ اگر لینک به تراکنش مالی دارد، تأیید کاربر
- بدون شبکه در v1؛ محدودیت MIME و حجم در Domain قبل از write
- تست: attach به cheque؛ جستجو؛ archive بدون حذف فیزیکی

---

## لینک به عملیات مالی

Attachment باید بتواند به **`operationId`** (و اختیاری domain tx id) وصل شود تا audit رسید/قرارداد با همان عمل اتمیک باشد — نه فقط entity پراکنده بدون operation.
