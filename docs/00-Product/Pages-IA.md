# Pages & Information Architecture

> **اصل محصول:** `20 Features ≠ 20 Navigation Items`  
> **۹ صفحه اصلی کافی است** — حتی در آینده: Crypto/Stocks/Funds/Tax/Bills/Cheque **صفحه ناوبار جدا نمی‌شوند**؛ Feature/Domain + Tab/Sheet.  
> Feature = مرز Domain · Page = مرز UX · Accounting Core = capability بدون صفحه `/accounting`

## ناوبری هدف (حداکثر ~۹)

```text
Dashboard · Accounts · Transactions · Investments · Loans · Assets · Planning · Reports · Settings
```

- **Transactions:** All / Income / Expense / Transfer / Cheque / Adjustment (فیلتر) — نه صفحه جدا برای هر کدام
- **Investments:** Crypto / Stocks / Funds / Metals + عملیات در **Sheet/Drawer**
- Income/Expense/Tax/Bills/… = Feature و فیلتر/شیت، نه آیتم ناوبار جدا

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
/ ← داشبورد اصلی (ویجت‌ها، خلاصه تراکنش‌های اخیر، هشدار بکاپ)
/ (بخش/تب Wealth · Net Worth) ← Portfolio & Wealth Overview کامل — **نه route سطح‌اول جدا**
```

### صفحه ۲ — حساب‌ها (`/accounts`)
```
/accounts ← لیست حساب‌ها + خلاصه چک‌های اخیر
/accounts/:id ← جزئیات و تراکنش‌های یک حساب
/accounts/:id/edit ← ویرایش اطلاعات حساب (Sheet)
/accounts/new ← فرم ثبت حساب جدید (Sheet)
/accounts/transfer ← فرم انتقال بین حساب‌ها (Sheet)
/accounts/cheques ← مدیریت کامل چک‌ها (لیست + فیلتر وضعیت)
/accounts/cheques/new ← فرم ثبت چک جدید (Sheet)
/accounts/cheques/:id ← جزئیات یک چک
```

### صفحه ۳ — تراکنش‌ها (`/transactions`)
```
/transactions ← لیست همه تراکنش‌ها (فیلتر: همه / درآمد / هزینه)
/transactions/new ← فرم ثبت تراکنش جدید (Sheet — نوع اولیه انتخاب می‌شود)
/transactions/new/income ← فرم ثبت درآمد (Sheet)
/transactions/new/expense ← فرم ثبت هزینه (Sheet)
/transactions/:id ← جزئیات یک تراکنش (دکمه «اصلاح» — نه ویرایش مستقیم)
/transactions/:id/correct ← Sheet اصلاح: Reversal خودکار + فرم تراکنش جدید اصلاح‌شده
/transactions/recurring ← مدیریت تراکنش‌های تکرارشونده و قبوض
/transactions/recurring/new ← فرم تعریف تراکنش تکرارشونده جدید (Sheet)
/transactions/recurring/:id ← جزئیات و تاریخچه یک آیتم تکرارشونده
```

### صفحه ۴ — سرمایه‌گذاری (`/investments`)

> **قفل UI (P0):** Investments **یک Shell واحد** است.
> تب‌ها / state داخلی: Overview · Crypto · Stocks · Funds · Metals
> مسیرهایی مثل `/investments/crypto` فقط **Tab/State** هستند، نه صفحه مستقل ناوبری.
> Add Transaction / Edit / View Details / Corporate Action = **Drawer · Modal · Sheet · Side Panel** — نه ده‌ها route صفحه جدا.

```
/investments ← تب پیش‌فرض (آخرین تب انتخاب‌شده)

── تب رمزارز ──
/investments/crypto ← لیست صرافی‌ها/والت‌ها + خلاصه پرتفوی
 + دکمه «دریافت قیمت» + سوییچ Auto-Sync
