# نقشه صفحات و معماری اطلاعات (Pages / Information Architecture)

## هدف این سند

طبق تصمیم صریح محصول، اپ **نباید صفحات زیاد و پراکنده** داشته باشد. `Product-Map-FA.md` / `Product-Map-EN.md` بیست فیچر مستقل را توصیف می‌کنند اما هیچ سندی مشخص نکرده این فیچرها چطور در ناوبری واقعی اپ ادغام می‌شوند. این سند آن شکاف را پر می‌کند: نگاشت هر فیچر به یکی از صفحات اصلی، به‌همراه مسیر (route) و sub-routeهای کامل.

---

## اصل طراحی

- حداکثر **۹ صفحه اصلی** در ناوبری پایین/کناری (Bottom/Side Navigation).
- فیچرهای مرتبط از نظر مفهومی، در **یک صفحه با تب یا بخش داخلی** ادغام می‌شوند نه صفحه‌ی جدا.
- صفحات فرعی (فرم ثبت، جزئیات) به‌صورت **Sub-route** یا **Sheet/Modal** زیر همان صفحه قرار می‌گیرند، نه آیتم مستقل در ناوبری.
- هیچ فیچر جدیدی نباید Route مستقل در ناوبری اصلی بگیرد — ابتدا باید در یکی از ۹ صفحه جا شود.

---

## نکته شماره‌گذاری

شماره‌گذاری فیچرها در `Product-Map-FA/EN.md` از ۱ شروع می‌شود، اما شماره پوشه‌ها در `docs/features/` از ۰۰ (اختلاف ۱ واحد). مثلاً فیچر «۱. Accounts» در پوشه `00-Accounts-Banking` است و فیچر «۲. Currency» در پوشه `17-Currency-CrossRate`. این جابجایی‌ها طبیعی هستند — Product-Map مرجع نام و توضیح فیچر است، پوشه‌ها مرجع پیاده‌سازی.

---

## نگاشت صفحات اصلی

| # | صفحه اصلی | Route | فیچرهای ادغام‌شده |
|---|---|---|---|
| ۱ | داشبورد | `/` | ۱۴. Dashboard، ۱۵. Portfolio & Wealth Overview |
| ۲ | حساب‌ها | `/accounts` | ۱. Accounts & Banking، ۵. Cheque Management |
| ۳ | تراکنش‌ها | `/transactions` | ۳. Income، ۴. Expense، ۱۱. Bills & Recurring |
| ۴ | سرمایه‌گذاری | `/investments` | ۷. Investment (Crypto، Stocks Iran، FIF، Metals) + ۲۰. Price Fetching (دکمه داخلی) |
| ۵ | وام و بدهی | `/loans` | ۶. Debt & Loan Management |
| ۶ | دارایی‌های فیزیکی | `/assets` | ۸. Physical Assets |
| ۷ | بودجه و اهداف | `/planning` | ۹. Budget Management، ۱۰. Financial Goals |
| ۸ | گزارش‌ها | `/reports` | ۱۳. Reports & Analytics، ۱۶. Tax Management |
| ۹ | تنظیمات | `/settings` | ۲. Currency & Multi-Currency، ۱۲. Notification، ۱۷. Document Management، ۱۸. Settings & Tools، ۱۹. Security & Privacy، ۲۰. Price Fetching (مدیریت منابع) |

جمع: **۹ صفحه اصلی** برای ۲۰ فیچر.

> **چرا Document Management (فیچر ۱۷) در تنظیمات است نه صفحه مستقل؟**  
> Document Management یک کتابخانه اسناد ضمیمه‌ای است — هر سند همیشه به یک تراکنش، وام، سرمایه‌گذاری یا دارایی دیگری لینک است. کاربر به‌ندرت مستقیماً «به اسناد» می‌رود؛ بیشتر از داخل همان فیچر (مثلاً صفحه جزئیات یک وام) به اسناد مرتبط دسترسی دارد. بخش `/settings/documents` برای مدیریت کلی (حذف، دسته‌بندی، جستجوی سراسری) است.

