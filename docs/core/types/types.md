# core/types/ — TypeScript Types و Interfaces مشترک

TypeScript Types و Interfaces مشترکی که در کل پروژه استفاده می‌شوند. Types اختصاصی یک فیچر داخل همان فیچر تعریف می‌شوند.

---

## ساختار پوشه

```bash
types/
├── common.ts              # انواع پایه (UUID, Timestamp, DateRange, ...)
├── currency.ts            # CurrencyCode، ExchangeRate
├── transaction.ts         # TransactionType، RelatedFeature
├── price.ts               # AssetCategory، PriceFetchResult (برای Price Fetching)
├── portfolio.ts           # PortfolioBreakdown (ساختار typed برای port_snapshots.breakdown)
├── report.ts              # ReportFilters (ساختار typed برای rep_presets.filters)
├── precision.ts           # Precision/Scale مرکزی برای Money/Quantity/Price/Rate/Percentage/NAV
├── events.ts              # AppEvent (Event Bus)
└── index.ts               # re-export مرکزی
```

---

## `common.ts`

```typescript
export type UUID = string;
export type Timestamp = string; // ISO 8601 UTC

export interface DateRange {
  from: Timestamp;
  to: Timestamp;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## `currency.ts`

```typescript
// ارزهای فیات پشتیبانی‌شده
export type FiatCurrencyCode = 'IRR' | 'USD' | 'EUR' | 'AED' | 'GBP' | 'TRY';

// ارزهای دیجیتال پشتیبانی‌شده (نمادهای رایج — لیست قابل گسترش است)
export type CryptoCurrencyCode = 'BTC' | 'ETH' | 'USDT' | 'BNB' | 'XRP' | 'SOL' | string;
// نکته: string& برای باز بودن لیست — هر نماد رمزارز جدیدی قابل قبول است

// ارز پایه پشتیبانی‌شده برای ذخیره قیمت در price_history
export type PriceCurrency = FiatCurrencyCode | CryptoCurrencyCode;

// اتحادیه کامل (برای فیلدهایی که هر نوع ارزی را می‌پذیرند)
export type CurrencyCode = FiatCurrencyCode | CryptoCurrencyCode;

export interface ExchangeRate {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number; // ذخیره به‌صورت decimal (نه Minor Unit — استثنای مستند در db.md)
  timestamp: Timestamp;
}
```

> **چرا `USDT` در `CryptoCurrencyCode` است نه `FiatCurrencyCode`؟**  
> USDT از نظر فنی یک Stablecoin رمزارز است، نه ارز فیات — حتی اگر به دلار پگ باشد. در این پروژه همه تراکنش‌های کریپتو (از جمله موجودی ریال/تتر صرافی) از طریق `priceCurrency='USDT'` یا `priceCurrency='IRR'` در `price_history` کار می‌کنند. این تفکیک با تعریف فیچر `Investment-Crypto` سازگار است.

---

## `transaction.ts`

```typescript
// تنها enum معتبر برای فیلد type در acc_transactions
// هر مقدار جدید باید اینجا اضافه شود، نه در فایل فیچر
export type TransactionType =
  | 'deposit-income'
  | 'withdrawal-expense'
  | 'transfer-in'
  | 'transfer-out'
  | 'deposit-loan'
  | 'withdrawal-loan'
  | 'withdrawal-expense-tax'
  | 'deposit-income-tax'
  | 'withdrawal-cheque'
  | 'deposit-cheque'
  | 'deposit-investment'
  | 'withdrawal-investment';

// نکته: deposit-budget و withdrawal-budget عمداً حذف شده‌اند.
// انتقال از پاکت بودجه به هدف (source=budget) هیچ تراکنش بانکی واقعی نمی‌سازد
// و accountTransactionId همیشه null می‌ماند (طبق Financial-Goals.md Business Rules #10).

