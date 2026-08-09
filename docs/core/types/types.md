TypeScript Types و Interfaces مشترکی که در کل پروژه استفاده می‌شوند.

## ساختار پیشنهادی

```bash
types/
├── common.ts              # انواع عمومی (ID, DateRange, ...)
├── currency.ts
├── transaction.ts
├── account.ts
├── api.ts                 # انواع پاسخ API و Error
├── events.ts              # انواع Event Bus
└── index.ts
```

## نمونه‌های مهم

```typescript
// common.ts
export type UUID = string;
export type Timestamp = string; // ISO date

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

// currency.ts
export type CurrencyCode = 'IRR' | 'USD' | 'USDT' | 'EUR';

export interface ExchangeRate {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  timestamp: Timestamp;
}

// transaction.ts
export type TransactionType =
  | 'deposit-income'
  | 'withdrawal-expense'
  | 'transfer-in'
  | 'transfer-out'
  | 'deposit-loan'
  | 'withdrawal-loan'
  | 'withdrawal-expense-tax'  // پرداخت مالیات (استفاده‌شده در Tax-Management)
  | 'deposit-income-tax'      // بازگشت مالیات (استفاده‌شده در Tax-Management)
  | 'withdrawal-cheque'       // برای چک‌ها
  | 'deposit-cheque'
  | 'deposit-investment'      // واریز به سرمایه‌گذاری (صادر، کارگزاری، پلتفرم)
  | 'withdrawal-investment';  // برداشت از سرمایه‌گذاری

> **نکته**: مقادیر `deposit-budget`/`withdrawal-budget` عمداً حذف شده‌اند. طبق Financial-Goals.md (بخش Business Rules، مورد ۱۰)، انتقال از پاکت بودجه به هدف (`source=budget`) هیچ تراکنش بانکی واقعی نمی‌سازد و `accountTransactionId` همیشه `null` می‌ماند؛ در نتیجه این دو نوع تراکنش هرگز در `acc_transactions` رخ نمی‌دهند و نگهداری آن‌ها در enum گمراه‌کننده بود.

// related-feature.ts
// این enum مرجع مرکزی و تنها enum معتبر برای فیلد چندریختی relatedFeature در تمام جداول پروژه است
// (acc_transactions, docs_documents, docs_links, notif_notifications, tax_records و هر جدول آینده مشابه).
// هیچ فایل دیگری نباید لیست جداگانه یا مقادیر ناسازگار (مثل investment مبهم) تعریف کند؛
// همه باید مستقیماً به همین enum ارجاع دهند.
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

// events.ts
export type AppEvent =
  | { type: 'TransactionCreated'; payload: { transactionId: UUID; transactionType: string } }
  | { type: 'AccountBalanceUpdated'; payload: { accountId: UUID; newBalance: number } }
  | { type: 'BudgetExceeded'; payload: { budgetId: UUID; envelopeId: UUID; amount: number } }
  | { type: 'BudgetUpdated'; payload: { budgetId: UUID; envelopeId: UUID; remainingAmount: number } }
  | { type: 'InvestmentValueUpdated'; payload: { investmentType: string; investmentId: UUID; newValue: number; previousValue: number } }
  | { type: 'PortfolioSnapshotCreated'; payload: { snapshotId: UUID; date: Timestamp } }
  | { type: 'LoanPaymentDue'; payload: { loanId: UUID; dueDate: Timestamp } }
  | { type: 'LoanPaymentMade'; payload: { loanId: UUID; transactionId: UUID; amount: number } }
  | { type: 'ChequeDue'; payload: { chequeId: UUID; dueDate: Timestamp } }
  | { type: 'ChequeStatusChanged'; payload: { chequeId: UUID; newStatus: string } }
  | { type: 'MetalsDeliveryStatusChanged'; payload: { deliveryId: UUID; newStatus: string } }
  | { type: 'TaxDue'; payload: { taxId: UUID; dueDate: Timestamp } }
  | { type: 'TaxPaid'; payload: { taxId: UUID; amount: number; transactionId: UUID } };
```

## قوانین

- Types مشترک فقط اینجا تعریف شوند.
- Types مخصوص یک فیچر داخل همان فیچر قرار بگیرند.
- از `any` تا حد امکان استفاده نشود.
- `TransactionType` باید با enum فیلد `type` در جدول `acc_transactions` یکی باشد.
- تمام جداول با ارتباط چندریختی (Polymorphic) باید دقیقاً از نام‌گذاری `relatedFeature` (نوع: `RelatedFeature`) و `relatedId` (نوع: UUID) استفاده کنند — هیچ نام دیگری (مثل `transactionType`/`transactionId`) مجاز نیست.