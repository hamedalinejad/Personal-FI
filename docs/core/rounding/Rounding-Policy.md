# Rounding Policy (سیاست گرد کردن اعداد)

## چرا این سند وجود دارد — Severity: Critical

اگر هر فیچر rounding را مستقل تعریف کند (یا مستند نشده رها شود)، نتیجه اجتناب‌ناپذیر است:

- جمع قسط‌های وام ≠ مبلغ اصل + سود کل
- جمع کارمزدهای رمزارز در گزارش ≠ مجموع کارمزدهای ثبت‌شده
- ارزش پرتفوی محاسبه‌شده در داشبورد ≠ ارزش محاسبه‌شده در گزارش
- اختلاف چند ریال یا چند Satoshi در هر تراکنش که در بلندمدت تجمیع می‌شود

**این یک باگ Cross-Cutting است:** هر تابع محاسباتی که rounding خودش را داشته باشد، خروجی سیستم را eventually inconsistent می‌کند.

---

## اصل اساسی: رفتار Decimal.js

همه محاسبات مالی از `decimal.js` استفاده می‌کنند. تمام rounding در این سند با متدهای همین کتابخانه بیان شده:

| نام | decimal.js | توضیح |
|-----|-----------|-------|
| **ROUND_HALF_UP** | `Decimal.ROUND_HALF_UP` | ۰.۵ به بالا → استاندارد حسابداری ایران |
| **ROUND_HALF_EVEN** | `Decimal.ROUND_HALF_EVEN` | ۰.۵ به نزدیک‌ترین زوج → IEEE 754، کاهش bias |
| **ROUND_DOWN (Floor)** | `Decimal.ROUND_DOWN` | کاهش به سمت صفر |
| **ROUND_UP (Ceil)** | `Decimal.ROUND_UP` | افزایش به سمت دور از صفر |

پیش‌فرض سراسری `decimal.js` در پروژه این است:
```typescript
// lib/dayjs.ts یا lib/constants.ts — یک بار در کل پروژه
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });
```
این پیش‌فرض فقط برای عملیاتی است که rounding صریح ندارند. همه توابع مهم باید rounding را **صریح** پاس دهند.

---

## جدول مرجع سریع

| زمینه | روش | دقت ذخیره | دقت نمایش | دلیل |
|-------|-----|-----------|-----------|------|
| مبلغ تراکنش (IRR) | ROUND_HALF_UP | Minor Unit (integer) | ۰ اعشار | ریال جزء ندارد |
| مبلغ تراکنش (USD/EUR) | ROUND_HALF_UP | Minor Unit (integer) | ۲ اعشار | سنت = کوچک‌ترین واحد |
| مبلغ تراکنش (USDT) | ROUND_HALF_UP | Minor Unit (integer, 6 decimal) | ۲–۶ اعشار | بسته به مبلغ |
| کارمزد تراکنش | ROUND_HALF_UP | همان ارز کارمزد | = ارز | کارمزد هزینه واقعی است |
| قسط وام (calculatedInstallment) | ROUND_HALF_UP | ۰ اعشار IRR | ۰ اعشار | پرداخت با ریال صحیح |
| بخش اصل قسط (principalPortion) | ROUND_DOWN | ۰ اعشار IRR | ۰ اعشار | محافظت از وام‌دهنده |
| بخش سود قسط (interestPortion) | `installment − principal` | ۰ اعشار IRR | ۰ اعشار | باقی‌مانده — بدون round مستقل |
| آخرین قسط وام | مبلغ دقیق remainingBalance | — | ۰ اعشار | تسویه کامل |
| جریمه دیرکرد (penalty) | ROUND_HALF_UP | ۰ اعشار IRR | ۰ اعشار | هزینه واقعی |
| کارمزد صدور/پیش‌پرداخت (fee) | ROUND_HALF_UP | ۰ اعشار IRR | ۰ اعشار | هزینه واقعی |
| Weighted Average خرید (crypto/stock/metal) | بدون round — کامل | ۱۸ اعشار داخلی | ۸ اعشار نمایش | round اینجا خطا تجمیع می‌شود |
| تعداد/مقدار رمزارز (quantity) | بدون round — کامل | ۸ اعشار (Satoshi-like) | ۸ اعشار | round موجودی → اختلاف حسابداری |
| Unrealized P&L | ROUND_HALF_UP | ۲ اعشار در ارز نمایش | ۲ اعشار | فقط برای نمایش |
| Realized P&L | ROUND_HALF_UP | ۰ اعشار IRR / ۲ USDT | ۲ اعشار | برای ثبت در لاگ |
| NAV صندوق | ROUND_HALF_UP | ۲ اعشار IRR | ۲ اعشار | اعلام رسمی صندوق معمولاً ۲ اعشار |
| قیمت سهام ایران | ROUND_HALF_UP | ۰ اعشار IRR | ۰ اعشار | بورس ایران قیمت صحیح اعلام می‌کند |
| قیمت رمزارز (price_history) | بدون round | ۸ اعشار | ۲–۸ بسته به مبلغ | ذخیره کامل، round فقط در نمایش |
| قیمت فلزات (per gram) | ROUND_HALF_UP | ۰ اعشار IRR | ۰ اعشار | بازار داخلی ریال صحیح |
| نرخ ارز (exchangeRateToBase) | بدون round | ۸ اعشار | ۲–۴ اعشار | ذخیره کامل، round در نمایش |
| تبدیل ارز (convert) | ROUND_HALF_UP آخر | ۲–۸ اعشار | = ارز مقصد | فقط نتیجه نهایی round می‌شود |
| مالیات | ROUND_HALF_UP | ۰ اعشار IRR | ۰ اعشار | پرداخت ریالی صحیح |
| درصد پیشرفت هدف / بودجه | ROUND_HALF_UP | ۱ اعشار | ۱ اعشار | نمایش درصد |
| تخصیص بودجه (assignedAmount) | ROUND_HALF_UP | ۰ اعشار IRR | ۰ اعشار | پرداخت با ریال صحیح |
| ارزش خالص دارایی (Net Worth) | ROUND_HALF_UP | ۰ اعشار IRR / ۲ USDT | ۰ / ۲ | گزارش نهایی |

