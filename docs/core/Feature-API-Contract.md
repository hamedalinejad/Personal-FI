# Feature Public API Contract

## دو سطح API

| سطح | مثال | نقش |
|-----|------|-----|
| **Command** | `createBuy`, `recordExpense`, `correctTransaction`, `void…` | تغییر state مالی |
| **Query** | `getHolding`, `listTransactions`, `calculatePL`, `getSummary` | فقط خواندن / محاسبه |

```text
cryptoApi.createBuy(req) → Result { operationId, ... }
cryptoApi.getHolding(id)
```

## نه HTTP اجباری در v1

```text
Feature Public API = TypeScript module interface (in-process)
```

همان Contract بعداً می‌تواند پشت REST / IPC / Mobile Bridge / Cloud باشد.  
**Offline-first:** UI → `cryptoApi.*` مستقیم؛ بدون وابستگی به server.

## هر Command

```text
Request  +  Result  +  FinancialError
operationId در Result (و در request برای idempotency)
```

Trace:

```text
UI → API → runAtomicFinancialOperation(operationId)
  → Domain → Journal → Cash → Audit
```

## sourceType روی داده مالی (Raw)

| sourceType | |
|------------|--|
| `manual` | ورود کاربر |
| `import` | CSV/JSON/batch عمومی |
| `bank_statement` | صورت‌حساب بانک |
| `broker_statement` | گزارش کارگزاری |
| `exchange_api` | (نادر؛ بیشتر قیمت) |
| `api` | generic remote |
| `system` | fee/system generated |
| `opening` | موجودی اولیه |
| `correction` | بعد از reversal |
| `migration` | مهاجرت نسخه |

اختیاری: `sourceReference` (مثلاً `statement-1405-04.csv`, `broker-report-123`).

**ممنوع:** گم شدن منشأ تراکنش بعد از import.

---

## ساختار استاندارد هر Feature

```text
feature/
  commands/   buy, sell, transfer, correct, void, …
  queries/    getHolding, listTransactions, getPortfolio, calculatePL, …
  events/     (emit پس از persist)
```

مثال: `crypto.commands.buy()` · `crypto.queries.getHolding()`

یکنواختی برای Web / PWA / Electron / Mobile / REST آینده — v1 همچنان **TypeScript in-process** است نه HTTP.

### Provenance fields (روی هر domain financial row)

`sourceType` · `sourceReference` · `sourceDocumentId?` · `importBatchId?` · `sourceTransactionId?` (external)

بدون provenance، audit «این مبلغ از کجا آمد؟» ممکن نیست.

---

## featureId پایدار (نه شماره Product)

| Presentation # | featureId canonical |
|----------------|---------------------|
| ۱ | `accounts` |
| ۳ | `income` |
| ۴ | `expense` |
| ۶ | `loan` |
| ۷ crypto | `investment.crypto` |
| … | `investment.stocks` / `fif` / `metals` |

شماره Product فقط presentation است؛ dependency و code با **featureId** پایدار.

### ساختار پوشه Feature

```text
feature/
  api/
  commands/
  queries/
  domain/
  events/     # optional
```

**ممنوع:** Feature مستقیم SQL جدول Feature دیگر را بخواند/بنویسد.  
مجاز: Feature → Core API / Accounting Core / public API فیچر دیگر.

## قانون طلایی ماژول

```ts
// هر فیچر فقط Public API export می‌کند
export const AccountsAPI = { createAccount, list, ... }
// import از فیچر دیگر ❌ — فقط core و public API مجاز
```

---

## Standalone Capable (محصول)

هر Feature باید بتواند بدون UI سایر Featureها:

create / list / pay / report همان دامنه

را ارائه دهد.

وابستگی فقط به **Core** (Operation, Journal, Currency, Instrument) — نه به UI صفحه Accounting.

Ledger همچنان مرکزی است.

---

## چهار بخش هر Feature API

```text
commands / queries / events / capabilities()
```

مثال:

```ts
loan.capabilities() → {
  supportsInterest: true,
  supportsVariableRate: true,
  supportsCollateral: true,
  requiresAccountingUI: false,
  requiresBankAccount: false
}
```

HTTP در v1 لازم نیست — TypeScript interface؛ بعداً REST/IPC/Mobile.


---

## ساختار توصیه‌شده هر Feature: commands / queries (P0)

هر Feature دو سطح اصلی دارد — نه صدها endpoint ریز:

```text
loans.commands.createLoan
loans.commands.recordPayment
loans.commands.reversePayment

loans.queries.getLoan
loans.queries.getSchedule
loans.queries.getStatement
```

همین الگو برای crypto / stocks / funds / metals / accounts / …

| سطح | نقش | مثال |
|-----|------|------|
| `*.commands.*` | تغییر state مالی (atomic) | createBuy, recordPayment |
| `*.queries.*` | فقط خواندن / محاسبه | getHolding, getSchedule |

Command همیشه از `runAtomicFinancialOperation` می‌گذرد.

---

## Transport-Agnostic (P0)

Domain و Feature API **نمی‌دانند** transport چیست:

```text
REST · IPC · Electron · Desktop · Mobile · Cloud
```

Contract فقط:

```text
Request
Response
Error
operationId
```

v1: TypeScript in-process module.  
آینده: همان contract پشت REST/IPC بدون تغییر Domain.

---

## لایه Capability (P0)

```text
UI → Feature API → Capability API → Domain → Persistence
```

جزئیات لیست Capabilityها: `Capability-API.md`.

v1 = TypeScript in-process (تأیید). HTTP از روز اول اجباری نیست.

---

## Error Code و Correlation (P2)

هر پاسخ خطای Feature/Capability API:

```text
{
  errorCode: "IDEMPOTENCY_CONFLICT" | "VALIDATION" | "PERSIST_FAILED" | …
  message: string  // کاربرپسند یا فنی جدا
  correlationId: string  // معمولاً operationId یا request id
  details?: …
}
```

لاگ آفلاین محلی می‌تواند همین correlationId را نگه دارد تا عیب‌یابی بدون سرور ممکن باشد.

---
## P0-016 — operationId on every financial command

هر command مالی Feature (create/pay/buy/sell/correct/...):

```text
operationId: required UUID
```

بدون operationId → reject قبل از write.

## P0-017 — same id different command = conflict

```text
same operationId + same commandHash → return prior result
same operationId + different commandHash → IDEMPOTENCY_CONFLICT (no write)
```

Feature docs must not imply «retry با body جدید و همان id موفق می‌شود».


---

## Shared list contract (CROSS-CUTTING §2)

```ts
interface ListQuery {
  cursor?: string
  offset?: number
  limit: number
  sort?: { field: string; direction: 'asc' | 'desc' }[]
  filters?: Record<string, unknown>
  asOf?: string
}
interface ListResult<T> {
  items: T[]
  nextCursor?: string
  totalCount?: number
}
```

## Standard Feature surface (CROSS-CUTTING §3)

| Method | Rule |
|--------|------|
| getById | required for primary entities |
| list(ListQuery) | required |
| reconcile | required if feature has projections/snapshots |
| rebuild | required if feature has projections/snapshots |

Reconcile does not silent-mutate; rebuild rebuilds from ledger/SoT. See CROSS-CUTTING-CONTRACTS-BATCH.md.

## Labels vs semantic names (CROSS-CUTTING BATCH-5 §5)

API/DB field names are semantic and stable. User-facing labels come from i18n/mapping docs only and must not rename domain fields.

