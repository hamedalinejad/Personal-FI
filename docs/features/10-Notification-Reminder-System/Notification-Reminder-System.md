# فیچر: Notification & Reminder System (سیستم اعلان و یادآوری)

## توضیح کلی

این فیچر مسئولیت مدیریت تمام **اعلان‌ها** و **یادآوری‌های** سیستم را بر عهده دارد. 
هدف آن آگاه‌سازی کاربر از رویدادهای مهم مالی بدون نیاز به مراجعه مداوم به بخش‌های مختلف نرم‌افزار است.

اعلان‌ها می‌توانند شامل موارد زیر باشند:
- سررسید قبوض و اقساط
- نزدیک شدن به سقف بودجه
- پیشرفت یا عقب‌ماندن از اهداف مالی
- سررسید چک‌ها
- سررسید مالیات‌ها
- یادآوری‌های سفارشی کاربر

سیستم به صورت Offline-first طراحی می‌شود و اعلان‌ها ابتدا درون‌برنامه‌ای هستند. در آینده می‌توان Push Notification نیز اضافه کرد.

---

## User Stories

### Must Have
- دریافت اعلان برای سررسید قبوض و تراکنش‌های تکرارشونده
- دریافت اعلان برای سررسید اقساط وام
- دریافت اعلان برای سررسید چک‌ها
- دریافت اعلان برای سررسید مالیات‌ها
- دریافت هشدار نزدیک شدن به سقف بودجه یا عبور از آن
- مشاهده لیست اعلان‌ها
- علامت‌گذاری اعلان به عنوان خوانده‌شده
- تنظیم تعداد روز قبل از سررسید برای یادآوری

### Should Have
- یادآوری پیشرفت اهداف مالی
- اعلان‌های سفارشی تعریف‌شده توسط کاربر
- تنظیم روشن/خاموش کردن هر نوع اعلان
- حذف اعلان‌های قدیمی
- پشتیبانی از Push Notification (آینده)

---

## Business Rules

1. هر اعلان به یک رویداد مشخص در سیستم مرتبط است.
2. اعلان‌ها می‌توانند از نوع `info`, `warning` یا `critical` باشند.
3. اعلان‌های خوانده‌نشده باید در UI برجسته نمایش داده شوند.
4. کاربر می‌تواند نوع اعلان‌ها را فعال یا غیرفعال کند.
5. یادآوری‌ها چند روز قبل از سررسید (قابل تنظیم) ایجاد می‌شوند.
6. اعلان‌های منقضی‌شده یا قدیمی به صورت خودکار یا دستی قابل پاک‌سازی هستند.
7. سیستم نباید اعلان تکراری برای یک رویداد یکسان ایجاد کند.

---



### P0-077 — category ↔ RelatedFeature mapping table (explicit)

| category (notification) | RelatedFeature(s) | notes |
|-------------------------|-------------------|--------|
| `bills` | `bills` / `recurring` | |
| `loan` | `loan` | |
| `cheque` | `cheque` | |
| `budget` | `budget` | |
| `goals` | `goals` | |
| `tax` | `tax` | |
| `system` | — | no RelatedFeature |
| `custom` | — / user-defined | no default RelatedFeature |

کد نباید `category === relatedFeature` را به‌عنوان قرارداد فرض کند؛ از جدول نگاشت (یا helper `mapCategoryToRelatedFeature`) استفاده شود. مقادیر RelatedFeature ممکن است بیشتر/متفاوت باشند.

## Domain Entities

### ۱. Notification (جدول: `notif_notifications`)

- `id` → UUID (Primary Key)
- `title` → string
- `message` → string
- `type` → string (`info`, `warning`, `critical`)
- `category` → string (`bills`, `loan`, `cheque`, `budget`, `goals`, `tax`, `system`, `custom`) — هماهنگ با مقادیر `RelatedFeature` در `types.md`؛ `system`/`custom` معادل `RelatedFeature` ندارند
- `relatedFeature` → string (نوع `RelatedFeature` — تعریف مرکزی در `core/types/types.md`)

> **نگاشت `category` ↔ `relatedFeature`**: مقادیر `category` عمداً با `RelatedFeature` هماهنگ شده‌اند ولی **equality مستقیم قرارداد نیست (P0-077)** — به‌جز دو استثنا: `system` (اعلان‌های داخلی سیستم) و `custom` (اعلان‌های دستی کاربر) که معادل `RelatedFeature` ندارند و `relatedFeature` آن‌ها `null` است.
- `relatedId` → UUID (شناسه رکورد مرتبط — nullable)
- `dedupeKey` → string (nullable — کلید یکتایی منطقی برای جلوگیری از اعلان تکراری؛ فرمت پیشنهادی: `{category}:{relatedFeature}:{relatedId}:{dueDate-YYYY-MM}`؛ قبل از ساخت اعلان جدید در `generateDueReminders` بررسی می‌شود که اعلان فعالی با همین `dedupeKey` وجود نداشته باشد)
- `isRead` → boolean
- `scheduledAt` → datetime (زمان برنامه‌ریزی‌شده برای نمایش)
- `createdAt` → datetime
- `readAt` → datetime (nullable)

### ۲. Notification Setting (جدول: `notif_settings`)

- `id` → UUID
- `category` → string (`bills`, `loan`, `cheque`, `budget`, `goals`, `tax`, `system`, `custom`) — هماهنگ با مقادیر `RelatedFeature` در `types.md`
- `isEnabled` → boolean
- `daysBefore` → number (مقدار پیش‌فرض سراسری: چند روز قبل از سررسید یادآوری شود؛ برای قبوض/تکرارشونده‌ها (`category='bills'`) این مقدار fallback است و توسط `br_items.reminderDaysBefore` در سطح آیتم override می‌شود اگر آن فیلد non-null باشد)
- `createdAt` → datetime
- `updatedAt` → datetime

