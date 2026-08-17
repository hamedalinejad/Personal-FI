# فیچر: Settings & Tools (تنظیمات و ابزارها)

## توضیح کلی

این فیچر مرکز تنظیمات عمومی نرم‌افزار و ابزارهای کمکی است.
کاربر از این بخش می‌تواند رفتار کلی اپ، ظاهر، زبان، ارز پایه، پشتیبان‌گیری و برخی ابزارهای کاربردی را مدیریت کند.

تنظیمات باید ساده، شفاف و بدون پیچیدگی غیرضروری باشد و با اصول **Offline-First** و **Privacy-First** پروژه هم‌خوانی داشته باشد.

---

## User Stories

### Must Have
- تغییر زبان (فارسی / انگلیسی)
- انتخاب تم (روشن / تیره / سیستم)
- تنظیم ارز پایه نمایش
- مدیریت دسته‌بندی‌های درآمد و هزینه
- پشتیبان‌گیری از داده‌ها
- بازیابی از پشتیبان
- مشاهده اطلاعات نسخه نرم‌افزار

### Should Have
- تنظیم فرمت تاریخ (شمسی / میلادی)
- تنظیم نمایش اعداد (فارسی / انگلیسی)
- مدیریت حساب‌های پیش‌فرض
- تنظیمات اعلان‌ها (میانبر به Notification Settings)
- پاک‌سازی کش و داده‌های موقت
- خروجی/ورود داده (در صورت نیاز اولیه)

---

## Business Rules

1. تغییر تنظیمات باید بلافاصله یا پس از ذخیره اعمال شود.
2. پشتیبان‌گیری باید شامل تمام داده‌های مهم کاربر باشد.
3. اپ را باید بتوان به صورت کامل آفلاین استفاده کرد (بدون نیاز به اینترنت).
4. تنظیمات اپ نباید باعث خرابی در سایر فیچرها شوند.
5. دسته‌بندی‌های سیستمی نباید قابل حذف کامل باشند (فقط غیرفعال‌سازی).
6. هیچ داده مالی نباید بدون رضایت کاربر به بیرون ارسال شود.
7. «مشاهده اطلاعات نسخه نرم‌افزار» شامل بررسی خودکار و بی‌صدای نسخه جدید در Startup است (استثنای مجاز از قانون Offline-First — به `Technical-Architecture.md` بخش «سیاست دسترسی به شبکه» مراجعه شود)؛ کاربر می‌تواند این بررسی خودکار را از همین بخش خاموش کند و فقط دستی («بررسی به‌روزرسانی») استفاده کند.
8. مدیریت منابع قیمت و روشن/خاموش‌کردن به‌روزرسانی خودکار قیمت دارایی‌ها (Auto-Sync) از یک بخش جدا («دریافت قیمت‌ها») در همین صفحه تنظیمات انجام می‌شود؛ جزئیات کامل در `19-Price-Fetching/Price-Fetching.md`. این بخش از قانون بند ۶ همین‌جا و از اصل Offline-First پیروی می‌کند — پیش‌فرض خاموش و فقط با تأیید صریح کاربر روشن می‌شود.

---

## بخش‌های اصلی تنظیمات

### ۱. عمومی (General)
- زبان رابط کاربری
- تم (Light / Dark / System)
- فرمت تاریخ
- فرمت اعداد

### ۲. دسته‌بندی‌ها (Categories)
- مدیریت دسته‌های درآمد
- مدیریت دسته‌های هزینه
- افزودن، ویرایش و غیرفعال‌سازی دسته

### ۳. حساب‌ها و پیش‌فرض‌ها
- حساب پیش‌فرض برای درآمد
- حساب پیش‌فرض برای هزینه
- حساب پیش‌فرض برای انتقال

### ۴. اعلان‌ها
- میانبر به تنظیمات Notification
- فعال/غیرفعال کردن یادآوری‌های کلی

### ۵. پشتیبان‌گیری و داده
- ایجاد پشتیبان محلی
- بازیابی از فایل پشتیبان
- پاک‌سازی کش
- (آینده) پشتیبان ابری رمزنگاری‌شده

