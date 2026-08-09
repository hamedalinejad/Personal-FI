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
  | 'deposit-budget'          // تخصیص از بودجه
  | 'withdrawal-budget'       // برداشت از هدف
  | 'deposit-investment'      // واریز به سرمایه‌گذاری (صادر، کارگزاری، پلتفرم)
  | 'withdrawal-investment';  // برداشت از سرمایه‌گذاری

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