---

## قوانین ثابت

### قانون ۱ — Round فقط در آخرین لایه

محاسبات میانی **هرگز** round نمی‌شوند. Round فقط در لحظه‌ای اتفاق می‌افتد که عدد برای یکی از این سه هدف استفاده می‌شود:
- **ذخیره در دیتابیس** (Minor Unit یا decimal)
- **نمایش به کاربر** (فرمت‌بندی)
- **ثبت در لاگ حسابداری** (acc_transactions، ln_transactions و ...)

```typescript
// ✅ درست — round فقط در لحظه ذخیره
const interest = remainingBalance.times(r);         // کامل
const principal = installment.minus(interest);       // کامل
const principalToStore = principal.toDecimalPlaces(0, Decimal.ROUND_DOWN); // فقط اینجا

// ❌ غلط — round در میانه محاسبه
const interest = remainingBalance.times(r).toFixed(0); // بعد از این principal اشتباه است
const principal = installment - interest;               // خطای float + round bias
```

### قانون ۲ — اصل + سود = قسط (Installment Integrity)

برای هر قسط وام، این رابطه باید برقرار بماند:
```
principalPortion + interestPortion = installmentAmount (مبلغ واقعی پرداخت‌شده)
```

روش تضمین این رابطه:
```typescript
const interestPortion = remainingBalance.times(r)
  .toDecimalPlaces(0, Decimal.ROUND_HALF_UP);  // سود را round کن
const principalPortion = installmentAmount.minus(interestPortion); // اصل = باقیمانده
// principalPortion هرگز مستقل round نمی‌شود — مگر در آخرین قسط (تسویه کامل)
```

**استثنا — آخرین قسط**: در آخرین قسط، `principalPortion = remainingBalance` (دقیق، بدون round) و `installmentAmount = principalPortion + interestPortion` می‌شود (مقدار نهایی ممکن است کمی کمتر/بیشتر از اقساط قبلی باشد — این صحیح و مورد انتظار است).

### قانون ۳ — Quantity رمزارز هرگز Round نمی‌شود (تا لحظه نمایش)

```typescript
// ✅ درست
holding.quantity = holding.quantity.plus(trx.quantity); // Decimal کامل
displayQty = holding.quantity.toDecimalPlaces(8);        // فقط برای نمایش

// ❌ غلط
holding.quantity = parseFloat(holding.quantity + trx.quantity); // float + loss
```

دلیل: یک تراکنش BTC با ۸ اعشار روی میلیون‌ها ساتوشی؛ هر round میانی در quantity باعث اختلاف تجمیعی در موجودی می‌شود که برگشت‌ناپذیر است.

### قانون ۴ — Weighted Average هرگز Round نمی‌شود (داخلی)