### ۶. درباره نرم‌افزار
- نسخه اپ
- لینک قوانین حریم خصوصی
- اطلاعات تماس یا پشتیبانی

---

## Domain Entities

### ۱. App Setting (جدول: `stg_settings`)

- `id` → UUID یا کلید ثابت
- `key` → string (مثلاً `language`, `theme`)
- `value` → string / JSON
- `updatedAt` → datetime

> می‌توان به صورت Key-Value ساده پیاده‌سازی کرد.

> **نکته مهم — ارز پایه**:
> - تنظیم ارز پایه در `stg_settings` **وجود ندارد**.
> - ارز پایه و ارز نمایشی در جدول `cur_currency_preferences` نگهداری می‌شوند (فیچر Currency & Multi-Currency).
> - `stg_settings` فقط برای تنظیمات UI (زبان، تم، فرمت تاریخ، فرمت اعداد) استفاده می‌شود.
> - برای خواندن ارز پایه: `getUserCurrencyPreference()` از فیچر Currency را فراخوانی کنید.

### ۲. Category (جدول: `cat_categories`)

- `id` → UUID
- `code` → string (کد کوتاه مثل `salary`, `food`, `rental`؛ **یکتا نیست به‌تنهایی** — یکتایی روی زوج `(type, code)` است، چون همان `code` می‌تواند هم در دسته‌های `income` و هم `expense` به‌کار رود، مثلاً `gift` هم در دسته درآمد «هدیه و کمک» و هم در دسته هزینه «هدیه و اهداء» استفاده می‌شود)
- `name_fa` → string (نام فارسی)
- `name_en` → string (نام انگلیسی)
- `description` → text (توضیحات اختیاری)
- `type` → string (`income` یا `expense`)
- `isSystem` → boolean (`true` برای دسته‌های استاندارد سیستم، `false` برای دسته‌های کاربر)
- `isActive` → boolean
- `order` → number (ترتیب نمایش)
- `createdAt` → datetime
- `updatedAt` → datetime

> **قید یکتایی (الزامی)**: `UNIQUE(type, code)` روی جدول تعریف شود، نه `UNIQUE(code)`. بدون این تصریح، تلاش برای درج دسته هزینه `gift` بعد از دسته درآمد `gift` (یا برعکس) با فرض غلط یکتایی سراسری `code` رد می‌شود؛ در حالی که طبق `Categories.md` این دو رکورد مجزا و هر دو معتبرند. ارجاعات به یک دسته (مثلاً در تراکنش‌های Income/Expense) باید همیشه با هر دو فیلد `type` + `code` انجام شود، نه فقط `code`.

> **نکته طراحی**: این جدول دو نقش دارد:
> ۱. نگهداری لیست استاندارد دسته‌ها (با `isSystem = true`) که در `99-Common-Categories/Categories.md` تعریف شده‌اند
> ۲. اجازه اضافه کردن دسته‌های شخصی توسط کاربر (با `isSystem = false`)
> فیچرهای Income و Expense می‌توانند از هر دو دسته استفاده کنند.

### ۳. Backup Log (جدول: `stg_backup_logs`) — اختیاری

- `id` → UUID (Primary Key)
- `fileName` → string (نام فایل پشتیبان)
- `filePath` → string (مسیر فایل پشتیبان در سیستم)
- `fileSize` → number (اندازه فایل به بایت)
- `backupType` → string (`local`, `encrypted`) — نوع پشتیبان
- `backupDate` → datetime (تاریخ ایجاد پشتیبان)
- `createdAt` → datetime
- `note` → string (یادداشت اختیاری)

---

## APIهای داخلی

### Settings APIs
- `getSetting(key)`
- `setSetting(key, value)`
- `getAllSettings()`
- `resetSettingsToDefault()`

### Category APIs
- `getCategories(type?)` → فیلتر بر اساس type (income/expense)
- `getSystemCategories(type?)` → دریافت دسته‌های استاندارد سیستم
- `getUserCategories(type?)` → دریافت دسته‌های شخصی کاربر
- `createCategory(data)` → ایجاد دسته شخصی (با `isSystem = false`)
- `updateCategory(catId, data)` → ویرایش دسته شخصی
- `deactivateCategory(catId)` → غیرفعال کردن دسته (برای system categories فقط deactivate مجاز)
- `reorderCategories(type, orderedIds)` → تغییر ترتیب نمایش دسته‌ها

