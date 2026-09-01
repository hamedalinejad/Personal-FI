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
| هر Response نسخه Schema را اعلام می‌کند | |

## Common types

```typescript
type DecimalString = string; // canonical money/qty/rate
type UUID = string;

type ApiSuccess<T> = {
  success: true;
  data: T;
  errors: [];
  meta: {
    request_id: UUID;
    operation_id?: UUID;
    schema_version: string;
  };
};

type ApiFailure = {
  success: false;
  data: null;
  errors: Array<{
    code: string;
    message: string;
    field?: string | null;
    details?: unknown;
  }>;
  meta: {
    request_id: UUID;
    operation_id?: UUID;
    schema_version: string;
  };
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

interface PaginationParams {
  page?: number;
  pageSize?: number;
}
interface DateRange {
  from: string; // ISO timestamp or canonical DATE according to endpoint contract
  to: string;
}
```

### Response contract

`docs/core/API-Requirements.md` و این فایل باید یک envelope واحد داشته باشند:

```json
{
  "success": true,
  "data": {},
  "errors": [],
  "meta": {
    "request_id": "...",
    "operation_id": "...",
    "schema_version": "1.0"
  }
}
```

- `request_id` شناسه request/trace است؛ لزوماً با `operation_id` یکی نیست.
- Commandهای مالی باید `operation_id` داشته باشند.
- Queryهای read-only می‌توانند `operation_id` نداشته باشند.
- خطاهای domain/API همیشه `errors[].code` ماشین‌خوان دارند.

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
  currency: string; // canonical ISO/custom currency code
  accountType: 'current' | 'savings' | 'term_deposit' | 'joint' | 'other';
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

## Standalone Module API

هر Feature باید بتواند با همان Public API در دو حالت bootstrap شود:

```text
Standalone Edition:
  Feature API → Core → Local Settlement Adapter → local DB

Integrated Edition:
  Feature API → Core → Accounts/Cash Adapter → local DB
```

Public API نباید نوع UI، route یا وجود Accounts را پیش‌شرط قرارداد خود قرار دهد.