```typescript
// ✅ درست — averageBuyPrice با precision کامل ذخیره می‌شود
averageBuyPrice = totalInvested.dividedBy(totalQuantity); // بدون .toDecimalPlaces()

// ❌ غلط
averageBuyPrice = (totalInvested / totalQuantity).toFixed(4); // بعد از چند ضرب خطا جمع می‌شود
```

`averageBuyPrice` در دیتابیس به‌صورت string با precision کامل ذخیره می‌شود. Round فقط در لحظه نمایش (مثلاً ۲ اعشار USDT برای BTC، ۰ اعشار IRR برای سهام ایران).

### قانون ۵ — تبدیل ارز: فقط نتیجه نهایی Round می‌شود

```typescript
// ✅ درست
function convertForDisplay(amount: Decimal, from: string, to: string): Decimal {
  const rate = getRate(from, to);                           // بدون round
  const result = amount.dividedBy(rate);                    // بدون round
  return result.toDecimalPlaces(displayDecimals(to), Decimal.ROUND_HALF_UP); // فقط اینجا
}

// برای ذخیره در exchangeRateToBase (snapshot):
const rateSnapshot = rate; // بدون round — کامل ذخیره می‌شود
```

### قانون ۶ — Minor Unit: Round پیش از تبدیل، نه بعد

```typescript
// ✅ درست — ابتدا round به واحد پولی، بعد تبدیل به Minor Unit
const amountDecimal = new Decimal('1234.567');
const rounded = amountDecimal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP); // ۱۲۳۴.۵۷
const minorUnit = toMinorUnit(rounded, 'USD'); // ۱۲۳۴۵۷ سنت

// ❌ غلط — تبدیل اول، round بعد (ممکن است رفتار متفاوت در edge case)
const minorUnit = toMinorUnit(amountDecimal, 'USD');        // ۱۲۳۴۵۶ (floor)
```

---

## رفتار Round به ازای هر دامنه

### وام (Debt & Loan)

```typescript
// محاسبه قسط Declining Balance
const r = new Decimal(annualRate).dividedBy(1200);          // نرخ ماهانه — کامل
const n = totalInstallments;
const P = new Decimal(principalAmount);

// ۱. مبلغ قسط — ROUND_HALF_UP به ۰ اعشار IRR
const rawInstallment = P.times(r.times(r.plus(1).pow(n)))
                        .dividedBy(r.plus(1).pow(n).minus(1));
const installment = rawInstallment.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
// ← این مقدار در ln_loans.calculatedInstallment ذخیره می‌شود

// ۲. هر قسط — سود را round کن، اصل = باقیمانده
const interest = remainingBalance.times(r)
  .toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
const principal = installment.minus(interest);              // نه round مستقل

// ۳. آخرین قسط — تسویه کامل
const lastPrincipal = remainingBalance;                     // دقیق
const lastInstallment = lastPrincipal.plus(interest);       // ممکن است ≠ installment
```

### کریپتو (Crypto)

```typescript
// خرید: quantity کامل ذخیره می‌شود
const quantity = new Decimal(rawQuantity);                  // هرگز round نشود

// Weighted Average: کامل ذخیره می‌شود
const newAvg = totalInvested.dividedBy(totalQty);           // هرگز round نشود
// → ذخیره به‌صورت string در inv_crypto_holdings.averageBuyPrice

// Unrealized P&L — فقط برای نمایش
const unrealized = currentPrice.minus(averageBuyPrice).times(quantity);
const unrealizedDisplay = unrealized.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

// کارمزد رمزارز — تبدیل به USDT برای totalFeesPaidUSDT
const feeInUSDT = feeAmount.times(feeAssetPriceToUSDT);    // کامل در محاسبه
// totalFeesPaidUSDT = Σ feeInUSDT — با ROUND_HALF_UP آخر
```

### سهام ایران (Stocks Iran)

```typescript
// قیمت سهام — ۰ اعشار IRR (بورس ایران قیمت صحیح اعلام می‌کند)
const price = new Decimal(rawPrice).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);

// تعداد سهم — ۰ اعشار (سهم جزء ندارد)
const quantity = new Decimal(rawQty).toDecimalPlaces(0, Decimal.ROUND_DOWN);
// ROUND_DOWN برای تعداد سهم چون نمی‌توان کسری از سهم خرید/فروخت

// Weighted Average — کامل ذخیره
const avgPrice = totalInvested.dividedBy(totalQty);         // هرگز round نشود
```

