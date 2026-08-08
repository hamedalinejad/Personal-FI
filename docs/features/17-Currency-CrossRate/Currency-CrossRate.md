# فیچر: Currency & Cross-Rate (ارز و نرخ‌های تبدیل)

## توضیح کلی

این فیچر مسئولیت مدیریت **نرخ‌های تبدیل بین ارزها** را بر عهده دارد.  
سیستم اجازه می‌دهد کاربر یک ارز پایه (مثلاً IRR) و ارز مقصد (مثلاً USDT) را انتخاب کند و نرخ تبدیل لحظه‌ای را دریافت کند.

این فیچر پایه‌ای برای سایر فیچرهاست که به دو ارز نیاز دارند:
- نگهداری مقدار در ارز مبدا (مثلاً IRR)
- محاسبه و نمایش معادل در ارز مقصد (مثلاً USDT)

---

## User Stories

### Must Have
- دریافت نرخ تبدیل لحظه‌ای بین ارزها
- ذخیره نرخ تبدیل لحظه برای تراکنش‌های تاریخی
- انتخاب ارز پیش‌فرض نمایش برای کاربر
- تبدیل خودکار مبالغ در گزارش‌ها و نمایش‌ها
- منابع معتبر نرخ تبدیل (API خارجی یا کش)

### Should Have
- تاریخچه نرخ‌های تبدیل
- مقایسه نرخ لحظه با نرخ میانگین
- هشدار تغییر نرخ‌ها به صورت ناگهانی
- نرخ‌های دستی (برای پیش‌رفت در صورت آفلاین بودن)

---

## Business Rules

1. نرخ تبدیل لحظه باید همیشه نسبت به یک ارز پایه محاسبه شود (معمولاً IRR → USDT یا IRR → USD).
2. نرخ تبدیل برای هر تراکنش باید در لحظه انجام ثبت شود (برای نگهداری ارزش تاریخی).
3. تبدیل از ارز A به B با فرمول: `amountB = amountA / exchangeRateAtoB` (یا `*` برای معکوس) انجام می‌شود.
4. در صورت آفلاین بودن، از آخرین نرخ معتبر استفاده می‌شود.
5. اجازه ندارد نرخ تبدیل صفر یا منفی باشد.
6. تبدیل‌ها فقط با نرخ‌های تاییدشده انجام می‌شوند.

---

## Domain Entities

### ۱. Currency (جدول: `cur_currencies`)

- `id` → UUID (Primary Key)
- `code` → string (ISO code: IRR, USDT, USD, BTC و ...)
- `name` → string (نام کامل: تتر، دلار آمریکا، ریال و ...)
- `symbol` → string (نماد: ₹, $, ₿ و ...)
- `isFiat` → boolean
- `isCrypto` → boolean
- `isActive` → boolean
- `createdAt` → datetime

### ۲. Exchange Rate (جدول: `cur_exchange_rates`)

- `id` → UUID (Primary Key)
- `fromCurrencyCode` → string (مثلاً IRR)
- `toCurrencyCode` → string (مثلاً USDT)
- `rate` → decimal (نرخ تبدیل: ۱ واحد fromCurrency = rate واحد toCurrency)
- `source` → string (api, manual, cached)
- `lastUpdated` → datetime
- `isValid` → boolean
- `createdAt` → datetime

> **نکته توضیحی**: برای نرخ‌های پایه (IRR → USDT)، این فیلد نشان‌دهنده «تتر به ازای ۱ ریال» است (معکوس اصطلاحات رایج بانکی).  
> برای محاسبه: `amountUSDT = amountIRR * rate` (یا `amountIRR = amountUSDT / rate`).

### ۳. User Currency Preference (جدول: `cur_currency_preferences`)

- `id` → UUID
- `userId` → UUID (nullable — برای نسخه‌های آینده با چندکاربری)
- `displayCurrency` → string (ارز نمایشی پیش‌فرض)
- `baseCurrency` → string (ارز پایه برای محاسبات)
- `createdAt` → datetime
- `updatedAt` → datetime

