# فیچر: Financial Goals (اهداف مالی)

## توضیح کلی

این فیچر به کاربر امکان می‌دهد اهداف مالی مشخصی تعریف کند و پیشرفت آن‌ها را پیگیری کند. 
اهداف می‌توانند شامل پس‌انداز برای خرید خانه، سفر، اضطراری، بازنشستگی، خرید خودرو یا هر هدف شخصی دیگر باشند.

هر هدف دارای مبلغ هدف، تاریخ هدف (اختیاری) و پیشرفت فعلی است. 
کاربر می‌تواند به صورت دستی یا خودکار (از طریق بودجه یا درآمد) به هدف پول اختصاص دهد.

---

## User Stories

### Must Have
- تعریف هدف مالی جدید (نام، مبلغ هدف، تاریخ هدف)
- اختصاص مبلغ به هدف
- مشاهده پیشرفت هر هدف (درصد و مبلغ باقی‌مانده)
- ویرایش و تکمیل هدف
- مشاهده لیست اهداف فعال و تکمیل‌شده
- محاسبه مبلغ پیشنهادی ماهانه برای رسیدن به هدف در موعد مقرر

### Should Have
- اولویت‌بندی اهداف
- اتصال هدف به پاکت بودجه
- یادآوری پیشرفت یا عقب‌ماندن از برنامه
- تصویر یا آیکون برای هر هدف
- هدف‌های تکراری (مثلاً پس‌انداز ماهانه اضطراری)

---

## Business Rules

1. هر هدف دارای یک مبلغ هدف (`targetAmount`) است.
2. پیشرفت هدف بر اساس مجموع مبالغ اختصاص‌داده‌شده محاسبه می‌شود.
3. هدف می‌تواند تاریخ پایان داشته باشد یا بدون مهلت باشد.
4. هنگام رسیدن مبلغ اختصاص‌داده‌شده به مبلغ هدف، وضعیت به `completed` تغییر می‌کند.
5. امکان برداشت از هدف (کاهش مبلغ اختصاص‌داده‌شده) وجود دارد. **برداشت بسته به `source` کمک‌های مربوطه متفاوت است:** اگر کمک‌ها از نوع `manual`/`transfer` بودند، تراکنش بانکی واقعی ایجاد می‌شود؛ اگر از نوع `budget`/`income` بودند (برچسب‌گذاری بدون پول واقعی)، فقط `currentAmount` کاهش می‌یابد و هیچ تراکنش بانکی ایجاد نمی‌شود — به API `withdrawFromGoal` مراجعه شود.
6. پول اختصاص‌داده‌شده به هدف می‌تواند از حساب بانکی یا از پاکت بودجه تأمین شود.
7. حذف فیزیکی وجود ندارد — فقط تغییر وضعیت (`active`, `completed`, `cancelled`, `paused`).
8. `currentAmount` نمی‌تواند منفی شود.
9. `currentAmount` می‌تواند بیشتر از `targetAmount` شود (مثلاً اگر کاربر پس‌انداز بیشتری کند یا عوامل خارجی ارزش را افزایش دهند).
10. وقتی `source=budget` (انتقال از پاکت به هدف)، پول واقعاً بین حساب‌ها جابه‌جا نمی‌شود؛ `accountTransactionId` باید `null` بماند (فقط یک برچسب‌گذاری داخلی است).
10a. وقتی `source=income` (اختصاص بخشی از یک درآمد ثبت‌شده به هدف)، این نیز مانند `source=budget` صرفاً یک **برچسب‌گذاری داخلی** است، نه جابه‌جایی پول جدید: مبلغ درآمد از قبل طی تراکنش اصلی در `acc_transactions`/`inc_transactions` به حساب بانکی واریز شده؛ اختصاص آن به هدف فقط یک `fg_contributions` با `source='income'` و `accountTransactionId = null` ایجاد می‌کند (بدون رکورد جدید در `acc_transactions`). ایجاد یک تراکنش بانکی واقعی جداگانه برای این حالت **ممنوع است**، چون باعث دوبار شمارش همان مبلغ درآمد (یک‌بار در واریز اصلی، یک‌بار در تخصیص به هدف) می‌شود. تنها `source`هایی که مجازند `accountTransactionId` واقعی داشته باشند `manual` و `transfer` هستند (پول واقعاً و مستقیماً به‌خاطر همین هدف جابه‌جا می‌شود).
11. `currentAmount` در `fg_goals` یک فیلد **snapshot** است که باید همیشه با مجموع `fg_contributions.amount` همخوانی داشته باشد:
 - وقتی `addContribution` صدا زده می‌شود، `currentAmount` به صورت atomic (در یک transaction) آپدیت می‌شود
 - وقتی `withdrawFromGoal` صدا زده می‌شود، `currentAmount` به صورت atomic (در یک transaction) کاهش می‌یابد
 - برای جلوگیری از out-of-sync، آپدیت `currentAmount` همیشه با اضافه شدن/حذف `fg_contributions` در یک transaction انجام می‌شود

