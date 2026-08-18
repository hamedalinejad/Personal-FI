# core/types/ — TypeScript Types و Interfaces مشترک

TypeScript Types و Interfaces مشترکی که در کل پروژه استفاده می‌شوند. Types اختصاصی یک فیچر داخل همان فیچر تعریف می‌شوند.

---

## ساختار پوشه

```bash
types/
├── common.ts # انواع پایه (UUID, Timestamp, DateRange, ...)
├── currency.ts # CurrencyCode، ExchangeRate
├── transaction.ts # TransactionType، RelatedFeature
├── price.ts # AssetCategory، PriceFetchResult (برای Price Fetching)
├── events.ts # AppEvent (Event Bus)
└── index.ts # re-export مرکزی
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
// کدهای شناخته‌شده — لیست بسته برای typecheck؛ ارز جدید = افزودن literal + ردیف registry
export type FiatCurrencyCode = 'IRR' | 'USD' | 'EUR' | 'AED' | 'GBP' | 'TRY';
export type WellKnownCryptoCurrencyCode = 'BTC' | 'ETH' | 'USDT' | 'USDC' | 'BNB' | 'XRP' | 'SOL';

/** کد ارز در runtime از registry می‌آید؛ TypeScript: برند برای جلوگیری از string آزاد تصادفی */
export type CurrencyCode = string & { readonly __currencyBrand: unique symbol };
// در عمل: as CurrencyCode فقط پس از validate در CurrencyRegistry

export type PriceCurrency = CurrencyCode; // هر ارز quote مجاز پس از registry

export interface CurrencyRecord {
  code: string;           // IRR, USD, USDT, ...
  name: string;
  symbol: string;         // ﷼, $, ...
  type: 'fiat' | 'crypto' | 'stablecoin' | 'other';
  minorUnit: number;      // 0 for IRR often, 2 for USD, 8 for BTC display policy
  precision: number;      // decimal places for storage/calc
  roundingMode: 'HALF_UP' | 'HALF_EVEN' | 'FLOOR';
  isCrypto: boolean;
  network?: string;       // فقط اگر این «ارز شبکه» باشد — معمولاً خالی؛ شبکه روی Asset است
  isActive: boolean;
}

export interface ExchangeRate {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: string;
  asOf: Timestamp; // historical
  timestamp: Timestamp; // when recorded
}
```

> **USDT** در `CurrencyRecord.type = 'stablecoin'` ثبت می‌شود. **Asset کریپتو** (مثلاً USDT-TRC20) در Asset Registry جداست — Currency ≠ Asset.

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
 | 'goals'
 | 'bills'
 | 'documents'
 | 'price' // لینک به price_history / sync در صورت نیاز
 | 'accounts'; // انتقال/تعدیل مستقیم حساب

// این Union منبع حقیقت TypeScript است.
// افزودن فیچر جدید با polymorphic link = (1) افزودن literal اینجا (2) ثبت در جدول registry زیر در db.md
// هیچ فایل فیچری حق ندارد string آزاد برای relatedFeature بنویسد.
```

---

## `price.ts`

```typescript
// دسته‌بندی دارایی در price_history و price_sources
export type AssetCategory = 'crypto' | 'stock' | 'fif' | 'metal';

// طبقه‌بندی خطای شبکه/پاسخ — فقط برای failed[]
// api_key_required و offline در skipped[] می‌روند (نه failed[]) — به Price-Fetching.md/مراجعه شود
export type PriceFailureKind =
 | 'network_error'
 | 'timeout'
 | 'http_error'
 | 'invalid_payload'
 | 'validation_error'
 | 'rate_limit'
 | 'not_found';

// دلایل مجاز برای skipped[] — بخشی از PriceFetchResult
export type PriceSkipReason =
 | 'offline' // navigator.onLine === false
 | 'api_key_required'; // منبع requiresApiKey=true ولی کلید در Session Storage نیست

// خروجی عملیات دریافت قیمت از API
export interface PriceFetchResult {
  fetchRequestId: string;
  succeeded: Array<{ instrumentId: string; price: string; deduped?: boolean }>;
  failed: Array<{ instrumentId: string; reason: string; failureKind: PriceFailureKind; httpStatus?: number }>;
  skipped?: Array<{ instrumentId?: string; reason: PriceSkipReason | string }>;
  fetchedAt: Timestamp;
  triggeredBy: 'user_click' | 'auto_sync';
}

// آخرین قیمت کش‌شده یک نماد
export interface CachedPrice {
 instrumentId: string;
 displaySymbol?: string;
 assetCategory: AssetCategory;
 price: string; // decimal string
 priceCurrency: PriceCurrency;
 source: 'manual' | 'api';
 sourceId?: string;
 fetchedAt: Timestamp;
 priceAgeMs: number;
 staleAfterMs: number;
 isStale: boolean; // priceAgeMs > staleAfterMs
}

// --- Provider Adapter Contract — تعریف کامل رفتاری در Price-Fetching.md ---
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