> **نکته**:  
> - در نسخه ۱.۰.۰ اپ تک‌کاربره است و `userId` nullable است  
> - در نسخه‌های آینده (Multi User)، `userId` پر می‌شود  
> - از Blueprint بخش ۱۳: «Multi User (Future)» — بهتر است از ابتدا طراحی آماده باشد

---

## APIهای داخلی

### Currency APIs
- `getCurrencies()` → لیست ارزهای فعال
- `getCurrencyByCode(code)` → دریافت ارز با کد مشخص

### Exchange Rate APIs
- `getExchangeRate(fromCode, toCode)` → دریافت نرخ تبدیل لحظه‌ای
- `saveExchangeRate(fromCode, toCode, rate, source)` → ذخیره نرخ تبدیل
- `getRateHistory(fromCode, toCode, startDate, endDate)` → تاریخچه نرخ

### Utility APIs
- `convert(amount, fromCurrency, toCurrency, exchangeRate)` → تبدیل مبلغ
- `getRatesForCurrency(currencyCode)` → نرخ‌های مرتبط با یک ارز

### Preference APIs
- `getUserCurrencyPreference()` → دریافت تنظیمات نمایش کاربر (برای کاربر جاری یا `userId` مشخص)
- `updateUserCurrencyPreference(userId, displayCurrency, baseCurrency)` → به‌روزرسانی

> نکته: اپ در نسخه ۱.۰.۰ تک‌کاربره است، اما طراحی آماده برای چندکاربری آینده است.

---

## روابط با سایر فیچرها

- **Accounts & Banking**: ذخیره `currency` در Account و `exchangeRateToUSDT` در تراکنش‌ها
- **Income / Expense**: ذخیره `currency` در تراکنش و تبدیل به نرخ لحظه
- **Investment (همه زیر‌فیچرها)**: ذخیره `exchangeRateToUSDT` برای هر تراکنش و محاسبه `totalFeesPaidCurrency`
- **Physical Assets**: ذخیره `currency` و `exchangeRateToUSDT` در خرید و فروش
- **Budget**: نمایش مبالغ در ارز پیش‌فرض کاربر
- **Financial Goals**: نمایش پیشرفت اهداف به ارز پیش‌فرض
- **Reports / Dashboard**: تبدیل مبالغ به ارز نمایشی کاربر با نرخ تاریخی
- **Tax Management**: نمایش مالیات‌ها به ارز پیش‌فرض

---

## منطق تبدیل

```typescript
// pseudo-code
function convert(amount: number, fromCurrency: string, toCurrency: string, rate: number): number {
  if (fromCurrency === toCurrency) return amount;
  
  if (fromCurrency === 'IRR' && toCurrency === 'USDT') {
    return amount * rate; // amountIRR * rate = amountUSDT (rate = USDT per IRR)
  }
  if (fromCurrency === 'USDT' && toCurrency === 'IRR') {
    return amount / rate; // amountUSDT / rate = amountIRR
  }
  
  // برای تبدیل‌های پیچیده‌تر (مثلاً BTC → IRR):
  // 1. BTC → USDT (با نرخ BTC-to-USDT)
  // 2. USDT → IRR (با rate از جدول)
  // یا یک تابع multiStepConvert
}
```

---

## نکات طراحی

- نرخ تبدیل لحظه باید برای هر تراکنش ذخیره شود تا ارزش تاریخی حفظ شود.
- نرخ‌های پایه (مثلاً IRR → USDT) روزانه از API خارجی آپدیت می‌شوند.
- در صورت آفلاین بودن، از کش آخرین نرخ معتبر استفاده می‌شود.
- امکان تنظیم ارز پیش‌فرض نمایش برای کاربر وجود دارد.
- این فیچر به تنهایی تراکنش مالی ایجاد نمی‌کند؛ فقط توابع کمکی ارائه می‌دهد.
- برای کاربران ایرانی، پیش‌فرض IRR → USDT است.