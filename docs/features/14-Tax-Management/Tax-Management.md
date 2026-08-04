# فیچر: Tax Management (مدیریت مالیات)

## توضیح کلی

این فیچر به کاربر کمک می‌کند مالیات‌ها و عوارض مرتبط با فعالیت‌های مالی و سرمایه‌گذاری خود را پیگیری، محاسبه و مدیریت کند.  
تمرکز آن روی نیازهای یک کاربر شخصی ایرانی است (نه حسابداری شرکتی کامل).

موارد قابل پوشش:
- مالیات بر درآمد (در صورت نیاز)
- مالیات نقل و انتقال یا سود سرمایه‌گذاری (در صورت اعمال)
- عوارض و مالیات‌های مرتبط با دارایی
- یادآوری موعدهای مالیاتی
- نگهداری اسناد و سوابق مالیاتی

این فیچر بیشتر نقش **پیگیری و آماده‌سازی اطلاعات** را دارد و جایگزین مشاور مالیاتی یا نرم‌افزارهای تخصصی اظهارنامه نیست.

---

## User Stories

### Must Have
- ثبت رویداد مالیاتی (نوع، مبلغ، تاریخ، وضعیت)
- دسته‌بندی انواع مالیات و عوارض
- مشاهده لیست مالیات‌های پرداخت‌شده و در انتظار
- یادآوری موعد پرداخت مالیات
- اتصال پرداخت مالیات به حساب بانکی
- مشاهده مجموع مالیات‌های پرداخت‌شده در بازه زمانی

### Should Have
- پیوست اسناد و فیش‌های پرداخت
- برآورد ساده مالیات بر اساس درآمد یا سود
- گزارش سالانه مالیات‌ها
- تفکیک مالیات مرتبط با سرمایه‌گذاری‌ها

---

## Business Rules

1. هر رکورد مالیاتی باید نوع مشخصی داشته باشد.
2. وضعیت مالیات می‌تواند `pending`, `paid`, `overdue`, `cancelled` باشد.
3. هنگام ثبت پرداخت مالیات:
   - تراکنش در `AccountsBanking_transactions` ثبت می‌شود.
   - موجودی حساب کاهش می‌یابد.
4. مالیات‌های معوق باید در یادآوری‌ها و داشبورد نمایش داده شوند.
5. حذف فیزیکی وجود ندارد — فقط تغییر وضعیت.
6. محاسبات پیچیده مالیاتی (اظهارنامه رسمی) خارج از محدوده این فیچر است.

---

## Domain Entities

### ۱. Tax Record (جدول: `tax_records`)

- `id` → UUID (Primary Key)
- `title` → string (مثلاً «مالیات عملکرد ۱۴۰۴» یا «عوارض خودرو»)
- `taxType` → string (`income`, `capital_gains`, `property`, `vehicle`, `other`)
- `amount` → decimal
- `currency` → string (پیش‌فرض IRR)
- `dueDate` → datetime
- `paidDate` → datetime (nullable)
- `status` → string (`pending`, `paid`, `overdue`, `cancelled`)
- `year` → number (سال مالیاتی)
- `description` → string
- `accountId` → UUID (حساب پرداخت‌کننده — nullable)
- `accountTransactionId` → UUID (لینک به تراکنش بانکی — nullable)
- `relatedFeature` → string (مثلاً investment, physical_assets — nullable)
- `relatedId` → UUID (nullable)
- `hasAttachment` → boolean
- `attachmentPath` → string
- `exchangeRateToUSDT` → decimal
- `createdAt` → datetime
- `updatedAt` → datetime

### ۲. Tax Category (جدول: `tax_categories`) — اختیاری

- `id` → UUID
- `name` → string
- `code` → string
- `description` → string
- `isActive` → boolean

---

## APIهای داخلی

### Tax Record APIs
- `createTaxRecord(data)` → ثبت مالیات جدید
- `updateTaxRecord(id, data)`
- `getAllTaxRecords(filters)` → فیلتر بر اساس سال، نوع، وضعیت
- `getTaxRecordById(id)`
- `markAsPaid(id, paidDate, accountId)` → ثبت پرداخت + ایجاد تراکنش بانکی
- `changeStatus(id, status)`
- `getPendingTaxes()`
- `getOverdueTaxes()`

### Summary APIs
- `getTaxSummary(year?)` → مجموع مالیات‌های پرداخت‌شده و در انتظار
- `getTaxesByType(year?)` → تفکیک بر اساس نوع
- `getAnnualTaxReport(year)` → گزارش سالانه

---

## روابط با سایر فیچرها

- **Accounts & Banking**: ثبت پرداخت مالیات و کاهش موجودی
- **Income / Expense**: در صورت نیاز، ارتباط با درآمد مشمول مالیات
- **Investment**: پیگیری مالیات احتمالی سود سرمایه‌گذاری
- **Physical Assets**: عوارض و مالیات خودرو یا ملک
- **Notification & Reminder**: یادآوری موعد پرداخت
- **Document Management**: نگهداری فیش و اسناد مالیاتی
- **Reports / Dashboard**: نمایش مالیات‌های نزدیک و مجموع پرداختی

---

## انواع مالیات پیشنهادی

| نوع | مثال |
|------|------|
| `income` | مالیات بر درآمد مشاغل / حقوق |
| `capital_gains` | مالیات سود سرمایه‌گذاری (در صورت اعمال) |
| `property` | مالیات یا عوارض ملک |
| `vehicle` | عوارض خودرو |
| `other` | سایر عوارض و مالیات‌ها |

---

## نکات طراحی

- این فیچر برای کاربر شخصی طراحی شده و نباید پیچیده شود.
- تمرکز روی ثبت، پیگیری وضعیت و یادآوری است، نه محاسبه قانونی دقیق.
- امکان اتصال به سال مالیاتی مشخص (مثلاً ۱۴۰۴) برای گزارش‌گیری بهتر وجود داشته باشد.
- در Dashboard می‌توان مجموع مالیات‌های در انتظار و نزدیک به سررسید را نمایش داد.
- نرخ تتر در زمان ثبت و پرداخت ذخیره می‌شود تا ارزش تاریخی قابل بررسی باشد.
- در نسخه‌های بعدی می‌توان قالب‌های آماده برای انواع رایج مالیات اضافه کرد.