---

## Sub-routes کامل

### صفحه ۱ — داشبورد (`/`)
```
/                         ← داشبورد اصلی (ویجت‌ها، خلاصه تراکنش‌های اخیر، هشدار بکاپ)
/wealth                   ← Portfolio & Wealth Overview کامل (نمودار Net Worth، همه دارایی‌ها)
```

### صفحه ۲ — حساب‌ها (`/accounts`)
```
/accounts                 ← لیست حساب‌ها + خلاصه چک‌های اخیر
/accounts/:id             ← جزئیات و تراکنش‌های یک حساب
/accounts/:id/edit        ← ویرایش اطلاعات حساب (Sheet)
/accounts/new             ← فرم ثبت حساب جدید (Sheet)
/accounts/transfer        ← فرم انتقال بین حساب‌ها (Sheet)
/accounts/cheques         ← مدیریت کامل چک‌ها (لیست + فیلتر وضعیت)
/accounts/cheques/new     ← فرم ثبت چک جدید (Sheet)
/accounts/cheques/:id     ← جزئیات یک چک
```

### صفحه ۳ — تراکنش‌ها (`/transactions`)
```
/transactions             ← لیست همه تراکنش‌ها (فیلتر: همه / درآمد / هزینه)
/transactions/new         ← فرم ثبت تراکنش جدید (Sheet — نوع اولیه انتخاب می‌شود)
/transactions/new/income  ← فرم ثبت درآمد (Sheet)
/transactions/new/expense ← فرم ثبت هزینه (Sheet)
/transactions/:id         ← جزئیات یک تراکنش
/transactions/recurring   ← مدیریت تراکنش‌های تکرارشونده و قبوض
/transactions/recurring/new  ← فرم تعریف تراکنش تکرارشونده جدید (Sheet)
/transactions/recurring/:id  ← جزئیات و تاریخچه یک آیتم تکرارشونده
```

### صفحه ۴ — سرمایه‌گذاری (`/investments`)
```
/investments                              ← تب پیش‌فرض (آخرین تب انتخاب‌شده)

── تب رمزارز ──
/investments/crypto                       ← لیست صرافی‌ها/والت‌ها + خلاصه پرتفوی
                                             + دکمه «دریافت قیمت» + سوییچ Auto-Sync
/investments/crypto/new-exchange          ← فرم ثبت صرافی/والت جدید (Sheet)
/investments/crypto/:exchangeId           ← جزئیات یک صرافی/والت + لیست هولدینگ‌ها
/investments/crypto/:exchangeId/buy       ← فرم خرید رمزارز (Sheet)
/investments/crypto/:exchangeId/sell      ← فرم فروش رمزارز (Sheet)
/investments/crypto/:exchangeId/deposit   ← فرم واریز نقدی به صرافی (Sheet)
/investments/crypto/:exchangeId/withdraw  ← فرم برداشت نقدی از صرافی (Sheet)

── تب سهام ایران ──
/investments/stocks                       ← لیست کارگزاری‌ها + خلاصه پرتفوی
                                             + دکمه «دریافت قیمت»
/investments/stocks/new-brokerage         ← فرم ثبت کارگزاری جدید (Sheet)
/investments/stocks/:brokerageId          ← جزئیات کارگزاری + لیست سهام
/investments/stocks/:brokerageId/buy      ← فرم خرید سهام (Sheet)
/investments/stocks/:brokerageId/sell     ← فرم فروش سهام (Sheet)
/investments/stocks/:brokerageId/deposit  ← فرم واریز به کارگزاری (Sheet)
/investments/stocks/:brokerageId/withdraw ← فرم برداشت از کارگزاری (Sheet)

── تب صندوق‌ها ──
/investments/fif                          ← لیست صندوق‌ها + خلاصه
/investments/fif/new                      ← فرم تعریف صندوق جدید (Sheet)
/investments/fif/:fundId                  ← جزئیات صندوق + تاریخچه NAV
/investments/fif/:fundId/buy              ← فرم خرید/صدور واحد (Sheet)
/investments/fif/:fundId/sell             ← فرم فروش/ابطال واحد (Sheet)
/investments/fif/:fundId/nav              ← فرم ثبت دستی NAV (Sheet)

── تب فلزات ──
/investments/metals                       ← لیست پلتفرم‌ها + خلاصه پرتفوی
                                             + دکمه «دریافت قیمت»
/investments/metals/new-platform          ← فرم ثبت پلتفرم جدید (Sheet)
/investments/metals/:platformId           ← جزئیات پلتفرم + لیست هولدینگ‌ها
/investments/metals/:platformId/buy       ← فرم خرید فلز (Sheet)
/investments/metals/:platformId/sell      ← فرم فروش فلز (Sheet)
/investments/metals/:platformId/deposit   ← فرم واریز نقدی (Sheet)
/investments/metals/:platformId/withdraw  ← فرم برداشت نقدی (Sheet)
/investments/metals/:platformId/delivery  ← فرم درخواست تحویل فیزیکی (Sheet)
```

