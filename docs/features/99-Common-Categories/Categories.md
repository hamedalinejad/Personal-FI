نام فیچر: Common Categories (دسته‌بندی مشترک)
توضیح کلی:
این فایل لیست استاندارد دسته‌بندی‌های مشترک برای درآمد و هزینه را تعریف می‌کند.

### هدف
جلوگیری از typo و دسته‌های تکراری (مثل «حقوق» / «Salary» / «حقوق ») با معرفی لیست محدود و استاندارد دسته‌ها.

### استراتژی
- لیست دسته‌ها در یک جدول یا enum تعریف شود (بسته به پیاده‌سازی).
- فیچرهای Income و Expense می‌توانند از این لیست استفاده کنند.
- هر دو فیچر می‌توانند از دسته‌های مشترک + دسته‌های اختصاصی (در آینده) استفاده کنند.

---

## لیست دسته‌های استاندارد

### درآمد (Income)
| code | نام فارسی | نام انگلیسی | شرح |
|------|-----------|-------------|-----|
| salary | حقوق و دستمزد | Salary | درآمدهای مربوط به استخدام و استخدام‌های اداری |
| freelance | فریلنس | Freelance | کارهای مستقل و پروژه‌ای |
| business | کسب‌وکار | Business | درآمد از کسب‌وکارهای شخصی |
| investment | سرمایه‌گذاری | Investment | سود سرمایه‌گذاری، سود سپرده و ... |
| rental | اجاره | Rental | اجاره املاک، اجناس و ... |
| gift | هدیه و کمک | Gift | هدیه، کمک مالی و عیدی |
| sale | فروش اموال | Sale | فروش اموال شخصی و اقلام مختلف |
| other | سایر درآمدها | Other | سایر درآمدهای غیرمعتاد |

### هزینه (Expense)
| code | نام فارسی | نام انگلیسی | شرح |
|------|-----------|-------------|-----|
| food | غذا و سوپرمارکت | Food & Groceries | خرید غذا، میوه، نان و ... |
| transport | حمل‌ونقل | Transport | بنزین، اتوبوس، تاکسی، پارکینگ |
| housing | اجاره و مسکن | Housing | اجاره خانه، اسکناس، بارگذاری |
| utilities | قبوض | Utilities | برق، آب، گاز (قبوض شهری خانگی — **نه** اینترنت یا موبایل) |
| healthcare | بهداشت و درمان | Healthcare | دارو، پزشک، بیمه و ... |
| entertainment | تفریح | Entertainment | سینما، تئاتر، رستوران، سفر |
| shopping | خرید | Shopping | لباس، اقلام خانگی، الکترونیک |
| education | آموزش | Education | کلاس، کتاب، دوره و ... |
| communication | ارتباطات | Communication | موبایل، اینترنت، تلفن، اشتراک‌های ارتباطی — **نه** قبوض برق/آب/گاز |
| insurance | بیمه | Insurance | بیمه عمر، سلامت، خودرو و ... |
| tax | مالیات | Tax | مالیات، کسر از حقوق و ... |
| debt | پرداخت بدهی | Debt | پرداخت قسط وام، کارت اعتباری و ... |
| gift | هدیه و اهداء | Gift | اهداء، دیه و ... |
| other | سایر هزینه‌ها | Other | سایر هزینه‌های غیرمعتاد |

---

## پیاده‌سازی پیشنهادی

### روش ۱: جدول جدید (توصیه شده برای آینده)
```sql
CREATE TABLE cat_categories (
 id → UUID (Primary Key)
 type → enum (income, expense)
 code → string (مثلاً salary, food, etc.)
 name_fa → string (نام فارسی)
 name_en → string (نام انگلیسی)
 description → text
 isActive → boolean
 createdAt → datetime,
 UNIQUE(type, code) -- نه UNIQUE(code) به‌تنهایی؛ کد gift هم در income و هم در expense تکرار شده (رجوع به جدول بالا)
);
```

### روش ۲: Enum در کد (ساده برای MVP)
```typescript
// incomeCategories.ts / expenseCategories.ts
export const INCOME_CATEGORIES = {
 salary: 'salary',
 freelance: 'freelance',
 business: 'business',
 investment: 'investment',
 rental: 'rental',
 gift: 'gift',
 sale: 'sale',
 other: 'other',
} as const;

export const EXPENSE_CATEGORIES = {
 food: 'food',
 transport: 'transport',
 housing: 'housing',
 utilities: 'utilities',
 healthcare: 'healthcare',
 entertainment: 'entertainment',
 shopping: 'shopping',
 education: 'education',
 communication: 'communication',
 insurance: 'insurance',
 tax: 'tax',
 debt: 'debt',
 gift: 'gift',
 other: 'other',
} as const;
```

### استفاده در فیچرها
Income و Expense فیلد `category` را یک string محدود به مقادیر لیست در نظر می‌گیرند.

---

## راهنمای پیاده‌سازی
- Income/Expense فقط کلیدهای این سند را بپذیرند (validate در Domain)
- UI از همین لیست برای select پر شود؛ string آزاد در production ممنوع مگر `other` + note
- افزودن دسته جدید = PR روی این فایل + در صورت نیاز i18n
