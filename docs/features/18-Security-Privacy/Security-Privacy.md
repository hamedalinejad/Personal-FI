# فیچر: Security & Privacy (امنیت و حریم خصوصی)

## توضیح کلی

این فیچر تمام مکانیزم‌های امنیتی و حریم خصوصی نرم‌افزار را مدیریت می‌کند.  
هدف اصلی جلوگیری از دسترسی غیرمجاز به داده‌های مالی و جلوگیری از سوءاستفاده از اطلاعات کاربر است.

---

## User Stories

### Must Have
- قفل اپ (FaceID، TouchID یا PIN)
- احراز هویت رمز عبور اولیه
- مدیریت جلسات کاربری (ورود/خروج امن)
- رمزنگاری داده‌های حساس در دیتابیس
- جلوگیری از کپی داده‌ها (کپی‌پیست محدود)
- بازبینی امنیتی (security audit)

### Should Have
- ورود چندمرحله‌ای (MFA)
- مدیریت دستگاه‌ها (لیست دستگاه‌های مجاز)
- قفل دوره‌ای (timeout و قفل خودکار)
- لاگ فعالیت‌های امنیتی
- پشتیبانی از Secure Enclave (در دستگاه‌های پشتیبانی شده)

---

## Business Rules

1. تمام داده‌های مالی حساس باید در دیتابیس رمزنگاری شده ذخیره شوند.
2. قفل اپ باید بعد از هر اجرای اپ یا پریود خالی کاربر فعال شود.
3. تعداد تلاش ناموفق برای قفل اپ محدود است (مثلاً ۵ بار).
4. پس از تعداد مشخصی تلاش ناموفق، داده‌ها به صورت خودکار پاک شوند.
5. رمز عبور یا PIN هرگز در حافظه یا لوگ ذخیره نشوند - فقط هش ذخیره شود.
6. کلیدهای رمزنگاری باید از Secure Enclave یا قابلیت‌های مشابه سیستم عامل استفاده کنند.
7. کپی‌پیست از فیلدهای حساس (مانند شماره حساب، شناسه) محدود شود.
8. تغییر رمز عبور یا PIN باید با تأیید هویت فعلی صورت گیرد.
9. فعال کردن قفل باید باعث قفل شدن فوری شود.
10. تغییرات امنیتی باید در لاگ ذخیره شوند.

---

## Domain Entities

### ۱. Security Settings (جدول: `sec_settings`)

- `id` → UUID یا کلید ثابت
- `lockEnabled` → boolean (آیا قفل اپ فعال است؟)
- `lockTimeoutMinutes` → number (مدت زمان تا قفل خودکار)
- `maxFailedAttempts` → number (حداکثر تلاش ناموفق قبل از پاک‌سازی)
- `biometricEnabled` → boolean (آیا FaceID/TouchID مجاز است؟)
- `pinEnabled` → boolean (آیا PIN مجاز است؟)
- `hasBackup` → boolean (آیا کاربر پشتیبان تهیه کرده؟)
- `createdAt` → datetime
- `updatedAt` → datetime

### ۲. Session Log (جدول: `sec_session_logs`)

- `id` → UUID
- `userId` → string (در نسخه‌های بعدی)
- `type` → string (`login`, `logout`, `locked`, `unlocked`, `failed_attempt`)
- `deviceInfo` → JSON (اطلاعات دستگاه)
- `ipAddress` → string (nullable)
- `timestamp` → datetime
- `success` → boolean

### ۳. Security Audit (جدول: `sec_audits`)

- `id` → UUID
- `action` → string (مثلاً `password_changed`, `biometric_added`)
- `affectedField` → string (کدام فیلد/setting تغییر کرد)
- `oldValue` → JSON (nullable)
- `newValue` → JSON (nullable)
- `timestamp` → datetime
- `ipAddress` → string (nullable)

---

## APIهای داخلی

### Security APIs
- `getSecuritySettings()` → دریافت تنظیمات امنیتی
- `updateSecuritySettings(data)` → بروزرسانی تنظیمات
- `enableLock(type, credential)` → فعال‌سازی قفل با FaceID/TouchID یا PIN
- `disableLock()` → غیرفعال‌سازی قفل
- `verifyLock(credential)` → تأیید هویت کاربر
- `forceLock()` → قفل فوری اپ
- `getFailedAttempts()` → دریافت تعداد تلاش‌های ناموفق
- `resetFailedAttempts()` → ریست کردن تعداد تلاش‌ها

### Encryption APIs
- `encryptData(data, key)` → رمزنگاری داده
- `decryptData(encrypted, key)` → رمزگشایی داده
- `generateKey()` → تولید کلید رمزنگاری جدید
- `getKeyStatus()` → وضعیت کلید رمزنگاری

### Session APIs
- `createSession()` → ایجاد جلسه جدید
- `endSession()` → پایان جلسه
- `checkSession()` → بررسی وضعیت جلسه
- `extendSession()` → تمدید جلسه

---

## روابط با سایر فیچرها

- **Settings & Tools**: تنظیمات امنیتی در Settings انجام می‌شود
- **Accounts & Banking**: رمزنگاری شماره حساب، IBAN و اطلاعات حساس
- **Investment**: رمزنگاری API keys و اطلاعات وام
- **Document Management**: کنترل دسترسی به اسناد حساس
- **Notification**: ارسال هشدارهای امنیتی (تلاش‌های ناموفق)

---

## نکات طراحی

- از IndexedDB با رمزنگاری (مثلاً通过 Dexie.js با رمزنگاری) استفاده شود.
- کلیدهای رمزنگاری در Secure Enclave (در iOS) یا Trusted Execution Environment (در Android) ذخیره شوند.
- پشتیبان از گزینه "حذف تمام داده‌ها در صورت تلاش ناموفق" ارائه شود.
- تغییر رمز عبور/ PIN باید تمام کلیدهای رمزنگاری را re-encrypt کند.
- لاگ‌های امنیتی حتماً به صورت آفلاین و رمزنگاری شده ذخیره شوند.
- در صورت تشخیص دستگاه جدید، تأیید امنیتی اضافی درخواست شود.