/investments/crypto/new-exchange ← فرم ثبت صرافی/والت جدید (Sheet)
/investments/crypto/:exchangeId ← جزئیات یک صرافی/والت + لیست هولدینگ‌ها
/investments/crypto/:exchangeId/buy ← فرم خرید رمزارز (Sheet)
/investments/crypto/:exchangeId/sell ← فرم فروش رمزارز (Sheet)
/investments/crypto/:exchangeId/deposit ← فرم واریز نقدی به صرافی (Sheet)
/investments/crypto/:exchangeId/withdraw ← فرم برداشت نقدی از صرافی (Sheet)
/investments/crypto/:exchangeId/tx/:txId/correct ← Sheet اصلاح تراکنش کریپتو

── تب سهام ایران ──
/investments/stocks ← لیست کارگزاری‌ها + خلاصه پرتفوی
 + دکمه «دریافت قیمت»
/investments/stocks/new-brokerage ← فرم ثبت کارگزاری جدید (Sheet)
/investments/stocks/:brokerageId ← جزئیات کارگزاری + لیست سهام
/investments/stocks/:brokerageId/buy ← فرم خرید سهام (Sheet)
/investments/stocks/:brokerageId/sell ← فرم فروش سهام (Sheet)
/investments/stocks/:brokerageId/deposit ← فرم واریز به کارگزاری (Sheet)
/investments/stocks/:brokerageId/withdraw ← فرم برداشت از کارگزاری (Sheet)
/investments/stocks/:brokerageId/tx/:txId/correct ← Sheet اصلاح تراکنش سهام

── تب صندوق‌ها ──
/investments/fif ← لیست صندوق‌ها + خلاصه
/investments/fif/new ← فرم تعریف صندوق جدید (Sheet)
/investments/fif/:fundId ← جزئیات صندوق + تاریخچه NAV
/investments/fif/:fundId/buy ← فرم خرید/صدور واحد (Sheet)
/investments/fif/:fundId/sell ← فرم فروش/ابطال واحد (Sheet)
/investments/fif/:fundId/nav ← فرم ثبت دستی NAV (Sheet)
 + دکمه «دریافت NAV» (فقط برای صندوق‌هایی که price_sources اختصاصی دارند)
 + سوییچ Auto-Sync per-fund
/investments/fif/:fundId/tx/:txId/correct ← Sheet اصلاح تراکنش صندوق

── تب فلزات ──
/investments/metals ← لیست پلتفرم‌ها + خلاصه پرتفوی
 + دکمه «دریافت قیمت»
