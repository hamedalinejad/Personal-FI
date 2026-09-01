# API Reference — Personal-FI

v1 = **in-process TypeScript Feature API** (نه HTTP اجباری). همان Contract بعداً REST/IPC می‌شود.

اصول و مرزها: `docs/core/Feature-API-Contract.md` · عملیات اتمی: `Canonical-Financial-Operation.md`

## اصول

| اصل | |
|-----|--|
| همه Commandها async | |
| ورودی/خروجی typed (نه any مالی) | |
| مبالغ: `DecimalString` (string) | |
| خطا: `FinancialError` با code | |
| هر Command مالی: `operationId` (+ idempotency) | |
| Query **write ندارد** | |
| Feature فقط public API export می‌کند | |

## Common types

```typescript
type DecimalString = string; // canonical money/qty/rate
type UUID = string;

interface ApiResult<T> {
  ok: true;
  data: T;
  operationId?: UUID;
}
interface ApiError {
  ok: false;
  error: { code: string; message: string; details?: unknown };
}
type ApiResponse<T> = ApiResult<T> | ApiError;

interface PaginationParams {
  page?: number;
  pageSize?: number;
}
interface DateRange {
  from: string; // ISO
  to: string;
}
```

## الگوی هر Feature

```text
feature/
  commands/   → create*, record*, correct*, void*, …
  queries/    → get*, list*, calculate*, getSummary*
  events/     → پس از persist
```

### نمونه Accounts

```typescript
interface CreateAccountRequest {
  name: string;
  currency: string; // IRR canonical
  accountType: 'qarz' | 'sep' | 'modat' | 'jame' | 'other';
}
interface CreateAccountResponse {
  id: UUID;
  // balance derived — not authoritative number
}

// AccountsAPI.createAccount(req) → runAtomicFinancialOperation(...)
```

### نمونه Crypto

```typescript
// crypto.commands.buy / sell / transfer
// crypto.queries.getHolding / calculatePL
// همیشه instrumentId نه symbol به‌عنوان identity
```

### نمونه Loan

```typescript
// loan.commands.disburse / payInstallment / …
// residual last installment + qarz dual journal — Implementation-Pitfalls
```

## اتصال فیچرها

```text
UI → Feature Public API → Domain → runAtomicFinancialOperation → DB
```

**ممنوع:** UI → SQL · Feature A → جدول Feature B

وابستگی‌ها: `Domain-Dependency-Matrix.md`

## OpenAPI

برای v1 لازم نیست. در صورت نیاز آینده، از همین TypeScript interfaces تولید می‌شود.

---

## FeatureAPI جدا (P0)

هر فیچر یک facade:

```text
loanAPI = { createLoan, simulateSchedule, payInstallment, restructure, … }
goldAPI / metalsAPI = { addWeight, sell, … }
cryptoAPI = { executeBuy, executeSell, … }
```

UI **فقط** این‌ها (و Capability API) را صدا می‌زند.

**ممنوع در UI:** `db.exec("SELECT * FROM loans")` یا SQL خام.
