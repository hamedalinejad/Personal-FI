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
3. هنگام پرداخت مالیات:
   - **مرحله ۱**: تراکنش Expense/Income باید ابتدا ثبت شود (با نوع مناسب)
   - **مرحله ۲**: `markAsPaid()` این تراکنش را به مالیات لینک می‌کند (از طریق `accountTransactionId`)
   - تراکنش در `acc_transactions` با نوع `withdrawal-expense-tax` (یا `deposit-income-tax` در صورت بازگشت مالیات) ثبت می‌شود — از انواع اختصاصی مالیات استفاده می‌شود، نه انواع عمومی `withdrawal-expense`/`deposit-income`، تا در گزارش‌ها و فیلترها قابل تفکیک باشد.
   - موجودی حساب کاهش (یا افزایش) می‌یابد.
4. مالیات‌های معوق باید در یادآوری‌ها و داشبورد نمایش داده شوند.
5. حذف فیزیکی وجود ندارد — فقط تغییر وضعیت.
6. محاسبات پیچیده مالیاتی (اظهارنامه رسمی) خارج از محدوده این فیچر است.
7. برای هر تراکنش مالیاتی، `exchangeRateToBase` در لحظه پرداخت ذخیره می‌شود تا ارزش تاریخی قابل محاسبه باشد.

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
- `accountTransactionId` → UUID (لینک به `acc_transactions` — nullable)
- `relatedFeature` → string (نوع `RelatedFeature` — تعریف مرکزی در `core/types/types.md`؛ nullable — برای مالیات مرتبط با یک زیرفیچر خاص، مقدار دقیق آن زیرفیچر استفاده می‌شود: `crypto_exchange`, `stocks_iran`, `fif`, `metals`, `physical_assets`)
- `relatedId` → UUID (nullable)
- `hasAttachment` → boolean
- `attachmentPath` → string
- `exchangeRateToBase` → decimal (نرخ تتر لحظه پرداخت — ریال به ازای ۱ تتر، مثلاً ۶۰,۰۰۰)
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
- `createTaxRecord(data)` → ثبت مالیات جدید (بدون تراکنش واقعی)
- `updateTaxRecord(taxRecordId, data)` → ویرایش مالیات
- `getAllTaxRecords(filters)` → فیلتر بر اساس سال، نوع، وضعیت
- `getTaxRecordById(taxRecordId)` → دریافت جزئیات مالیات
- `markAsPaid(taxRecordId, paidDate, accountId, accountTransactionId, relatedFeature?, relatedId?)`  
  → لینک پرداخت به مالیات (با فرض اینکه تراکنش Expense/Income قبلاً ایجاد شده)  
  → این API فقط `accountTransactionId` را به مالیات لینک می‌کند (تراکنش Expense باید پیش‌تر ثبت شده باشد)
- `changeStatus(taxRecordId, status)` → تغییر وضعیت (pending, paid, overdue, cancelled)
- `getPendingTaxes()` → مالیات‌های در انتظار
- `getOverdueTaxes()` → مالیات‌های معوق

### Summary APIs
- `getTaxSummary(year?)` → مجموع مالیات‌های پرداخت‌شده و در انتظار
- `getTaxesByType(year?)` → تفکیک بر اساس نوع
- `getAnnualTaxReport(year)` → گزارش سالانه

---

## روابط با سایر فیچرها

- **Accounts & Banking**: ایجاد تراکنش Expense/Income و کاهش/افزایش موجودی حساب
- **Expense**: ایجاد تراکنش هزینه هنگام پرداخت مالیات (برای مالیات‌های هزینه‌محور)
- **Income**: ایجاد تراکنش درآمد هنگام بازگشت مالیات (در صورت وجود)
- **Investment**: پیگیری مالیات احتمالی سود سرمایه‌گذاری (از طریق `relatedFeature` با مقدار دقیق زیرفیچر — یکی از `crypto_exchange`, `stocks_iran`, `fif`, `metals`)
- **Physical Assets**: عوارض و مالیات خودرو یا ملک (از طریق `relatedFeature=physical_assets`)
- **Notification & Reminder**: یادآوری موعد پرداخت
- **Document Management**: نگهداری فیش و اسناد مالیاتی
- **Reports / Dashboard**: نمایش مالیات‌های نزدیک و مجموع پرداختی

---

## انواع مالیات پیشنهادی

| نوع | مثال | نوع تراکنش |
|------|------|------------|
| `income` | مالیات بر درآمد مشاغل / حقوق | Expense |
| `capital_gains` | مالیات سود سرمایه‌گذاری (در صورت اعمال) | Expense |
| `property` | مالیات یا عوارض ملک | Expense |
| `vehicle` | عوارض خودرو | Expense |
| `other` | سایر عوارض و مالیات‌ها | Expense |

---

## نکات طراحی

- این فیچر برای کاربر شخصی طراحی شده و نباید پیچیده شود.
- تمرکز روی ثبت، پیگیری وضعیت و یادآوری است، نه محاسبه قانونی دقیق.
- امکان اتصال به سال مالیاتی مشخص (مثلاً ۱۴۰۴) برای گزارش‌گیری بهتر وجود داشته باشد.
- در Dashboard می‌توان مجموع مالیات‌های در انتظار و نزدیک به سررسید را نمایش داد.
- نرخ تتر در زمان ثبت و پرداخت ذخیره می‌شود تا ارزش تاریخی قابل بررسی باشد.
- تراکنش مالیاتی واقعی همیشه از طریق Expense/Income ثبت می‌شود، نه مستقیماً در `acc_transactions`.
- در نسخه‌های بعدی می‌توان قالب‌های آماده برای انواع رایج مالیات اضافه کرد.