/investments/metals/new-platform ← فرم ثبت پلتفرم جدید (Sheet)
/investments/metals/:platformId ← جزئیات پلتفرم + لیست هولدینگ‌ها
/investments/metals/:platformId/buy ← فرم خرید فلز (Sheet)
/investments/metals/:platformId/sell ← فرم فروش فلز (Sheet)
/investments/metals/:platformId/deposit ← فرم واریز نقدی (Sheet)
/investments/metals/:platformId/withdraw ← فرم برداشت نقدی (Sheet)
/investments/metals/:platformId/delivery ← فرم درخواست تحویل فیزیکی (Sheet)
/investments/metals/:platformId/tx/:txId/correct ← Sheet اصلاح تراکنش فلزات
```

> **فیچر ۲۰ (Price Fetching) در این صفحه**: دکمه «دریافت قیمت» و سوییچ «به‌روزرسانی خودکار» فقط به‌صورت کنترل داخل هر تب نمایش داده می‌شوند. هیچ Route مستقلی ندارند.

> **الگوی اصلاح تراکنش (Immutable Correction Pattern)**: هیچ تراکنش مالی‌ای پس از ثبت با UPDATE مستقیم ویرایش نمی‌شود (طبق اصل Immutable Transactions در Blueprint). در صفحه جزئیات هر تراکنش، به‌جای دکمه «ویرایش» یک دکمه **«اصلاح»** نمایش داده می‌شود. کلیک روی آن یک Sheet باز می‌کند که به‌طور خودکار: (۱) یک تراکنش Reversal برای لغو تراکنش اصلی ایجاد می‌کند و (۲) فرم ثبت تراکنش جدید را با مقادیر پیش‌پر از تراکنش اصلی نمایش می‌دهد. این الگو در همه route‌های `/:id/correct` یکسان است.

### صفحه ۵ — وام و بدهی (`/loans`)
```
/loans ← لیست همه وام‌ها (فیلتر: وام گرفته / داده، وضعیت)
/loans/new ← فرم ثبت وام جدید (Sheet)
/loans/:id ← جزئیات یک وام (جدول اقساط، تاریخچه پرداخت، سود باقیمانده)
/loans/:id/payment ← فرم ثبت پرداخت قسط (Sheet)
/loans/:id/correct ← Sheet اصلاح پرداخت: Reversal + ثبت پرداخت جدید
```

### صفحه ۶ — دارایی‌های فیزیکی (`/assets`)
```
/assets ← لیست دارایی‌های فیزیکی (خودرو، ملک، تجهیزات و ...)
/assets/new ← فرم ثبت دارایی جدید (Sheet)
/assets/:id ← جزئیات یک دارایی (تاریخچه ارزش‌گذاری، اسناد مرتبط)
/assets/:id/valuation ← فرم ثبت ارزش‌گذاری جدید (Sheet)
/assets/:id/correct ← Sheet اصلاح رویداد دارایی: Reversal + ثبت جدید
```

### صفحه ۷ — بودجه و اهداف (`/planning`)
```
/planning ← نمای ترکیبی (خلاصه بودجه ماه جاری + اهداف فعال)
/planning/budget ← مدیریت پاکت‌های بودجه ماه جاری
/planning/budget/new ← فرم تعریف بودجه/پاکت جدید (Sheet)
/planning/budget/:id ← جزئیات یک پاکت (تراکنش‌های مرتبط، باقیمانده)
/planning/goals ← لیست اهداف مالی (فعال، تکمیل‌شده)
/planning/goals/new ← فرم تعریف هدف جدید (Sheet)
/planning/goals/:id ← جزئیات یک هدف (نمودار پیشرفت، تاریخچه واریزها)
/planning/goals/:id/contribute ← فرم ثبت کمک جدید به هدف (Sheet)
```

### صفحه ۸ — گزارش‌ها (`/reports`)
```
/reports ← داشبورد گزارش‌ها (پیش‌تنظیم‌ها + گزارش‌های اخیر)
/reports/cashflow ← گزارش جریان نقدی (درآمد/هزینه در بازه زمانی)
/reports/networth ← گزارش Net Worth تاریخی (نمودار روند)
/reports/investments ← گزارش عملکرد سرمایه‌گذاری‌ها (Realized/Unrealized P&L)
/reports/tax ← مدیریت مالیات: لیست رکوردهای مالیاتی، گزارش مالیاتی
/reports/tax/new ← فرم ثبت رکورد مالیاتی جدید (Sheet)
/reports/tax/:id ← جزئیات یک رکورد مالیاتی
/reports/custom ← گزارش سفارشی (انتخاب فیلتر + بازه)
```

### صفحه ۹ — تنظیمات (`/settings`)
```
/settings ← فهرست بخش‌های تنظیمات
/settings/general ← تنظیمات عمومی (زبان، تم، فرمت تاریخ/عدد)
/settings/currency ← مدیریت ارزها، نرخ تبدیل، ارز پایه (فیچر ۲)
/settings/currency/new-rate ← فرم ثبت نرخ ارز جدید (Sheet)
/settings/notifications ← تنظیمات اعلان‌ها (فیچر ۱۲)
/settings/documents ← کتابخانه اسناد + جستجوی سراسری (فیچر ۱۷)
/settings/documents/:id ← جزئیات یک سند + فایل پیوست
/settings/security ← امنیت: PIN، بیومتریک، لاگ نشست‌ها (فیچر ۱۹)
/settings/backup ← پشتیبان‌گیری: Export دیتابیس، تاریخچه بکاپ‌ها
/settings/price-sources ← منابع قیمت + Auto-Sync per-category/symbol (فیچر ۲۰)
/settings/about ← درباره اپ: شماره نسخه، «بررسی به‌روزرسانی» (دستی)،
 وضعیت `autoVersionCheckEnabled`