// تنها enum معتبر برای فیلد relatedFeature در همه جداول پروژه
// (acc_transactions, docs_documents, docs_links, notif_notifications, tax_records, ...)
// هیچ فایل دیگری نباید مقادیر ناسازگار یا «investment» مبهم تعریف کند
export type RelatedFeature =
  | 'income'
  | 'expense'
  | 'cheque'
  | 'loan'
  | 'crypto_exchange'
  | 'stocks_iran'
  | 'fif'
  | 'metals'
  | 'physical_assets'
  | 'budget'
  | 'tax'
  | 'goals';
```

---

## `price.ts`

```typescript
// دسته‌بندی دارایی در price_history و price_sources
export type AssetCategory = 'crypto' | 'stock' | 'fif' | 'metal';

// خروجی عملیات دریافت قیمت از API
export interface PriceFetchResult {
  succeeded: { symbol: string; price: string }[]; // string برای Decimal-safe
  failed: { symbol: string; reason: string }[];
  skipped?: { reason: 'offline' };
  fetchedAt: Timestamp;
  triggeredBy: 'user_click' | 'auto_sync';
}

// آخرین قیمت کش‌شده یک نماد
export interface CachedPrice {
  symbol: string;
  assetCategory: AssetCategory;
  price: string; // decimal string — نه number
  priceCurrency: PriceCurrency;
  source: 'manual' | 'api';
  isManualOverride: boolean; // اگر true، قیمت‌های API جدیدتر نادیده گرفته می‌شوند تا Override لغو شود
  fetchedAt: Timestamp;
  isStale: boolean; // اگر بیش از یک حد مشخص (مثلاً ۲۴ ساعت) از fetchedAt گذشته باشد
}
```

---

## `portfolio.ts`

> این type کانونی برای فیلد `breakdown` در جدول `port_snapshots` است.  
> هر تغییر در این ساختار **باید** با افزایش `schemaVersion` در `port_snapshots` همراه باشد تا snapshot‌های قدیمی قابل خواندن بمانند.

```typescript
// نسخه ساختار breakdown — هر تغییر breaking باید schemaVersion را افزایش دهد
export const PORTFOLIO_BREAKDOWN_SCHEMA_VERSION = 1;

export interface InvestmentSection {
  value: string;       // decimal string — نه number
  profitLoss: string;  // decimal string
}

export interface PortfolioBreakdown {
  schemaVersion: number; // باید با port_snapshots.schemaVersion برابر باشد
  investments: {
    total: string;
    profitLoss: string;
    unrealized: string;
    realized: string;
    sections: {
      crypto:      InvestmentSection;
      stocksIran:  InvestmentSection;
      fixedIncome: InvestmentSection;
      metals:      InvestmentSection;
    };
  };
  physicalAssets: {
    total: string;
    profitLoss: string;
  };
  cash: {
    total: string;
  };
  liabilities: {
    total: string;
  };
  allocation: Array<{
    key: string;
    label: string;
    value: string;   // decimal string
    percent: string; // decimal string
  }>;
}

// Migration helper: snapshot قدیمی را به آخرین نسخه تبدیل می‌کند
// باید در service layer پیش از استفاده از breakdown صدا زده شود
export function migrateBreakdown(
  raw: unknown,
  fromVersion: number
): PortfolioBreakdown {
  if (fromVersion === PORTFOLIO_BREAKDOWN_SCHEMA_VERSION) {
    return raw as PortfolioBreakdown;
  }
  // نسخه‌های آینده: migration chain اضافه شود
  throw new Error(`Unknown breakdown schemaVersion: ${fromVersion}`);
}
```

---

## `report.ts`

> این type کانونی برای فیلد `filters` در جدول `rep_presets` است.  
> هر تغییر در این ساختار **باید** با افزایش `filtersSchemaVersion` در `rep_presets` همراه باشد.

```typescript
export const REPORT_FILTERS_SCHEMA_VERSION = 1;

