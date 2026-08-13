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

// طبقه‌بندی خطای شبکه/پاسخ (باگ ۳۸)
export type PriceFailureKind =
  | 'network_error'
  | 'timeout'
  | 'http_error'
  | 'invalid_payload'
  | 'validation_error'
  | 'rate_limit'
  | 'not_found'
  | 'api_key_required'
  | 'offline';

// خروجی عملیات دریافت قیمت از API
export interface PriceFetchResult {
  fetchRequestId: string; // باگ ۴۲
  succeeded: Array<{ symbol: string; price: string; deduped?: boolean }>;
  failed: Array<{ symbol: string; reason: string; failureKind: PriceFailureKind; httpStatus?: number }>;
  skipped?: Array<{ symbol?: string; reason: PriceFailureKind | string }>;
  fetchedAt: Timestamp;
  triggeredBy: 'user_click' | 'auto_sync';
}

// آخرین قیمت کش‌شده یک نماد (باگ ۴۰)
export interface CachedPrice {
  symbol: string;
  assetCategory: AssetCategory;
  price: string; // decimal string — نه number
  priceCurrency: PriceCurrency;
  source: 'manual' | 'api';
  sourceId?: string;
  fetchedAt: Timestamp;
  priceAgeMs: number;
  staleAfterMs: number;
  isStale: boolean; // priceAgeMs > staleAfterMs
}

// --- Provider Adapter Contract (باگ ۳۶) — تعریف کامل رفتاری در Price-Fetching.md ---
export interface NormalizedPriceQuote {
  symbol: string;
  price: string; // decimal string
  priceCurrency: PriceCurrency | string;
  fetchedAt: string; // ISO datetime
  rawSymbol?: string;
}

export interface ProviderFetchResult {
  succeeded: NormalizedPriceQuote[];
  failed: Array<{ symbol: string; reason: string; failureKind?: PriceFailureKind; httpStatus?: number }>;
  skipped: Array<{ symbol: string; reason: string }>;
}

export interface PriceProviderAdapter {
  readonly adapterKey: string;
  readonly supportedAssetCategories: AssetCategory[];
  readonly maxBatchSize: number;
  fetchPrices(
    symbols: string[],
    options?: { apiKey?: string; signal?: AbortSignal }
  ): Promise<ProviderFetchResult>;
  normalizeSymbol(symbol: string, direction: 'toProvider' | 'toInternal'): string;
  normalizePrice(rawItem: unknown): string | null;
  validateTimestamp(rawItem: unknown): string | null;
  validateCurrency(rawItem: unknown): string | null;
}
```

---

## `events.ts`

```typescript
export type AppEvent =
  // حساب و تراکنش
  | { type: 'TransactionCreated'; payload: { transactionId: UUID; transactionType: TransactionType } }
  | { type: 'AccountBalanceUpdated'; payload: { accountId: UUID; newBalance: number } }
  // بودجه
  | { type: 'BudgetExceeded'; payload: { budgetId: UUID; envelopeId: UUID; amount: number } }
  | { type: 'BudgetUpdated'; payload: { budgetId: UUID; envelopeId: UUID; remainingAmount: number } }
  // سرمایه‌گذاری
  | { type: 'InvestmentValueUpdated'; payload: { investmentType: RelatedFeature; investmentId: UUID; newValue: number; previousValue: number } }
  | { type: 'PortfolioSnapshotCreated'; payload: { snapshotId: UUID; date: Timestamp } }
  // وام
  | { type: 'LoanPaymentDue'; payload: { loanId: UUID; dueDate: Timestamp } }
  | { type: 'LoanPaymentMade'; payload: { loanId: UUID; transactionId: UUID; amount: number } }
  // چک
  | { type: 'ChequeDue'; payload: { chequeId: UUID; dueDate: Timestamp } }
  | { type: 'ChequeStatusChanged'; payload: { chequeId: UUID; newStatus: string } }
  // فلزات
  | { type: 'MetalsDeliveryStatusChanged'; payload: { deliveryId: UUID; newStatus: string } }
  // مالیات
  | { type: 'TaxDue'; payload: { taxId: UUID; dueDate: Timestamp } }
  | { type: 'TaxPaid'; payload: { taxId: UUID; amount: number; transactionId: UUID } }
  // دریافت قیمت (Price Fetching — فیچر ۱۹)
  | { type: 'PriceFetchCompleted'; payload: PriceFetchResult }
  | { type: 'PriceFetchStarted'; payload: { symbols: string[]; assetCategory: AssetCategory; triggeredBy: 'user_click' | 'auto_sync' } }
  // نسخه برنامه
  | { type: 'VersionUpdateAvailable'; payload: { currentVersion: string; latestVersion: string; releaseNotesUrl: string } };
```

---

## قوانین

1. Types مشترک **فقط** اینجا تعریف شوند؛ Types اختصاصی یک فیچر داخل همان فیچر بمانند.
2. از `any` پرهیز شود — به‌جای آن `unknown` با type guard.
3. مبالغ مالی در Types به‌صورت `string` (نه `number`) تعریف شوند تا با Decimal.js سازگار باشند و floating-point error ایجاد نشود.
4. `TransactionType` باید همیشه با enum فیلد `type` در `acc_transactions` یکی باشد.
5. تمام جداول با ارتباط چندریختی (Polymorphic) دقیقاً از `relatedFeature: RelatedFeature` و `relatedId: UUID` استفاده کنند — نام دیگری مجاز نیست.
6. هر رویداد جدید در `AppEvent` باید در `core/services/services.md` (بخش Event Bus) هم مستند شود.