> **فیچر ۲۰ (Price Fetching) در این صفحه**: دکمه «دریافت قیمت» و سوییچ «به‌روزرسانی خودکار» فقط به‌صورت کنترل داخل هر تب نمایش داده می‌شوند. هیچ Route مستقلی ندارند.

### صفحه ۵ — وام و بدهی (`/loans`)
```
/loans                    ← لیست همه وام‌ها (فیلتر: وام گرفته / داده، وضعیت)
/loans/new                ← فرم ثبت وام جدید (Sheet)
/loans/:id                ← جزئیات یک وام (جدول اقساط، تاریخچه پرداخت، سود باقیمانده)
/loans/:id/payment        ← فرم ثبت پرداخت قسط (Sheet)
```

### صفحه ۶ — دارایی‌های فیزیکی (`/assets`)
```
/assets                   ← لیست دارایی‌های فیزیکی (خودرو، ملک، تجهیزات و ...)
/assets/new               ← فرم ثبت دارایی جدید (Sheet)
/assets/:id               ← جزئیات یک دارایی (تاریخچه ارزش‌گذاری، اسناد مرتبط)
/assets/:id/valuation     ← فرم ثبت ارزش‌گذاری جدید (Sheet)
```

### صفحه ۷ — بودجه و اهداف (`/planning`)
```
/planning                 ← نمای ترکیبی (خلاصه بودجه ماه جاری + اهداف فعال)
/planning/budget          ← مدیریت پاکت‌های بودجه ماه جاری
/planning/budget/new      ← فرم تعریف بودجه/پاکت جدید (Sheet)
/planning/budget/:id      ← جزئیات یک پاکت (تراکنش‌های مرتبط، باقیمانده)
/planning/goals           ← لیست اهداف مالی (فعال، تکمیل‌شده)
/planning/goals/new       ← فرم تعریف هدف جدید (Sheet)
/planning/goals/:id       ← جزئیات یک هدف (نمودار پیشرفت، تاریخچه واریزها)
/planning/goals/:id/contribute  ← فرم ثبت کمک جدید به هدف (Sheet)
```

### صفحه ۸ — گزارش‌ها (`/reports`)
```
/reports                  ← داشبورد گزارش‌ها (پیش‌تنظیم‌ها + گزارش‌های اخیر)
/reports/cashflow         ← گزارش جریان نقدی (درآمد/هزینه در بازه زمانی)
/reports/networth         ← گزارش Net Worth تاریخی (نمودار روند)
/reports/investments      ← گزارش عملکرد سرمایه‌گذاری‌ها (Realized/Unrealized P&L)
/reports/tax              ← مدیریت مالیات: لیست رکوردهای مالیاتی، گزارش مالیاتی
/reports/tax/new          ← فرم ثبت رکورد مالیاتی جدید (Sheet)
/reports/tax/:id          ← جزئیات یک رکورد مالیاتی
/reports/custom           ← گزارش سفارشی (انتخاب فیلتر + بازه)
```