export type ReportType =
  | 'cash_flow'
  | 'income_expense'
  | 'net_worth'
  | 'investment_performance'
  | 'budget_vs_actual'
  | 'tax_summary';

export interface ReportFilters {
  schemaVersion: number;    // باید با rep_presets.filtersSchemaVersion برابر باشد
  dateRange?: {
    from: string;           // ISO 8601 date string
    to: string;
  };
  accountIds?: UUID[];      // null یا empty = همه حساب‌ها
  categoryIds?: string[];   // کدهای cat_categories — null یا empty = همه
  relatedFeatures?: RelatedFeature[]; // فیلتر بر اساس نوع فیچر
  currency?: string;        // ارز نمایش گزارش — null = ارز پایه کاربر
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'category' | 'account';
  // فیلدهای اختصاصی بر اساس reportType
  investmentTypes?: RelatedFeature[];  // فقط برای income_expense و investment_performance
  taxYear?: number;         // فقط برای tax_summary
}

// Migration helper: preset قدیمی را به آخرین نسخه تبدیل می‌کند
export function migrateReportFilters(
  raw: unknown,
  fromVersion: number
): ReportFilters {
  if (fromVersion === REPORT_FILTERS_SCHEMA_VERSION) {
    return raw as ReportFilters;
  }
  // نسخه‌های آینده: migration chain اضافه شود
  throw new Error(`Unknown filters schemaVersion: ${fromVersion}`);
}
```

---

## `events.ts`

```typescript
// قانون: تمام مبالغ مالی در payload رویدادها string هستند (نه number)
// تا با Decimal.js سازگار باشند و از floating-point error جلوگیری شود (طبق قانون ۳)

export type AppEvent =
  // حساب و تراکنش
  | { type: 'TransactionCreated'; payload: { transactionId: UUID; transactionType: TransactionType } }
  | { type: 'AccountBalanceUpdated'; payload: { accountId: UUID; newBalance: string } }  // string — مبلغ مالی
  // بودجه
  | { type: 'BudgetExceeded'; payload: { budgetId: UUID; envelopeId: UUID; amount: string } }  // string — مبلغ مالی
  | { type: 'BudgetUpdated'; payload: { budgetId: UUID; envelopeId: UUID; remainingAmount: string } }  // string — مبلغ مالی
  // سرمایه‌گذاری
  | { type: 'InvestmentValueUpdated'; payload: { investmentType: RelatedFeature; investmentId: UUID; newValue: string; previousValue: string } }  // string — مبالغ مالی
  | { type: 'PortfolioSnapshotCreated'; payload: { snapshotId: UUID; date: Timestamp } }
  // وام
  | { type: 'LoanPaymentDue'; payload: { loanId: UUID; dueDate: Timestamp } }
  | { type: 'LoanPaymentMade'; payload: { loanId: UUID; transactionId: UUID; amount: string } }  // string — مبلغ مالی
  // چک
  | { type: 'ChequeDue'; payload: { chequeId: UUID; dueDate: Timestamp } }
  | { type: 'ChequeStatusChanged'; payload: { chequeId: UUID; newStatus: string } }
  // فلزات
  | { type: 'MetalsDeliveryStatusChanged'; payload: { deliveryId: UUID; newStatus: string } }
  // مالیات
  | { type: 'TaxDue'; payload: { taxId: UUID; dueDate: Timestamp } }
  | { type: 'TaxPaid'; payload: { taxId: UUID; amount: string; transactionId: UUID } }  // string — مبلغ مالی
  // دریافت قیمت (Price Fetching — فیچر ۱۹)
  | { type: 'PriceFetchCompleted'; payload: PriceFetchResult }
  | { type: 'PriceFetchStarted'; payload: { symbols: string[]; assetCategory: AssetCategory; triggeredBy: 'user_click' | 'auto_sync' } }
  // نسخه برنامه
  | { type: 'VersionUpdateAvailable'; payload: { currentVersion: string; latestVersion: string; releaseNotesUrl: string } };
