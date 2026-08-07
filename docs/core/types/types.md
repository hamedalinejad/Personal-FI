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
  | 'withdrawal-expense-tax'  // برای مالیات
  | 'deposit-income-tax'      // برای بازگشت مالیات
  | 'withdrawal-cheque'       // برای چک‌ها
  | 'deposit-cheque'
  | 'deposit-budget'          // تخصیص از بودجه
  | 'withdrawal-budget';      // برداشت از هدف

// events.ts
export type AppEvent =
  | { type: 'TransactionCreated'; payload: { transactionId: UUID } }
  | { type: 'AccountBalanceUpdated'; payload: { accountId: UUID } }
  | { type: 'BudgetExceeded'; payload: { budgetId: UUID } }
  | { type: 'LoanPaymentDue'; payload: { loanId: UUID; dueDate: Timestamp } }
  | { type: 'ChequeDue'; payload: { chequeId: UUID; dueDate: Timestamp } }
  | { type: 'TaxDue'; payload: { taxId: UUID; dueDate: Timestamp } };
```

## قوانین

- Types مشترک فقط اینجا تعریف شوند.
- Types مخصوص یک فیچر داخل همان فیچر قرار بگیرند.
- از `any` تا حد امکان استفاده نشود.
- `TransactionType` باید با enum فیلد `type` در جدول `AccountsBanking_transactions` یکی باشد.