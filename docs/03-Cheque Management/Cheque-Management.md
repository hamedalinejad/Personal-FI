نام فیچر: Cheque Management
توضیح کلی:
این فیچر مسئولیت کامل مدیریت چک‌های پرداختی و دریافتی را بر عهده دارد.
چک‌ها دارای وضعیت (در انتظار، وصول‌شده، برگشتی و ...) هستند و هنگام تغییر وضعیت، تراکنش مالی مربوطه به صورت خودکار ثبت می‌شود.

User Stories
Must Have:

ثبت چک جدید (پرداختی یا دریافتی)
ثبت اطلاعات کامل چک (شماره چک، مبلغ، تاریخ سررسید، بانک، حساب مرتبط و ...)
تغییر وضعیت چک (در انتظار → وصول‌شده / برگشتی / ابطال)
ثبت خودکار تراکنش هنگام وصول یا برگشت چک
مشاهده لیست چک‌ها با فیلتر (وضعیت، تاریخ سررسید، نوع، حساب)
یادآوری سررسید چک‌ها
مشاهده مجموع چک‌های در جریان (پرداختی و دریافتی)

Should Have:

افزودن تصویر چک
جستجوی پیشرفته
گزارش چک‌های برگشتی


Business Rules

چک می‌تواند از نوع پرداختی (صادر شده توسط کاربر) یا دریافتی (دریافت‌شده از دیگران) باشد.
ارز چک همیشه با ارز حساب مرتبط یکی است.
هنگام ثبت چک، نرخ تبدیل لحظه ثبت (نسبت به دلار/تتر) ذخیره می‌شود.
چک در ابتدا با وضعیت pending ثبت می‌شود.
هنگام وصول چک:
اگر دریافتی باشد → تراکنش deposit-cheque ایجاد و مانده حساب افزایش می‌یابد.
اگر پرداختی باشد → تراکنش withdrawal-cheque ایجاد و مانده حساب کاهش می‌یابد.

هنگام برگشت چک، وضعیت به bounced تغییر می‌کند و تراکنش معکوس (در صورت نیاز) ثبت می‌شود.
موجودی حساب نمی‌تواند منفی شود.
ویرایش چک فقط در وضعیت pending مجاز است.
حذف فیزیکی وجود ندارد — فقط تغییر وضعیت به cancelled.


Domain Entities
۱. Cheque (جدول: cheques)

id → UUID (Primary Key)
type → string (payable یا receivable)
chequeNumber → string (شماره چک)
amount → decimal (مبلغ چک)
currency → string (ارز چک = ارز حساب)
exchangeRateToUSD → decimal (نرخ تبدیل لحظه ثبت)
accountId → UUID (حساب مرتبط)
bankName → string (بانک صادرکننده)
issueDate → datetime (تاریخ صدور)
dueDate → datetime (تاریخ سررسید)
status → string (pending, cleared, bounced, cancelled)
payeeOrPayer → string (طرف مقابل)
description → string (توضیحات)
hasAttachment → boolean
attachmentPath → string (تصویر چک)
clearedDate → datetime (تاریخ وصول — nullable)
transactionId → UUID (شناسه تراکنش مرتبط — nullable)
createdAt → datetime
updatedAt → datetime

۲. Transaction (جدول مشترک AccountsBanking_transactions)

هنگام وصول چک، تراکنش مربوطه با نوع deposit-cheque یا withdrawal-cheque ایجاد می‌شود.


APIهای داخلی (Internal APIs)
Cheque APIs:

createCheque(data) → ثبت چک جدید (وضعیت اولیه: pending)
updateCheque(id, data) → ویرایش چک (فقط در وضعیت pending)
changeChequeStatus(id, newStatus) → تغییر وضعیت + ایجاد/لغو تراکنش
getAllCheques(filters) → لیست با فیلتر (وضعیت، نوع، تاریخ سررسید، حساب)
getChequeById(id)
getPendingCheques() → چک‌های در انتظار
getTotalChequesByStatus(status, startDate?, endDate?) → مجموع چک‌ها بر اساس وضعیت
getUpcomingDueCheques(days) → چک‌های نزدیک به سررسید (برای یادآوری)


روابط با سایر فیچرها

Accounts & Banking: به‌روزرسانی currentBalance هنگام وصول
Currency & Multi-Currency: دریافت نرخ تبدیل لحظه‌ای
Transaction: ایجاد رکورد تراکنش هنگام تغییر وضعیت
Notification & Reminder: یادآوری سررسید چک‌ها
Reports و Dashboard: نمایش چک‌های در جریان و برگشتی


نکات طراحی

وضعیت چک‌ها به صورت state machine مدیریت می‌شود.
تصویر چک به عنوان attachment ذخیره می‌شود.
برای چک‌های پرداختی، موجودی حساب در زمان صدور چک قفل یا رزرو نمی‌شود (مگر تصمیم دیگری گرفته شود).