### Backup APIs
- `createBackup()` → Export SQLite + متادیتا (`schemaVersion`, `appVersion`, `exportedAt`, `checksum`) + ثبت `stg_backup_logs`
- `restoreBackup(file)` → **Atomic Restore** با Integrity Contract (باگ‌های ۴۷–۴۸):
  1. تأیید کاربر
  2. checksum + schemaVersion + load temp
  3. `integrity_check` + `foreign_key_check` + required tables
  4. migration روی temp در صورت نیاز
  5. فقط در موفقیت کامل → swap با `db_main` (DB قبلی تا آن لحظه سالم می‌ماند)
  6. هر شکست → abort بدون overwrite
- `listBackups()` → دریافت لیست با `backupType` و `backupDate`
- `deleteBackup(backupLogId)` → حذف رکورد + فایل
- `getBackupInfo(backupLogId)` → جزئیات + schemaVersion + checksum
- `validateBackupFile(file)` → اجرای مراحل ۲–۳ بدون swap (پیش‌نمایش سلامت فایل)

### Tools APIs
- `clearCache()`
- `getAppInfo()` → نسخه، محیط و ...

---

## روابط با سایر فیچرها

- **Currency**: ارز پایه و نمایش نرخ‌ها — `cur_currency_preferences` master است
- **Notification**: تنظیمات یادآوری
- **Accounts & Banking**: حساب‌های پیش‌فرض
- **Income / Expense**: دسته‌بندی‌ها
- **Security & Privacy**: ارتباط با قفل اپ و رمزنگاری
- **تمام فیچرها**: زبان، تم و فرمت نمایش

---

## تنظیمات پیشنهادی پیش‌فرض

| کلید | مقدار پیش‌فرض |
| `autoVersionCheckEnabled` | `false` (BUG-C02 Offline-by-default) |
|------|----------------|
| `language` | `fa` |
| `theme` | `system` |
| `date_format` | `jalali` |
| `number_format` | `persian` |
| `default_income_account` | null |
| `default_expense_account` | null |
| `default_transfer_account` | null |

> **توجه**: `base_currency` و `display_currency` در این جدول ذخیره نمی‌شوند — آن‌ها در `cur_currency_preferences` هستند.

---

## پشتیبان‌گیری

### محتوای پیشنهادی فایل Backup

- `database` — بایت‌های SQLite
- `meta.json` — `{ schemaVersion, appVersion, exportedAt, checksum, tableCounts? }`
- checksum باید قبل از Restore مطابقت کند (باگ ۴۷)


### نکات
- فرمت پیشنهادی: JSON فشرده‌شده یا SQLite export
- امکان رمزگذاری فایل پشتیبان با رمز عبور کاربر (پیشنهادی)
- بازیابی باید هشدار واضح درباره جایگزینی داده‌ها بدهد

---

## نکات طراحی

- تنظیمات باید دسته‌بندی‌شده و قابل فهم باشد.
- تغییرات ظاهری (تم و زبان) بهتر است بدون نیاز به ریستارت کامل اعمال شوند.
- پشتیبان‌گیری یکی از مهم‌ترین بخش‌هاست و باید در دسترس و قابل اعتماد باشد.
- از شلوغ کردن صفحه تنظیمات با گزینه‌های پیشرفته غیرضروری خودداری شود.
- در نسخه‌های بعدی می‌توان Import/Export پیشرفته‌تر و همگام‌سازی ابری اختیاری اضافه کرد.

### قوانین Backup/Restore (باگ ۴۷–۴۸)

1. Backup بدون `schemaVersion` و `checksum` ناقص است و در v1 نباید به‌عنوان backup کامل پذیرفته شود.
2. Restore هرگز مستقیماً روی `db_main` نمی‌نویسد مگر پس از validate کامل روی temp.
3. جزئیات جریان در `core/db/db.md` بخش «قرارداد Backup / Restore».