```

---

---

## `precision.ts` — تعریف مرکزی Precision برای همه انواع مقادیر عددی

> **باگ ۲۲ — نبود تعریف مرکزی Precision (رفع‌شده)**  
> پیش از این، تمام فیلدها فقط با `decimal` توصیف می‌شدند بدون اینکه `scale` یا `precision` برای هر نوع مقدار مشخص باشد. `BTC quantity`، `IRR amount`، `stock quantity`، `fund NAV`، `exchange rate` — همه به شکل واحد توصیف شده بودند. این فایل آن ابهام را برطرف می‌کند.

```typescript
// core/types/precision.ts
// ─────────────────────────────────────────────────────────────────────────────
// تعریف مرکزی Precision برای همه انواع مقادیر عددی در سیستم
//
// قانون طلایی:
//   - هر نوع مقدار (Money, Quantity, Price, Rate, Percentage, NAV) یک
//     precision/scale مستقل دارد.
//   - همه محاسبات در Domain Layer با decimal.js و این ثابت‌ها انجام می‌شوند.
//   - SQLite storage type (INTEGER یا TEXT) در db.md تعریف شده — اینجا فقط
//     precision دقیق هر نوع مقدار تعریف می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import Decimal from 'decimal.js';

// ─── ۱. Money (مبالغ مالی) ───────────────────────────────────────────────────
// فیلدهای: totalAmount, totalAmountBase, averageBuyPrice, currentBalance,
//           cashBalance, feeAmount, totalInvested, priceBase, totalFeesPaidBase
//
// ذخیره: INTEGER (minor unit) در SQLite
// Precision: تعداد اعشار = scale ارز (از CURRENCY_SCALE در minorUnit.ts)
// گرد کردن: ROUND_HALF_UP — استاندارد حسابداری
//
// نکته: Money precision به currency وابسته است — از toMinorUnit/fromMinorUnit
//        در utils/money/minorUnit.ts استفاده شود، نه مستقیم از این فایل.
export const MONEY_ROUNDING = Decimal.ROUND_HALF_UP;

// ─── ۲. Quantity (تعداد دارایی) ──────────────────────────────────────────────
// فیلدهای: quantity در inv_crypto_holdings/transactions, inv_metals_holdings/transactions
//
// ذخیره: TEXT (decimal string) در SQLite
// Precision: به نوع دارایی بستگی دارد (جدول زیر)
// گرد کردن: ROUND_DOWN — هرگز مقدار بیشتر از آنچه هست نشان داده نشود
//            (safer for P&L: کمتر دارایی را بیشتر نشان دادن بدتر است)
export const QUANTITY_ROUNDING = Decimal.ROUND_DOWN;

export const ASSET_QUANTITY_PRECISION: Record<string, number> = {
  // رمزارزها
  BTC:  8,   // 1 satoshi = 0.00000001 BTC
  ETH:  9,   // 1 Gwei    = 0.000000001 ETH (Gwei-based, نه Wei)
  USDT: 6,   // 1 micro   = 0.000001 USDT
  BNB:  8,
  XRP:  6,
  SOL:  9,
  // برای ERC-20 Tokenهای ناشناخته با 18 decimal:
  // از precision=18 استفاده کنید اما هنگام نمایش به 8 رقم گرد کنید
  DEFAULT_CRYPTO: 18,  // محافظه‌کارانه‌ترین حالت برای Tokenهای ناشناخته

  // فلزات (بر اساس واحد نگهداری)
  GOLD_GRAM:   4,   // مثلاً 0.0001 گرم
  SILVER_GRAM: 4,
  GOLD_COIN:   2,   // سکه — بعید است کمتر از 0.01 باشد
  DEFAULT_METAL: 4,

  // سهام ایران / صندوق
  STOCK_IRAN: 0,   // واحد کامل — سهام ایران صحیح است
  FIF_UNIT:   2,   // واحد صندوق — معمولاً صحیح اما بعضی صندوق‌ها اعشار دارند
};