// مرز عمومی اپ فقط PriceFetchResult است.
// ProviderFetchResult خروجی خام Adapter است؛ Application آن را به PriceFetchResult نگاشت می‌کند.
// Crypto/Stocks wrappers نباید نوع سومی با Decimal class در public API تعریف کنند.

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
 | { type: 'AccountBalanceUpdated'; payload: { accountId: UUID; newBalance: string } // decimal string }
 // بودجه
 | { type: 'BudgetExceeded'; payload: { budgetId: UUID; envelopeId: UUID; amount: string } }
 | { type: 'BudgetUpdated'; payload: { budgetId: UUID; envelopeId: UUID; remainingAmount: string } }
 // سرمایه‌گذاری
 | { type: 'InvestmentValueUpdated'; payload: { investmentType: RelatedFeature; investmentId: UUID; newValue: string; previousValue: string } }
 | { type: 'PortfolioSnapshotCreated'; payload: { snapshotId: UUID; date: Timestamp } }
 // وام
 | { type: 'LoanPaymentDue'; payload: { loanId: UUID; dueDate: Timestamp } }
 | { type: 'LoanPaymentMade'; payload: { loanId: UUID; transactionId: UUID; amount: string } }
 // چک
 | { type: 'ChequeDue'; payload: { chequeId: UUID; dueDate: Timestamp } }
 | { type: 'ChequeStatusChanged'; payload: { chequeId: UUID; newStatus: string } }
 // فلزات
 | { type: 'MetalsDeliveryStatusChanged'; payload: { deliveryId: UUID; newStatus: string } }
 // مالیات
 | { type: 'TaxDue'; payload: { taxId: UUID; dueDate: Timestamp } }
 | { type: 'TaxPaid'; payload: { taxId: UUID; amount: string; transactionId: UUID } }
 // دریافت قیمت (Price Fetching — فیچر ۱۹)
 | { type: 'PriceFetchCompleted'; payload: PriceFetchResult }
 | { type: 'PriceFetchStarted'; payload: { instrumentIds: string[]; assetCategory: AssetCategory; triggeredBy: 'user_click' | 'auto_sync' } }
 // نسخه برنامه
 | { type: 'VersionUpdateAvailable'; payload: { currentVersion: string; latestVersion: string; releaseNotesUrl: string } };

export interface EventBus {
 /**
 * انتشار یک رویداد — sync و بلاکینگ:
 * همه handlerهای ثبت‌شده برای این type به‌ترتیب ثبت فراخوانی می‌شوند.
 * خروجی: void
 */
 emit<T extends AppEvent['type']>(
 type: T,
 payload: Extract<AppEvent, { type: T }>['payload']
 ): void;

 /**
 * ثبت یک handler برای یک نوع رویداد.
 * خروجی: تابع unsubscribe — فراخوانی آن handler را از لیست حذف می‌کند.
 * الگوی استفاده: const unsub = eventBus.subscribe('TransactionCreated', handler)
 * // هنگام cleanup: unsub
 */
 subscribe<T extends AppEvent['type']>(
 type: T,
 handler: (payload: Extract<AppEvent, { type: T }>['payload']) => void
 ): () => void;
}
```

---

## `reconciliation.ts`

```typescript
export interface ReconcileResult {
 target: string;
 ok: boolean;
 expected: string; // decimal string
 actual: string;
 delta: string;
 details?: string;
}

export type ReconcileScope =
 | 'account'
 | 'crypto_holding'
 | 'brokerage'
 | 'stock_holding'
 | 'fund'
 | 'metals_holding'
 | 'loan'
 | 'portfolio'
 | 'all';
```

### یادآوری تاریخ

- `Timestamp` = لحظه UTC
- تاریخ کسب‌وکار/بازار/سررسید = فیلد جدا `YYYY-MM-DD` در مدل فیچر مربوطه، نه فقط Timestamp

## قوانین

1. Types مشترک **فقط** اینجا تعریف شوند؛ Types اختصاصی یک فیچر داخل همان فیچر بمانند.
2. از `any` پرهیز شود — به‌جای آن `unknown` با type guard.
3. مبالغ مالی در Types به‌صورت `string` (نه `number`) تعریف شوند تا با Decimal.js سازگار باشند و floating-point error ایجاد نشود.
4. `TransactionType` باید همیشه با enum فیلد `type` در `acc_transactions` یکی باشد.
5. تمام جداول با ارتباط چندریختی دقیقاً از `relatedFeature: RelatedFeature` و `relatedId: UUID` استفاده کنند. مقدار خارج از Union در compile-time خطا و در runtime validate رد می‌شود.
6. هر رویداد جدید در `AppEvent` باید در `core/services/services.md` (بخش Event Bus) هم مستند شود.

---

## راهنمای پیاده‌سازی Types
- فایل‌های واقعی: `transaction.ts`, `price.ts`, `events.ts`, `reconciliation.ts` زیر `core/types/`
- Event payloadها فقط string برای پول
- `RelatedFeature` و `TransactionType` را در فیچرها دوباره تعریف نکنید — import از core
- تست type: `tsc --noEmit` باید fail شود اگر number برای amount استفاده شود