---

## Domain Entities

### ۱. Financial Goal (جدول: `fg_goals`)

- `id` → UUID (Primary Key)
- `name` → string (نام هدف — مثلاً «پیش‌پرداخت خانه»)
- `description` → string
- `targetAmount` → decimal (مبلغ هدف — ریال)
- `currentAmount` → decimal (مبلغ جمع‌شده تا این لحظه)
- `currency` → string (پیش‌فرض IRR)
- `targetDate` → datetime (تاریخ هدف — nullable)
- `startDate` → datetime
- `status` → string (`active`, `completed`, `cancelled`, `paused`)
- `priority` → number (اولویت — عدد بالاتر = مهم‌تر)
- `category` → string (`emergency`, `purchase`, `travel`, `retirement`, `debt`, `education`, `other`)
- `icon` → string (اختیاری)
- `color` → string (اختیاری)
- `accountId` → UUID (حساب مرتبط برای واریز/برداشت — nullable)
- `envelopeId` → UUID (پاکت بودجه مرتبط — nullable)
- `exchangeRateToBase` → decimal (نرخ تبدیل ارز تراکنش → `baseCurrency` کاربر در لحظه ثبت (؛ نه الزاماً ریال/تتر — قرارداد کامل در `Currency-CrossRate.md`))
- `createdAt` → datetime
- `updatedAt` → datetime

### ۲. Goal Contribution (جدول: `fg_contributions`)

- `id` → UUID
- `goalId` → UUID
- `amount` → decimal
- `type` → string (`deposit`, `withdraw`)
- `source` → string (`manual`, `budget`, `income`, `transfer`)
- `accountId` → UUID (nullable)
- `accountTransactionId` → UUID (لینک به `acc_transactions` — nullable)
- `envelopeId` → UUID (nullable)
- `note` → string
- `date` → datetime
- `exchangeRateToBase` → decimal (نرخ تبدیل ارز تراکنش → `baseCurrency` کاربر در لحظه ثبت (؛ نه الزاماً ریال/تتر — قرارداد کامل در `Currency-CrossRate.md`))
- `createdAt` → datetime

---

## منطق پیشرفت هدف

**درصد پیشرفت** = `(currentAmount / targetAmount) × 100` 
**مبلغ باقی‌مانده** = `targetAmount - currentAmount`

اگر `targetDate` مشخص باشد:
- **ماه‌های باقی‌مانده** = تعداد ماه تا `targetDate`
- **مبلغ پیشنهادی ماهانه** = `مبلغ باقی‌مانده ÷ ماه‌های باقی‌مانده`

---

## دسته‌بندی‌های پیشنهادی اهداف

| دسته | مثال |
|------|------|
| `emergency` | صندوق اضطراری |
| `purchase` | خرید خودرو، لوازم خانه |
| `travel` | سفر خارجی یا داخلی |
| `retirement` | بازنشستگی |
| `debt` | تسویه بدهی یا وام |
| `education` | هزینه تحصیل |
| `other` | سایر اهداف شخصی |

---

## APIهای داخلی

### Goal APIs
- `createGoal(data)` → ایجاد هدف جدید
- `updateGoal(id, data)` → شامل `currentAmount`, `targetAmount`, `status`
- `getAllGoals(filters)` → فیلتر بر اساس وضعیت، دسته و ...
- `getGoalById(id)` → شامل محاسبه `progressPercentage` و `remainingAmount`
- `changeGoalStatus(id, status)` → تغییر وضعیت
- `getActiveGoals` → اهداف فعال
- `getCompletedGoals` → اهداف تکمیل‌شده