### ۳. Custom Reminder (جدول: `notif_custom_reminders`)

- `id` → UUID
- `title` → string
- `message` → string
- `remindAt` → datetime
- `repeatInterval` → string (`none`, `daily`, `weekly`, `monthly` — nullable)
- `isActive` → boolean
- `createdAt` → datetime
- `updatedAt` → datetime

---

## APIهای داخلی

### Notification APIs
- `createNotification(data)` → ایجاد اعلان جدید
- `getAllNotifications(filters)` → فیلتر بر اساس خوانده‌شده، دسته و ...
- `getUnreadNotifications`
- `markAsRead(notifId)`
- `markAllAsRead`
- `deleteNotification(notifId)`
- `clearOldNotifications(beforeDate)`

### Settings APIs
- `getNotificationSettings`
- `updateNotificationSetting(category, data)`
- `toggleCategory(category, enabled)`

### Custom Reminder APIs
- `createCustomReminder(data)`
- `updateCustomReminder(notifReminderId, data)`
- `getActiveCustomReminders`
- `deactivateCustomReminder(notifReminderId)`

### Scheduler APIs
- `generateDueReminders` → بررسی سررسیدها و ایجاد اعلان (Job دوره‌ای)؛ **منطق اولویت `daysBefore`**: برای هر رکورد، ابتدا مقدار سطح‌آیتم بررسی می‌شود (مثلاً `br_items.reminderDaysBefore`)؛ اگر non-null بود از آن استفاده می‌شود، در غیر این صورت از `notif_settings.daysBefore` برای `category` مربوطه به‌عنوان fallback استفاده می‌شود؛ **منطق جلوگیری از تکرار**: قبل از ساخت هر اعلان، `dedupeKey` محاسبه می‌شود؛ **P0-076**: uniqueness روی `dedupeKey` (per event occurrence) در DB است و **مستقل از isRead**. اگر ردیفی با همان dedupeKey وجود داشته باشد (read یا unread)، اعلان جدید ساخته نمی‌شود — در صورت نیاز فقط update فیلدهای غیرهویتی (مثلاً scheduledAt). خواندن اعلان مجوز duplicate نمی‌دهد.
- `checkBudgetAlerts` → بررسی وضعیت بودجه‌ها
- `checkGoalProgress` → بررسی پیشرفت اهداف

---

## روابط با سایر فیچرها

- **Bills & Recurring**: یادآوری سررسید قبوض و تراکنش‌های دوره‌ای
- **Debt & Loan**: یادآوری اقساط وام
- **Cheque Management**: یادآوری سررسید چک‌ها
- **Tax Management**: یادآوری سررسید مالیات‌ها
- **Budget**: هشدار نزدیک شدن به سقف یا عبور از بودجه
- **Financial Goals**: یادآوری پیشرفت یا عقب‌ماندن از هدف
- **Dashboard**: نمایش تعداد اعلان‌های خوانده‌نشده و مهم‌ترین یادآوری‌ها

---

## انواع اعلان‌ها

| دسته | مثال |
|------|------|
| `bills` | «قبوض برق تا ۳ روز دیگر سررسید می‌شود» |
| `loan` | «قسط وام مسکن فردا سررسید دارد» |
| `cheque` | «چک دریافتی به شماره ۱۲۳۴ فردا سررسید است» |
| `tax` | «مالیات عوارض خودرو تا ۵ روز دیگر سررسید دارد» |
| `budget` | «پاکت خوراک به ۸۵٪ سقف خود رسیده است» |
| `goals` | «هدف سفر فقط ۱۵٪ پیشرفت داشته است» |
| `system` | اعلان‌های سیستمی و به‌روزرسانی‌ها |
| `custom` | یادآوری‌های تعریف‌شده توسط کاربر |

---

## سطوح اهمیت

| نوع | کاربرد |
|------|--------|
| `info` | اطلاع‌رسانی عادی |
| `warning` | هشدار (نزدیک شدن به سررسید یا سقف) |
| `critical` | رویداد مهم یا معوق‌شده |

---

## نکات طراحی

- اعلان‌ها باید سبک و غیرمزاحم باشند.
- در حالت Offline، اعلان‌ها به صورت محلی ذخیره و نمایش داده می‌شوند.
- Job دوره‌ای (مثلاً هر چند ساعت یک‌بار) وضعیت سررسیدها را بررسی و اعلان‌های لازم را ایجاد می‌کند؛ **اولویت `daysBefore`**: مقدار سطح‌آیتم (مثلاً `br_items.reminderDaysBefore`) بر مقدار سراسری `notif_settings.daysBefore` اولویت دارد؛ `notif_settings.daysBefore` فقط زمانی استفاده می‌شود که مقدار سطح‌آیتم `null` باشد.
- جلوگیری از تکرار: UNIQUE(dedupeKey) در DB / چک قبل از insert — مستقل از read state (P0-076).
- در آینده می‌توان Push Notification مرورگر و اپ موبایل را اضافه کرد.
- تعداد اعلان‌های خوانده‌نشده باید در Navigation و Dashboard نمایش داده شود.

---

## راهنمای پیاده‌سازی
- فقط local؛ بدون push سرور در v1
- `relatedFeature` + `relatedId` از enum مرکزی
- category با RelatedFeature هم‌نقشه (جدول نگاشت در همین سند)
- مصرف‌کننده: Cheque due، Budget، Loan installment، Bills


## Expiration & retention (CROSS-CUTTING BATCH-2 §6)

- `dedupeKey` schema stable: `{category}:{relatedFeature}:{relatedId}:{eventKind}:{occurrenceKey?}`.
- Optional `expiresAt`; retention/purge policy in settings (does not delete financial audit).