/**
 * گرد کردن Quantity با ROUND_DOWN به precision مناسب دارایی
 * مثال: roundQuantity('0.123456789', 'BTC') → Decimal('0.12345678')
 */
export function roundQuantity(qty: string | Decimal, assetKey: string): Decimal {
  const precision = ASSET_QUANTITY_PRECISION[assetKey] ?? ASSET_QUANTITY_PRECISION['DEFAULT_CRYPTO'];
  return new Decimal(qty).toDecimalPlaces(precision, QUANTITY_ROUNDING);
}

// ─── ۳. Price (قیمت دارایی — نرخ مرجع) ──────────────────────────────────────
// فیلدهای: price_history.price, price در inv_crypto_transactions (به ارز currency)
//
// ذخیره: TEXT (decimal string) در SQLite
// Precision: به جفت ارز بستگی دارد
// گرد کردن: ROUND_HALF_UP — قیمت‌ها معمولاً با این گرد می‌شوند
export const PRICE_ROUNDING = Decimal.ROUND_HALF_UP;

export const PRICE_PRECISION: Record<string, number> = {
  // قیمت رمزارز به IRR
  'BTC/IRR':  0,   // ریال — اعشار معنا ندارد (مثلاً ۴,۵۰۰,۰۰۰,۰۰۰)
  'ETH/IRR':  0,
  'USDT/IRR': 0,

  // قیمت رمزارز به USDT
  'BTC/USDT':  2,   // مثلاً 65432.12
  'ETH/USDT':  2,
  'SOL/USDT':  4,   // مثلاً 145.3456
  'DEFAULT/USDT': 8, // برای altcoin‌های ارزان با قیمت بسیار پایین

  // قیمت فلز به IRR (هر گرم)
  'GOLD/IRR':   0,
  'SILVER/IRR': 0,

  // قیمت سهام ایران (ریال)
  'STOCK/IRR': 0,

  // NAV صندوق (ریال)
  'FIF/IRR': 0,
};

/**
 * گرد کردن Price با ROUND_HALF_UP به precision مناسب جفت ارز
 * مثال: roundPrice('65432.123456', 'BTC', 'USDT') → Decimal('65432.12')
 */
export function roundPrice(price: string | Decimal, assetSymbol: string, quoteCurrency: string): Decimal {
  const key = `${assetSymbol}/${quoteCurrency}`;
  const defaultKey = `DEFAULT/${quoteCurrency}`;
  const precision =
    PRICE_PRECISION[key] ??
    PRICE_PRECISION[defaultKey] ??
    8; // محافظه‌کارانه‌ترین fallback
  return new Decimal(price).toDecimalPlaces(precision, PRICE_ROUNDING);
}

// ─── ۴. Rate (نرخ تبدیل ارز) ─────────────────────────────────────────────────
// فیلدهای: cur_exchange_rates.rate, exchangeRateToBase در تراکنش‌ها
//
// ذخیره: TEXT (decimal string) در SQLite
// Precision: بالاتر از Price — چون نرخ ضربدر مبلغ بزرگ می‌شود و خطا تجمیع می‌شود
// گرد کردن: ROUND_HALF_UP
export const RATE_ROUNDING = Decimal.ROUND_HALF_UP;
export const RATE_PRECISION = 10; // 10 رقم اعشار برای همه نرخ‌های تبدیل

/**
 * گرد کردن Rate
 * مثال: roundRate('0.0000166667') → Decimal('0.0000166667')
 */
export function roundRate(rate: string | Decimal): Decimal {
  return new Decimal(rate).toDecimalPlaces(RATE_PRECISION, RATE_ROUNDING);
}