### Contribution APIs
- `addContribution(goalId, amount, source, accountId?, envelopeId?)` → واریز به هدف + آپدیت `currentAmount` در `fg_goals` (atomic)
- `withdrawFromGoal(goalId, amount, accountId?)` → برداشت از هدف + آپدیت `currentAmount` در `fg_goals` (atomic)؛ منطق اجرا بسته به ترکیب کمک‌های موجود (FIFO روی `fg_contributions` با `type='deposit'`):
 - اگر مبلغ برداشت از کمک‌های `source ∈ {manual, transfer}` تأمین شود: یک رکورد `fg_contributions` با `type='withdraw'` و یک تراکنش واقعی در `acc_transactions` برای `accountId` می‌سازد.
 - اگر مبلغ برداشت از کمک‌های `source ∈ {budget, income}` تأمین شود (برچسب‌گذاری بدون پول واقعی): فقط یک رکورد `fg_contributions` با `type='withdraw'` و `accountTransactionId = null` می‌سازد — بدون تراکنش بانکی (پول هرگز از حساب واقعی خارج نشده بود). اگر `accountId` پاس داده شود در این حالت، **خطای اعتبارسنجی** برمی‌گرداند.
 - اگر مبلغ از هر دو نوع کمک تأمین شود: بخش «واقعی» تراکنش بانکی می‌گیرد، بخش «برچسب» `accountTransactionId = null` می‌ماند — دو رکورد جداگانه در `fg_contributions` ثبت می‌شود.
- `getContributions(goalId)` → تاریخچه کمک‌ها
- `getGoalProgress(goalId)` → درصد پیشرفت + مبلغ باقی‌مانده

> **نکته مهم - مکانیزم sync `currentAmount`**: 
> - `currentAmount` در `fg_goals` یک فیلد **snapshot** است که باید همیشه با مجموع `fg_contributions.amount` همخوانی داشته باشد 
> - وقتی `addContribution` یا `withdrawFromGoal` صدا زده می‌شود، تغییر `currentAmount` **atomic** انجام می‌شود (در یک transaction با `fg_contributions` اضافه شدن) 
> - فرمول: `currentAmount = SUM(amount WHERE type='deposit') - SUM(amount WHERE type='withdraw')` 
> - این تصمیم یکسان با `cashBalance` در `inv_stocks_iran_brokerages` و `inv_metals_platforms` است 
> - برای جلوگیری از out-of-sync، آپدیت `currentAmount` همیشه با اضافه شدن `fg_contributions` در یک transaction انجام می‌شود

### Calculation APIs
- `calculateMonthlySuggestion(goalId)` → مبلغ پیشنهادی ماهانه برای رسیدن به هدف تا تاریخ مشخص
- `getGoalsSummary` → خلاصه کل اهداف (تعداد، مجموع هدف، مجموع جمع‌شده)

---

## روابط با سایر فیچرها

- **Accounts & Banking**: واریز و برداشت واقعی پول مرتبط با هدف (فقط برای `source=manual` و `transfer`؛ `income` و `budget` برچسب‌گذاری داخلی هستند بدون تراکنش بانکی جدید — به قاعده ۱۰a مراجعه شود)
- **Budget**: امکان اتصال هدف به یک پاکت بودجه و تخصیص خودکار (برای `source=budget`، `accountTransactionId = null`)
- **Income**: می‌توان بخشی از یک درآمد ثبت‌شده را به هدف اختصاص داد (`source=income`، `accountTransactionId = null` — طبق قاعده ۱۰a، بدون تراکنش بانکی جدید)
- **Notification & Reminder**: یادآوری پیشرفت یا عقب‌ماندن از برنامه
- **Dashboard**: نمایش اهداف فعال و درصد پیشرفت
- **Reports**: گزارش تحقق اهداف در بازه‌های زمانی

---

## نکات طراحی

- هدف می‌تواند بدون تاریخ پایان باشد (مثلاً صندوق اضطراری بلندمدت).
- پس از تکمیل هدف، کاربر می‌تواند آن را بایگانی کند یا پول را به حساب دیگری منتقل کند.
- در Dashboard بهتر است ۲ تا ۳ هدف اولویت‌دار با نوار پیشرفت نمایش داده شوند.
- نرخ تتر در زمان ایجاد هدف و هر واریز/برداشت ذخیره می‌شود تا ارزش تاریخی هدف قابل محاسبه باشد.
- امکان تعریف هدف به صورت درصدی از درآمد ماهانه در نسخه‌های بعدی قابل اضافه شدن است.
- وقتی انتقال از `budget` یا `income` انجام می‌شود، فقط لینک (`envelopeId`/تراکنش درآمد) و `goalId` ثبت می‌شوند و تراکنش بانکی جدیدی ایجاد نمی‌شود.