### صفحه ۹ — تنظیمات (`/settings`)
```
/settings                         ← فهرست بخش‌های تنظیمات
/settings/general                 ← تنظیمات عمومی (زبان، تم، فرمت تاریخ/عدد)
/settings/currency                ← مدیریت ارزها، نرخ تبدیل، ارز پایه (فیچر ۲)
/settings/currency/new-rate       ← فرم ثبت نرخ ارز جدید (Sheet)
/settings/notifications           ← تنظیمات اعلان‌ها (فیچر ۱۲)
/settings/documents               ← کتابخانه اسناد + جستجوی سراسری (فیچر ۱۷)
/settings/documents/:id           ← جزئیات یک سند + فایل پیوست
/settings/security                ← امنیت: PIN، بیومتریک، لاگ نشست‌ها (فیچر ۱۹)
/settings/backup                  ← پشتیبان‌گیری: Export دیتابیس، تاریخچه بکاپ‌ها
/settings/price-sources           ← منابع قیمت + Auto-Sync per-category/symbol (فیچر ۲۰)
/settings/about                   ← درباره اپ: شماره نسخه، «بررسی به‌روزرسانی» (دستی)،
                                     وضعیت `autoVersionCheckEnabled`
```

---

## صفحه‌های خارج از ناوبری اصلی

این صفحات در Bottom/Side Nav ظاهر نمی‌شوند اما در اپ وجود دارند:

| Route | هدف | مستند مرتبط |
|---|---|---|
| `/onboarding` | اولین اجرا: خوشامد + توضیح آفلاین بودن اپ | `db.md` |
| `/onboarding/storage` | درخواست Persistent Storage (`navigator.storage.persist()`) + توضیح ریسک | `db.md` بخش ۲ |
| `/onboarding/backup` | توضیح اهمیت پشتیبان‌گیری دوره‌ای + راهنمای Export (**الزامی** — `db.md` صراحتاً خواسته) | `db.md` بخش ۲ |
| `/onboarding/currency` | انتخاب ارز پایه (`cur_currency_preferences`) | `Currency-CrossRate.md` |
| `/onboarding/accounts` | ثبت اولین حساب بانکی | `Accounts-Banking.md` |
| `/search` | جستجوی سراسری (تراکنش‌ها، دارایی‌ها، اسناد، وام‌ها) | — |
| `*` (not found) | صفحه ۴۰۴ + راهنمای بازگشت | — |

---

## قوانین اجرایی

1. هیچ فیچر جدیدی نباید Route مستقل در ناوبری اصلی بگیرد — ابتدا در یکی از ۹ صفحه موجود جا شود؛ فقط در صورت اثبات قطعی ناممکن‌بودن ادغام، صفحه جدید اضافه می‌شود.
2. همه فرم‌های ثبت (`/new`) در موبایل به‌عنوان **Bottom Sheet** باز می‌شوند، نه صفحه جداگانه؛ فقط برای فرم‌های پیچیده (مثل جدول اقساط وام) می‌توان صفحه تمام‌عرض داشت.
3. هر بار که فیچر جدیدی اضافه می‌شود، این سند **قبل از شروع پیاده‌سازی UI** آپدیت شود.
4. تغییر sub-route نیازی به تصمیم محصولی ندارد؛ تغییر در ستون «صفحه اصلی» جدول بالا نیاز به بحث تیم دارد.
5. هر Sheet/Modal باید یک route داشته باشد (نه state در حافظه) تا Deep Link و بازگشت با دکمه Back مرورگر/موبایل درست کار کند.