// ─── ۵. Percentage (درصد) ────────────────────────────────────────────────────
// فیلدهای: allocation.percent در PortfolioBreakdown، سود/زیان درصدی
//
// ذخیره: TEXT (decimal string) در SQLite
// Precision: 4 رقم اعشار (مثلاً 12.3456%)
// گرد کردن: ROUND_HALF_UP
export const PERCENTAGE_ROUNDING = Decimal.ROUND_HALF_UP;
export const PERCENTAGE_PRECISION = 4;

/**
 * گرد کردن Percentage
 * مثال: roundPercentage('12.345678') → Decimal('12.3457')
 */
export function roundPercentage(pct: string | Decimal): Decimal {
  return new Decimal(pct).toDecimalPlaces(PERCENTAGE_PRECISION, PERCENTAGE_ROUNDING);
}

// ─── ۶. NAV (ارزش خالص دارایی صندوق) ────────────────────────────────────────
// فیلدهای: inv_fif_funds.currentNAV, price_history.price (برای FIF)
//
// ذخیره: TEXT (decimal string) در SQLite
// Precision: طبق مقررات سازمان بورس ایران — NAV به ریال با ۰ اعشار
//            (صندوق‌های دلاری: 2 اعشار)
// گرد کردن: ROUND_HALF_UP
export const NAV_ROUNDING = Decimal.ROUND_HALF_UP;

export const NAV_PRECISION: Record<string, number> = {
  IRR: 0,   // ریال: بدون اعشار (مطابق بورس ایران)
  USD: 2,
  DEFAULT: 0,
};

/**
 * گرد کردن NAV
 */
export function roundNAV(nav: string | Decimal, currency: string = 'IRR'): Decimal {
  const precision = NAV_PRECISION[currency] ?? NAV_PRECISION['DEFAULT'];
  return new Decimal(nav).toDecimalPlaces(precision, NAV_ROUNDING);
}

// ─── ۷. جدول خلاصه — یک نگاه ────────────────────────────────────────────────
//
// | نوع          | Precision        | Rounding      | SQLite    | مثال                    |
// |--------------|------------------|---------------|-----------|-------------------------|
// | Money        | per-currency     | ROUND_HALF_UP | INTEGER   | 123456 (minor unit)     |
// | Quantity     | per-asset (0-18) | ROUND_DOWN    | TEXT      | "0.00000001" (BTC)      |
// | Price        | per-pair (0-8)   | ROUND_HALF_UP | TEXT      | "65432.12" (BTC/USDT)   |
// | Rate         | 10               | ROUND_HALF_UP | TEXT      | "0.0000166667"          |
// | Percentage   | 4                | ROUND_HALF_UP | TEXT      | "12.3456"               |
// | NAV          | per-currency(0-2)| ROUND_HALF_UP | TEXT      | "45231" (IRR)           |
```

> **قانون استفاده**: هر فیچر که با مقادیر عددی کار می‌کند باید از توابع `round*` این فایل استفاده کند — نه `toFixed()` دستی با عدد هاردکد. این تضمین می‌کند اگر precision تغییر کرد، فقط یک‌جا آپدیت می‌شود.


## قوانین

1. Types مشترک **فقط** اینجا تعریف شوند؛ Types اختصاصی یک فیچر داخل همان فیچر بمانند.
2. از `any` پرهیز شود — به‌جای آن `unknown` با type guard.
3. مبالغ مالی در Types به‌صورت `string` (نه `number`) تعریف شوند تا با Decimal.js سازگار باشند و floating-point error ایجاد نشود.
4. `TransactionType` باید همیشه با enum فیلد `type` در `acc_transactions` یکی باشد.
5. تمام جداول با ارتباط چندریختی (Polymorphic) دقیقاً از `relatedFeature: RelatedFeature` و `relatedId: UUID` استفاده کنند — نام دیگری مجاز نیست.
6. هر رویداد جدید در `AppEvent` باید در `core/services/services.md` (بخش Event Bus) هم مستند شود.