```

---

## صفحه‌های خارج از ناوبری اصلی

این صفحات در Bottom/Side Nav ظاهر نمی‌شوند اما در اپ وجود دارند:

| Route | هدف | مستند مرتبط |
|---|---|---|
| `/onboarding` | اولین اجرا: خوشامد + توضیح آفلاین بودن اپ | `db.md` |
| `/onboarding/storage` | درخواست Persistent Storage (`navigator.storage.persist`) + توضیح ریسک | `db.md` بخش ۲ |
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

---

## Domain زیاد، صفحه کم

تعداد **Feature/Domain** زیاد است (Accounts, Income, Expense, Cheque, Loans, Investment, Assets, Budget, Goals, Bills, Notifications, Reports, Dashboard, Portfolio, Tax, Documents, Settings, Currency, Security, Price Fetching، …). این برای modularity خوب است.

### قانون طلایی محصول
**هر Domain ≠ یک صفحه Navigation.**

الگوی تأییدشده:
| Domain | محل UI |
|--------|--------|
| Price Fetching | کنترل داخل `/investments` + `/settings` — **بدون route ناوبری** |
| Tax | زیر `/reports/tax` |
| Documents | از داخل فیچرها + `/settings/documents` |
| Currency | Settings / هنگام تراکنش |
| Security | Settings |
| Notifications | سیستم + بخش‌های مرتبط، نه لزوماً تب اصلی جدا |
| Portfolio | Dashboard و/یا تب گزارش/سرمایه‌گذاری |

### قوانین
1. فیچر جدید اول باید در یکی از **۹ صفحه اصلی** جا شود (طبق جدول بالا).
2. فقط با اثبات قطعی نیاز محصولی، صفحه ناوبری جدید اضافه می‌شود.
3. Implementation: پوشه `features/*` می‌تواند زیاد باشد؛ `Pages-IA` و ناوبری باید کم بمانند.
4. Internal API و Domain جدا از IA صفحات است — زیاد شدن Domain به معنی زیاد شدن منو نیست.

---

## پیچیدگی Route در برابر Navigation

۹ صفحه ناوبری حفظ می‌شود، ولی انفجار sub-route/sheet می‌تواند همان پیچیدگی را پنهان کند.

### قوانین ساده‌سازی
1. **پیش‌فرض فرم‌ها**: یک Sheet/Modal جنریک با `mode` به‌جای route جدا برای هر عمل کوچک (`/buy`, `/sell`, `/nav` وقتی فرم‌ها شبیه هستند).
2. Deep link فقط برای entity جزئیات (`/:id`) و گزارش‌های مهم؛ نه برای هر دکمه.
3. هر sub-route جدید در PR باید توجیه کند چرا Sheet از روی همان صفحه کافی نبود.
4. شمارش هدف v1: زیر‌مسیرهای پایدار (bookmarkپذیر) محدود؛ بقیه state محلی UI.

---

## Route در برابر UI State

فهرست‌های طولانی شبیه:

```text
/investments/crypto/:exchangeId/buy
/investments/crypto/:exchangeId/sell
...
```

**نقشه‌ی مفهومی عمل‌ها** هستند، نه الزام به یک React page/route component per URL.

### قرارداد implementation
1. **Route واقعی (bookmarkپذیر)** فقط:
 - ۹ صفحه اصلی
 - جزئیات entity مهم: `/investments/crypto/:exchangeId`, `/investments/stocks/:symbol` یا `:holdingId`, …
 - چند گزارش کلیدی زیر `/reports/...`
2. **اعمال buy/sell/deposit/withdraw/nav/...** → **یک Sheet جنریک** با state:
 `{ assetClass, action, entityId }` از همان صفحه جزئیات — نه لزوماً path جدا در router.
3. اگر deep-link برای فرم لازم شد، query مجاز است: 
 `/investments/crypto/:id?action=buy` به‌جای ده‌ها path ثابت.
4. PR که path جدید در `react-router` اضافه می‌کند باید توجیه کند چرا query/state کافی نبود.
5. هدف: **کم‌صفحه‌بودن در UI و در درخت route** — نه فقط در Bottom Nav.

این بخش بر اولویت اجرایی می‌دهد: Sheets بیش از nested routes.

### الگوی Sheet جنریک سرمایه‌گذاری

یک کامپوننت مثلاً `InvestmentActionSheet` با props:

```ts
{ assetClass: 'crypto'|'stock'|'fif'|'metal', action: 'buy'|'sell'|..., entityId: string }
```

Route واقعی: `/investments/crypto/:exchangeId` + `?action=buy` اختیاری.  
از ساخت `pages/crypto/buy.tsx` جدا برای هر عمل خودداری شود مگر deep-link اجباری محصول.

---

## قرارداد سخت Route سرمایه‌گذاری (کم‌شلوغی)

### Routeهای واقعی مجاز (bookmark / deep-link)
```text
/investments
/investments/crypto
/investments/crypto/:exchangeId
/investments/stocks
/investments/stocks/:brokerageId
/investments/fif
/investments/fif/:fundId
/investments/metals
/investments/metals/:platformId
```
حداکثر: لیست کلاس دارایی + **یک** سطح detail.

### ممنوع به‌عنوان React Route جدا
```text
.../buy, .../sell, .../deposit, .../withdraw, .../correct, .../new-*
```
این‌ها فقط:
- **Sheet / Drawer / Dialog** روی detail، یا
- query روی detail: `?action=buy|sell|deposit|withdraw|correct|new`

پیاده‌سازی مرجع: `InvestmentActionSheet` با `{ assetClass, action, entityId }`.

اگر در کد `path` جدید زیر investments اضافه شود بدون توجیه deep-link قانونی، با این قرارداد در تضاد است.

---

## Core UI: InvestmentActionSheet Contract

مسیر پیشنهادی: `core/ui/InvestmentActionSheet` (یا `components/investment/`) — **یک** implementation مشترک.

```ts
type InvestmentAssetClass = 'crypto' | 'stock' | 'fif' | 'metal';
type InvestmentAction = 'buy' | 'sell' | 'deposit' | 'withdraw' | 'correct' | 'transfer' | 'dividend' | 'nav' | 'new';

interface InvestmentActionSheetProps {
  assetClass: InvestmentAssetClass;
  action: InvestmentAction;
  entityId: string; // exchangeId | brokerageId | fundId | platformId
  open: boolean;
  onClose: () => void;
  // اختیاری: prefill
}
```

### قوانین
1. چهار دامنه crypto/stocks/fif/metals **فرم کامل جدا** برای همان action ننویسند؛ فقط **strategy/adapter** کوچک برای فیلدهای خاص دامنه.
2. Submit → فقط **Public Feature API** همان دامنه (`executeBuy`, …) نه SQL.
3. بعد از موفقیت: بستن sheet + invalidate queries لیست/detail.
4. `correct` داخل همین pattern با flow void+reversal طبق Domain.

تکرار چهار صفحه Buy = نقض این قرارداد.

---

## Ownership: Price Fetching

| سطح | مالک |
|------|------|
| Domain/API/tables | Feature **19-Price-Fetching** (یک implementation) |
| دکمه دریافت قیمت در Investments | UI shell فقط صدا زدن همان Public API |
| مدیریت sources در Settings | UI shell همان API |

**ممنوع:** سه ماژول جدا برای fetch در Investment / Settings / Feature20.
Sub-routes investment: فقط list+detail؛ actions = Sheet (قبلاً قرارداد شد).

---

## Transactions = صفحه مرکزی تجربه

یک صفحه **Transactions** همه رویدادها را از **Feature APIs** می‌خواند (نه DB جدا):

Income · Expense · Transfer · Loan · Cheque · Investment · Asset · Fee · Tax · Adjustment

فیلتر: Date, Account, Category, Party, Currency, Feature, Amount

### Feature بدون آیتم ناوبار
Cheque, Bills, Tax, Notifications, Documents, Currency, Price → داخل Transactions / Settings / Investments — **صفحه ناوبار جدا نه**.

---

## ۹ صفحه اصلی (قفل UX)

```text
1 Dashboard
2 Accounts
3 Transactions
4 Investments
5 Loans
6 Assets
7 Planning
8 Reports
9 Settings
```

**قفل‌های مرتبط:**
- `/wealth` = بخش/تب داخل **Dashboard** یا **Reports > Net Worth** — صفحه دهم نیست.
- Investments = یک Shell با تب‌های Overview / Crypto / Stocks / Funds / Metals.
- عملیات سرمایه‌گذاری و تراکنش = Sheet / Drawer / Modal / Side Panel.


**20 Feature ≠ 20 Navigation.**  
Buy / Sell / Deposit / Withdraw / Loan Payment / New Income / … = **Sheet / Dialog / Drawer** — نه route جدا برای هر عمل.

Sub-routeهای گزارش (`/reports/cashflow` و …) ترجیحاً tab/filter داخل همان صفحه Reports باشند نه navigation سطح اول.

## Standalone Capable Feature ≠ Standalone Ledger

| لایه | قانون |
|------|--------|
| **UI Feature** | می‌تواند به‌تنهایی فعال باشد (فقط Loans، فقط Crypto، فقط FIF) و تمام جریان همان دامنه را پوشش دهد بدون اینکه کاربر Accounting بشناسد |
| **Ledger Architecture** | یکپارچه می‌ماند: Feature → Financial Core → Journal projection |

```text
Standalone UI  ≠  isolated database / isolated accounting
```

فعال بودن UI Accounting اختیاری است؛ ساخت journal پشت صحنه اجباری است وقتی رویداد مالی رخ می‌دهد.


---

## Feature Availability + Navigation Visibility (P0)

۹ صفحهٔ اصلی سقف ناوبری کامل است — **نه** اینکه همه همیشه روشن باشند.

دو مفهوم جدا:

| مفهوم | معنی |
|--------|------|
| **Feature Availability** | آیا Domain/API/Ledger آن فیچر در edition/license فعال است؟ |
| **Navigation Visibility** | آیا آیتم ناوبری در UI نشان داده می‌شود؟ |

```text
Feature Availability  (edition / license / user enable)
        +
Navigation Visibility (derived from availability + user prefs)
```

مثال:

- فقط Loans فعال → ناوبری می‌تواند فقط `Loans` + `Settings` (+ در صورت نیاز Dashboard خلاصه) نشان دهد.
- فقط Funds → `Investments` (فقط تب Funds) + `Settings`.
- Full → هر ۹ صفحه.

**Invariant:** Installed/Enabled یک مفهوم **معماری** است (feature flags + module registry)، نه فقط مخفی‌کردن دکمه در UI.

Routeهای غیرفعال نباید load شوند؛ API فیچر خاموش reject می‌کند.

---

## یادآوری نقشه ۹ صفحه (ثابت)

```text
Dashboard · Accounts · Transactions · Investments · Loans · Assets · Planning · Reports · Settings
```

- **Cheque** فیچر است نه صفحه دهم — زیر Accounts و/یا Transactions (تب/فیلتر/Sheet)
- **Income/Expense** صفحه جدا نیستند — زیر Transactions
- Investment = یک Shell با تب Crypto/Stock/Fund/Metals

فیچر ≠ صفحه. Product-Map می‌تواند ۱۹+ فیچر داشته باشد؛ ناوبری حداکثر ۹.