### صندوق درآمد ثابت (FIF)

```typescript
// NAV — معمولاً ۲ اعشار، اما از مقدار اعلامی صندوق پیروی می‌شود
// اگر صندوق ۰ اعشار اعلام کند، همان ۰ اعشار ذخیره شود
const nav = new Decimal(announcedNAV);                      // دقیقاً همان‌طور که صندوق اعلام کرده
// → ذخیره بدون تغییر در price_history.price

// تعداد واحد — ۴ اعشار (بازار صدور/ابطال معمولاً ۴ رقم اعشار)
const units = new Decimal(rawUnits).toDecimalPlaces(4, Decimal.ROUND_DOWN);
// ROUND_DOWN: تعداد واحد صادر/ابطال‌شده رسمی معمولاً به نفع صندوق گرد می‌شود

// ارزش کل — NAV × تعداد واحد
const totalValue = nav.times(units);                        // کامل در محاسبه
const totalValueDisplay = totalValue.toDecimalPlaces(0, Decimal.ROUND_HALF_UP); // فقط نمایش
```

### فلزات (Metals)

```typescript
// قیمت گرمی — ۰ اعشار IRR
const pricePerGram = new Decimal(rawPrice).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);

// مقدار — ۳ اعشار (میلی‌گرم → گرم برای نمایش)
// ذخیره در دیتابیس: میلی‌گرم (integer) — طبق قانون Minor Unit فلزات
// نمایش: fromMinorUnit(mg, 'gram') با ۳ اعشار
const displayGrams = fromMinorUnit(quantityMg, 'gram').toDecimalPlaces(3);

// Weighted Average — کامل ذخیره
const avgBuyPrice = totalInvested.dividedBy(totalGrams);    // هرگز round نشود
```

### تبدیل ارز (Currency)

```typescript
// Snapshot در تراکنش — کامل ذخیره (بدون round)
const rateSnapshot = await getExchangeRate('IRR', 'USDT'); // e.g. 62345.678901234
// → ذخیره در exchangeRateToBase: "62345.678901234"

// تبدیل برای نمایش — round در آخر
function displayInUSDT(amountIRR: Decimal, rate: Decimal): string {
  return amountIRR.dividedBy(rate)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toString();
}

// تبدیل زنجیره‌ای (BTC → USDT → IRR) — round فقط در انتهای زنجیره
const btcInUSDT = btcAmount.times(btcPriceUSDT);           // کامل
const btcInIRR  = btcInUSDT.times(usdtRateIRR);            // کامل
const display   = btcInIRR.toDecimalPlaces(0, Decimal.ROUND_HALF_UP); // فقط اینجا
```

### مالیات (Tax)

```typescript
// مبلغ مالیات — ROUND_HALF_UP به ۰ اعشار IRR
const taxAmount = rawTaxAmount.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
// همان‌طور که کاربر/سازمان مالیاتی اعلام می‌کند — معمولاً ریال صحیح

// جریمه دیرکرد مالیات (مشابه وام)
const penalty = overdueAmount
  .times(penaltyRate).dividedBy(100)
  .times(new Decimal(days).dividedBy(365))
  .toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
```

### بودجه (Budget)

```typescript
// مبلغ تخصیص — ROUND_HALF_UP به ۰ اعشار IRR
// remainingAmount محاسبه‌ای است — بدون round در دیتابیس
const remaining = assignedAmount.plus(rolloverAmount).minus(spentAmount); // کامل
// نمایش:
const remainingDisplay = remaining.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);

// درصد مصرف — ۱ اعشار
const percentUsed = spentAmount.dividedBy(assignedAmount).times(100)
  .toDecimalPlaces(1, Decimal.ROUND_HALF_UP);
```

---

## دقت ذخیره در دیتابیس

| داده | نوع SQLite | توضیح |
|------|-----------|-------|
| مبالغ تراکنش (IRR) | INTEGER | Minor Unit = ریال |
| مبالغ تراکنش (USD/EUR/USDT) | INTEGER | Minor Unit = سنت/میکرو |
| quantity رمزارز | TEXT | string اعشاری کامل — هرگز REAL/FLOAT |
| averageBuyPrice | TEXT | string اعشاری کامل |
| exchangeRateToBase | TEXT | string اعشاری کامل |
| قیمت در price_history | TEXT | string اعشاری کامل |
| NAV صندوق | TEXT | دقیقاً آن‌چه صندوق اعلام کرده |
| قیمت سهام ایران | INTEGER | ریال صحیح |
| مقدار فلز | INTEGER | میلی‌گرم (Minor Unit) |
| درصد نرخ سود وام | TEXT | e.g. "18.5" — string |
| calculatedInstallment | INTEGER | ریال صحیح |
| principalPortion, interestPortion | INTEGER | ریال صحیح |

