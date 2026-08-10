# core/utils/ — توابع کمکی خالص (Pure Functions)

توابع خالص (Pure Functions) که به React وابسته نیستند و در هر جایی از پروژه قابل استفاده هستند. هیچ Side Effect، State، یا وابستگی به مرورگر در اینجا نباشد.

---

## ساختار پوشه

```bash
utils/
├── date/
│   ├── jalali.ts              # تبدیل تاریخ میلادی ↔ شمسی
│   ├── formatDate.ts          # فرمت‌بندی تاریخ برای نمایش
│   └── relativeTime.ts        # «۲ روز پیش»، «فردا» و ...
├── number/
│   ├── formatNumber.ts        # فرمت اعداد با جداکننده هزار
│   ├── toPersianDigits.ts     # تبدیل ارقام ۰-۹ به ۰-۹ فارسی
│   ├── toEnglishDigits.ts     # تبدیل ارقام فارسی به لاتین
│   └── round.ts               # گرد کردن اعشار (Decimal-safe)
├── money/
│   ├── formatMoney.ts         # فرمت مبلغ با واحد ارز برای نمایش
│   ├── minorUnit.ts           # تبدیل بین Minor Unit و Decimal — مرکز Minor Unit کل پروژه
│   ├── calculateWeightedAverage.ts # میانگین وزنی خرید (Crypto/Stocks/Metals)
│   └── rialToToman.ts         # تبدیل ریال ↔ تومان برای نمایش
├── validation/
│   ├── iban.ts                # اعتبارسنجی شبا (IBAN ایران)
│   ├── cardNumber.ts          # اعتبارسنجی کارت بانکی (Luhn)
│   ├── nationalCode.ts        # اعتبارسنجی کد ملی ایران
│   └── phone.ts               # اعتبارسنجی موبایل ایران
├── string/
│   ├── slugify.ts
│   ├── truncate.ts
│   └── capitalize.ts
├── id/
│   └── generateId.ts          # تولید UUID v4
└── index.ts
```

---

## `money/minorUnit.ts` — مرکز Minor Unit کل پروژه

این فایل مهم‌ترین فایل utils است. **هر تبدیل بین Minor Unit و Decimal در کل پروژه از اینجا عبور می‌کند** — نه از هیچ‌جای دیگر.

```typescript
import Decimal from 'decimal.js';

// تعداد اعشار هر ارز برای تبدیل Minor Unit
const MINOR_UNIT_DECIMALS: Record<string, number> = {
  IRR:  0,  // ریال: بدون اعشار
  USD:  2,  // سنت
  EUR:  2,
  AED:  2,
  GBP:  2,
  TRY:  2,
  USDT: 6,  // میکرو
  BTC:  8,  // ساتوشی
  ETH:  9,  // Gwei
  BNB:  8,
  XRP:  6,
  SOL:  9,
};
const DEFAULT_DECIMALS = 8; // برای رمزارزهای ناشناخته

/**
 * تبدیل مقدار Decimal (ورودی کاربر یا خروجی محاسبه) به Minor Unit (برای ذخیره در DB)
 * مثال: toMinorUnit('1234.56', 'USD') → 123456n
 */
export function toMinorUnit(amount: string | Decimal, currency: string): bigint {
  const decimals = MINOR_UNIT_DECIMALS[currency] ?? DEFAULT_DECIMALS;
  const d = new Decimal(amount);
  return BigInt(d.times(Decimal.pow(10, decimals)).toFixed(0));
}

/**
 * تبدیل Minor Unit (از DB) به Decimal (برای محاسبه و نمایش)
 * مثال: fromMinorUnit(123456n, 'USD') → Decimal('1234.56')
 */
export function fromMinorUnit(minorUnits: bigint | number, currency: string): Decimal {
  const decimals = MINOR_UNIT_DECIMALS[currency] ?? DEFAULT_DECIMALS;
  return new Decimal(minorUnits.toString()).dividedBy(Decimal.pow(10, decimals));
}

/**
 * استثنا: قیمت دارایی‌ها در price_history و نرخ ارز در cur_exchange_rates
 * به Minor Unit تبدیل نمی‌شوند — به‌صورت decimal string خام ذخیره می‌شوند.
 * (مستند در db.md بخش «قانون Minor Unit Storage»)
 * این توابع برای آن‌ها فراخوانی نشود.
 */
```

> **قانون مهم**: هیچ‌جای پروژه نباید `amount * 100` یا `amount / 100` به‌صورت دستی نوشته شود. همیشه از `toMinorUnit` و `fromMinorUnit` استفاده شود تا تعداد اعشار هر ارز در یک‌جا مدیریت شود.

---

## `money/calculateWeightedAverage.ts`

```typescript
import Decimal from 'decimal.js';

/**
 * محاسبه میانگین وزنی خرید — استفاده در Crypto, Stocks Iran, FIF, Metals
 * همه پارامترها Decimal string (نه Minor Unit)
 */
export function calculateWeightedAverage(
  currentQuantity: string,
  currentAvgPrice: string,
  newQuantity: string,
  newPrice: string,
  newFeeInPriceCurrency: string = '0',
): { newAvgPrice: Decimal; newTotalInvested: Decimal; newQuantity: Decimal } {
  const cQ = new Decimal(currentQuantity);
  const cA = new Decimal(currentAvgPrice);
  const nQ = new Decimal(newQuantity);
  const nP = new Decimal(newPrice);
  const fee = new Decimal(newFeeInPriceCurrency);

  const prevInvested = cQ.times(cA);
  const newInvested = nQ.times(nP).plus(fee);
  const totalQty = cQ.plus(nQ);
  const totalInvested = prevInvested.plus(newInvested);
  const avgPrice = totalQty.isZero() ? new Decimal(0) : totalInvested.dividedBy(totalQty);

  return { newAvgPrice: avgPrice, newTotalInvested: totalInvested, newQuantity: totalQty };
}
```

---

## `money/formatMoney.ts`

```typescript
/**
 * فرمت مبلغ برای نمایش — ورودی Minor Unit یا Decimal string (با پرچم isMinorUnit)
 * همیشه از این تابع برای نمایش مبالغ استفاده شود تا فرمت یکدست باشد
 */
export function formatMoney(
  amount: string | number | bigint,
  currency: string,
  options?: {
    isMinorUnit?: boolean;   // اگر true، ابتدا fromMinorUnit اجرا می‌شود
    showCurrency?: boolean;  // پیش‌فرض: true
    locale?: 'fa' | 'en';   // پیش‌فرض: از useAppStore.numberFormat
  }
): string { ... }
```

---

## قوانین

1. تمام توابع باید **Pure** باشند (بدون Side Effect، بدون state، بدون I/O).
2. هیچ وابستگی به React، DOM، یا مرورگر نداشته باشند.
3. باید به راحتی Unit Test شوند (هر تابع با ورودی/خروجی مشخص).
4. **هرگز** `Number()` یا `parseFloat()` برای مبالغ مالی استفاده نشود — فقط `new Decimal(...)`.
5. `toMinorUnit` و `fromMinorUnit` تنها مکانی هستند که تبدیل Minor Unit انجام می‌دهند — نه inline در هیچ فیچری.