> **چرا TEXT برای اعداد اعشاری؟** SQLite نوع REAL را به‌صورت IEEE 754 double-precision float ذخیره می‌کند که برای مقادیر مالی دقیق نیست. ذخیره به‌صورت TEXT + parse با `decimal.js` در لایه Domain، دقت کامل را تضمین می‌کند.

---

## لایه پیاده‌سازی: `utils/money/round.ts`

```typescript
import Decimal from 'decimal.js';

/**
 * Round به تعداد اعشار مشخص با روش مشخص.
 * این تنها تابع مجاز برای round کردن مبالغ مالی در کل پروژه است.
 * هر تابع محاسباتی که نیاز به round دارد، فقط از این تابع استفاده کند.
 */
export function roundMoney(
  amount: Decimal,
  decimals: number,
  mode: Decimal.Rounding = Decimal.ROUND_HALF_UP,
): Decimal {
  return amount.toDecimalPlaces(decimals, mode);
}

/** تعداد اعشار نمایشی استاندارد برای هر ارز */
export const DISPLAY_DECIMALS: Record<string, number> = {
  IRR:  0,
  IRT:  0,   // تومان
  USD:  2,
  EUR:  2,
  AED:  2,
  GBP:  2,
  USDT: 2,
  BTC:  8,
  ETH:  6,
  BNB:  4,
  XRP:  4,
  SOL:  4,
};
export const DEFAULT_DISPLAY_DECIMALS = 4;

/** Round برای نمایش به کاربر */
export function roundForDisplay(amount: Decimal, currency: string): Decimal {
  const d = DISPLAY_DECIMALS[currency] ?? DEFAULT_DISPLAY_DECIMALS;
  return roundMoney(amount, d, Decimal.ROUND_HALF_UP);
}

/** Round برای ذخیره مبلغ تراکنش (همیشه HALF_UP، به واحد پولی) */
export function roundForStorage(amount: Decimal, currency: string): Decimal {
  // برای ارزهایی که به Minor Unit ذخیره می‌شوند، این فقط round اعشار اضافه را حذف می‌کند
  // تبدیل واقعی به Minor Unit از طریق utils/money/minorUnit.ts انجام می‌شود
  const d = DISPLAY_DECIMALS[currency] ?? 2;
  return roundMoney(amount, d, Decimal.ROUND_HALF_UP);
}

/** ذخیره کامل (بدون round) — برای quantity، averageBuyPrice، exchangeRate */
export function preserveFull(amount: Decimal): string {
  return amount.toFixed(); // بدون تغییر، به‌صورت string
}
```

---

## قوانین برای Code Review

هر PR که شامل محاسبات مالی است باید این چک‌لیست را رد کند:

- [ ] آیا هیچ `parseFloat`، `toFixed` یا `Math.round` در کد وجود دارد؟ → **ممنوع**
- [ ] آیا `quantity` رمزارز در طول محاسبه round شده؟ → **ممنوع**
- [ ] آیا `averageBuyPrice` یا `exchangeRateToBase` با precision کمتر از ۸ اعشار ذخیره می‌شوند؟ → **ممنوع**
- [ ] آیا round در میانه محاسبه زنجیره‌ای انجام شده؟ → **ممنوع (فقط در آخر)**
- [ ] آیا `principalPortion + interestPortion = installmentAmount` برقرار است؟ → **الزامی**
- [ ] آیا تمام round ها از `roundMoney()` استفاده می‌کنند؟ → **الزامی**
- [ ] آیا دلیل انتخاب `ROUND_DOWN` (تعداد سهم/واحد صندوق) مستند است؟ → **الزامی**

---

## روابط با سایر اسناد

- `core/utils/utils.md` → `money/round.ts` از این Policy پیروی می‌کند
- `core/db/db.md` → نوع TEXT برای اعشار مالی (بخش «قانون Minor Unit Storage»)
- `features/04-Debt-Loan-Management` → فرمول‌های قسط از این Policy استفاده می‌کنند
- `features/05-Investment/*` → Weighted Average و quantity از قوانین ۳ و ۴ پیروی می‌کنند
- `features/17-Currency-CrossRate` → round فقط در نتیجه نهایی `convert()`
